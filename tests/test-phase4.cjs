const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..'),load=x=>import('file://'+path.join(root,x));
const id='123e4567-e89b-12d3-a456-426614174000';
function mocked(row){let existing=row,file=Buffer.from('%PDF-example');return {
  env:{DB:{prepare(sql){let args=[];return {bind(...a){args=a;return this;},async first(){return existing;},async run(){if(sql.startsWith('DELETE'))existing=null;return{success:true};}};}},FILES:{async get(){return existing?{size:file.length,body:new Blob([file]).stream()}:null},async head(){return existing?{size:file.length}:null},async delete(){file=null}}},get row(){return existing},set row(v){existing=v}};}
test('viewer shows PDF inline and view-only disables prominent download',async()=>{
 const {onRequestGet}=await load('functions/view/[id].js');const obj=mocked({id,storage_key:'uploads/'+id,file_name:'poster.pdf',mime:'application/pdf',expires_at:Date.now()+20000,access_mode:'view'});
 const r=await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/view/'+id),env:obj.env,params:{id}});
 assert.equal(r.status,200);const h=await r.text();assert.match(h,/View Online/);assert.match(h,/iframe/);assert.doesNotMatch(h,/class="download"/);
 assert.match(r.headers.get('Content-Security-Policy'),/frame-src 'self'/);
});
test('view and download offers download, escaping filename XSS',async()=>{
 const {onRequestGet}=await load('functions/view/[id].js');const obj=mocked({id,storage_key:'uploads/'+id,file_name:'<script>unsafe.pdf',mime:'application/pdf',expires_at:Date.now()+20000,access_mode:'download'});
 const r=await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/view/'+id),env:obj.env,params:{id}});
 assert.equal(r.status,200);const h=await r.text();assert.match(h,/View &amp; Download/);assert.match(h,/download=1/);assert.doesNotMatch(h,/<script>unsafe/);assert.match(h,/&lt;script&gt;/);
});
test('viewer denies expired uploaded file',async()=>{
 const {onRequestGet}=await load('functions/view/[id].js');const obj=mocked({id,storage_key:'uploads/'+id,file_name:'poster.pdf',mime:'application/pdf',expires_at:Date.now()-1,access_mode:'view'});
 assert.equal((await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/view/'+id),env:obj.env,params:{id}})).status,410);
});
test('existing files are still accessible with original download policy',async()=>{
 const {onRequestGet}=await load('functions/file/[id].js');const obj=mocked({id,storage_key:'uploads/'+id,file_name:'legacy.docx',mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',expires_at:Date.now()+30000});
 const r=await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/file/'+id),env:obj.env,params:{id}});
 assert.equal(r.status,200);assert.match(r.headers.get('Content-Disposition'),/^attachment/);
});
test('view-only PDFs are inline, downloadable PDFs offer download mode',async()=>{
 const {onRequestGet}=await load('functions/file/[id].js');const obj=mocked({id,storage_key:'uploads/'+id,file_name:'poster.pdf',mime:'application/pdf',expires_at:Date.now()+30000,access_mode:'view'});
 let r=await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/file/'+id+'?download=1'),env:obj.env,params:{id}});
 assert.match(r.headers.get('Content-Disposition'),/^inline/);
 obj.row={...obj.row,access_mode:'download'};
 r=await onRequestGet({request:new Request('https://freeqrstudio.pages.dev/file/'+id+'?download=1'),env:obj.env,params:{id}});
 assert.match(r.headers.get('Content-Disposition'),/^attachment/);
});
test('owner-held deletion token required, deletes R2 then D1',async()=>{
 const {onRequestPost}=await load('functions/api/file/delete.js');const token='b'.repeat(64);
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const hash=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
 const obj=mocked({id,storage_key:'uploads/'+id,delete_token_hash:hash});
 const req=t=>new Request('https://freeqrstudio.pages.dev/api/file/delete',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://freeqrstudio.pages.dev'},body:JSON.stringify({id,deleteToken:t})});
 assert.equal((await onRequestPost({request:req('a'.repeat(64)),env:obj.env})).status,403);
 assert.equal((await onRequestPost({request:req(token),env:obj.env})).status,200);
 assert.equal(obj.row,null);
});
test('D1 migration exists and backend never publishes contact recipient',()=>{
 const schema=fs.readFileSync(path.join(root,'migrations/0002_file_access.sql'),'utf8');
 assert.match(schema,/ALTER TABLE uploads ADD COLUMN access_mode/);
 assert.match(schema,/ALTER TABLE uploads ADD COLUMN delete_token_hash/);
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 assert.match(html,/neon-brandmark/);assert.match(html,/name="accessMode"/);
 assert.match(html,/id="deleteWithReceipt"/);assert.doesNotMatch(html,/@gmail\.com/);
});

test('Neon Horizon release keeps feature hooks, theme and separate application CSS',()=>{
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 assert.match(html,/neon-brandmark/);assert.match(html,/neon-horizon\.css/);
 assert.match(html,/id="sizeDial"/);
 assert.match(html,/data-design-tab/);
 for(const id of ['uploadChallenge','contactChallenge','qrCanvas','batchCsv','deleteWithReceipt','scanImage'])assert(html.includes('id="'+id+'"'));
 assert.doesNotMatch(html,/<script\s*>/);
});
