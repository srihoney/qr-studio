const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const imp=name=>import('file://'+path.join(ROOT,name));
const html=fs.readFileSync(path.join(ROOT,'public/index.html'),'utf8');
test('public commercial design: five navigation links, no history/version or default QR',()=>{
  assert.equal((html.match(/<nav[^>]+aria-label="Main navigation"/g)||[]).length,1);
  const nav=html.match(/<nav aria-label="Main navigation">(.*?)<\/nav>/)?.[1]||'';
  assert.equal((nav.match(/<a /g)||[]).length,5);
  assert.doesNotMatch(html,/class="mode active"|V2\.0|id="history"|saveHistory|clearHistory|FREE &amp; OPEN SOURCE|Pricing/);
  assert.match(html,/<canvas[^>]*id="qrCanvas"[^>]*>/);
  assert.match(html,/id="themeToggle"/);
});
test('upload/contact/csv and frame placement provided',()=>{
  for(const id of ['hostedFile','uploadButton','uploadChallenge','contactForm','senderEmail','senderMessage','contactChallenge','batchCsv'])assert(html.includes(`id="${id}"`));
  for(const name of ['value="top"','value="bottom"'])assert(html.includes(name));
  assert(!html.includes('@gmail.com'));
});
test('render top and bottom captions in vector SVG/PDF',async()=>{
  const QR=require('../public/assets/js/utils.js'),X=require('../public/assets/js/exports.js');
  const matrix=QR.createMatrix('https://example.com','H');
  const top=X.svgMarkup(matrix,{frame:'top',caption:'SCAN HERE'}),bottom=X.svgMarkup(matrix,{frame:'bottom',caption:'SCAN HERE'});
  assert.match(top,/transform="translate\(0 5\.3\)"/);assert.match(top,/SCAN HERE/);
  assert.doesNotMatch(bottom,/transform="translate\(0 5\.3\)"/);
  assert.match(Buffer.from(X.pdfBytes(matrix,{frame:'top',caption:'SCAN HERE'},'Poster')).toString('latin1'),/SCAN HERE/);
});
test('server file type sniff and limits',async()=>{
 const c=await imp('functions/_lib/common.js');
 assert.equal(c.MAX_BYTES,5242880);assert.equal(c.RETENTION_MS,2592000000);
 assert.equal(c.uploadType('poster.pdf',new Uint8Array([37,80,68,70,45,1,1])), 'application/pdf');
 assert.equal(c.uploadType('malware.html',new Uint8Array([60,104,116,109,108])) ,null);
 assert.equal(c.uploadType('fake.pdf',new Uint8Array([60,104,116,109,108])) ,null);
 assert.equal(c.safeFilename('a\r\n\".pdf'),'a___.pdf');
});
test('backend config is fail-closed and contains no private email',async()=>{
 const {onRequestGet}=await imp('functions/api/config.js');
 const result=await (await onRequestGet({env:{TURNSTILE_SITE_KEY:'site',TURNSTILE_SECRET:'secret',CONTACT_TO:'hidden@example.com'}})).json();
 assert.equal(result.uploadsEnabled,false);assert.equal(result.contactEnabled,false);
 assert(!JSON.stringify(result).includes('hidden@example.com'));
});
test('expired file denies access and valid file serves as attachment',async()=>{
 const {onRequestGet}=await imp('functions/file/[id].js');
 const id='123e4567-e89b-12d3-a456-426614174000';
 let row={id,storage_key:'uploads/'+id,file_name:'poster.pdf',size:7,expires_at:Date.now()-1000};
 const env={DB:{prepare:()=>({bind:()=>({first:async()=>row})})},FILES:{get:async()=>({size:7,body:new Blob(['content']).stream()})}};
 const r=new Request('https://test.example/file/'+id);
 const expired=await onRequestGet({request:r,env,params:{id}});assert.equal(expired.status,410);
 row={...row,expires_at:Date.now()+60e3};
 const valid=await onRequestGet({request:r,env,params:{id}});assert.equal(valid.status,200);
 assert.match(valid.headers.get('Content-Disposition'),/^attachment/);
 assert.match(valid.headers.get('Cache-Control'),/no-store/);
});
test('upload rejects invalid origins and oversized files before writes',async()=>{
 const {onRequestPost}=await imp('functions/api/upload.js');
 const env={FILES:{},DB:{},RATE_SALT:'salt',TURNSTILE_SECRET:'t'};
 const badOrigin=await onRequestPost({env,request:new Request('https://example.com/api/upload',{method:'POST',headers:{Origin:'https://attacker.example','Content-Length':'100'},body:'X'})});
 assert.equal(badOrigin.status,403);
 const big=await onRequestPost({env,request:new Request('https://example.com/api/upload',{method:'POST',headers:{'Content-Length':String(5242880+60001)},body:'X'})});
 assert.equal(big.status,413);
});
test('API routes never enter offline cache',()=>{
 const sw=fs.readFileSync(path.join(ROOT,'public/sw.js'),'utf8');
 assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
 assert.match(sw,/url\.pathname\.startsWith\('\/file\/'\)/);
});

test('mocked upload -> opaque download -> expiry -> scheduled deletion',async()=>{
 const {onRequestPost}=await imp('functions/api/upload.js');const {onRequestGet}=await imp('functions/file/[id].js');
 const {default:cleaner}=await imp('cleanup-worker/src/index.js');
 const originals=global.fetch,rows=new Map(),files=new Map();
 global.fetch=async url=>url.toString().includes('siteverify')?Response.json({success:true,hostname:'freeqrstudio.pages.dev'}):new Response('Unexpected URL',{status:500});
 const DB={prepare(sql){let args=[];return {bind(...a){args=a;return this;},async first(){
   if(sql.startsWith('SELECT COUNT(*) AS count FROM uploads'))return {count:0};
   if(sql.includes('COALESCE(SUM'))return {today:0,active:0};
   if(sql.startsWith('SELECT * FROM uploads'))return rows.get(args[0]);
   return null;},async run(){
     if(sql.startsWith('INSERT INTO uploads'))rows.set(args[0],{id:args[0],storage_key:args[1],file_name:args[2],mime:args[3],size:args[4],creator_hash:args[5],created_at:args[6],expires_at:args[7],access_mode:args[8],delete_token_hash:args[9]});
     if(sql.startsWith('DELETE FROM uploads'))rows.delete(args[0]);
     return {success:true};},async all(){if(sql.startsWith('SELECT id,storage_key FROM uploads'))return {results:[...rows.values()].filter(r=>r.expires_at<=args[0])};return {results:[]};}};}};
 const FILES={async put(k,bytes){files.set(k,bytes)},async get(k){const b=files.get(k);return b?{size:b.byteLength,body:new Blob([b]).stream()}:null},async delete(k){files.delete(k)}};
 const env={DB,FILES,RATE_SALT:'salt',TURNSTILE_SECRET:'private'};
 try{
  const form=new FormData();form.append('file',new Blob([new Uint8Array([37,80,68,70,45,49,50,51])],{type:'application/pdf'}),'poster.pdf');form.append('turnstileToken','example');
  const req=new Request('https://freeqrstudio.pages.dev/api/upload',{method:'POST',headers:{Origin:'https://freeqrstudio.pages.dev','CF-Connecting-IP':'203.0.113.1'},body:form});
  const created=await onRequestPost({env,request:req});assert.equal(created.status,201,await created.clone().text());
  const result=await created.json();assert.match(result.url,/\/view\/[a-f0-9-]{36}$/);assert.equal(files.size,1);
  const download=await onRequestGet({request:new Request(result.url.replace('/view/','/file/')),env,params:{id:result.id}});assert.equal(download.status,200);
  assert.deepEqual(new Uint8Array(await download.arrayBuffer()),new Uint8Array([37,80,68,70,45,49,50,51]));
  rows.get(result.id).expires_at=Date.now()-1;
  const expired=await onRequestGet({request:new Request(result.url.replace('/view/','/file/')),env,params:{id:result.id}});assert.equal(expired.status,410);
  await cleaner.scheduled({},env,{});assert.equal(rows.size,0);assert.equal(files.size,0);
 }finally{global.fetch=originals;}
});

test('mocked contact delivery sends to private environment value only',async()=>{
 const {onRequestPost}=await imp('functions/api/contact.js');
 const original=global.fetch;let delivered=null;
 global.fetch=async (url,options)=>{
  if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'freeqrstudio.pages.dev'});
  if(String(url).includes('api.resend.com/emails')){delivered=JSON.parse(options.body);return Response.json({id:'mock-id'});}
  return new Response('Unexpected URL',{status:500});
 };
 const DB={prepare(sql){return {bind(){return this;},async first(){return {count:0}},async run(){return {success:true}}};}};
 const env={DB,RATE_SALT:'salt',TURNSTILE_SECRET:'turnstile',RESEND_API_KEY:'key',RESEND_FROM:'QR Studio <feedback@example.org>',CONTACT_TO:'hidden-private-recipient@example.com'};
 try{
  const req=new Request('https://freeqrstudio.pages.dev/api/contact',{method:'POST',headers:{Origin:'https://freeqrstudio.pages.dev','Content-Type':'application/json'},body:JSON.stringify({name:'Visitor',email:'visitor@example.net',message:'Please improve the contrast preview.',turnstileToken:'valid-token'})});
  const r=await onRequestPost({request:req,env});assert.equal(r.status,200);
  assert.equal(delivered.to[0],env.CONTACT_TO);
  assert.equal(delivered.reply_to,'visitor@example.net');
  assert(!JSON.stringify(await r.json()).includes(env.CONTACT_TO));
 }finally{global.fetch=original;}
});
