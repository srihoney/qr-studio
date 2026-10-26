const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=path.resolve(__dirname,'../public');const read=(f)=>fs.readFileSync(path.join(P,f),'utf8');
const host='https://freeqrstudio.pages.dev';
const slugs=['pdf-to-qr-code','wifi-qr-code','qr-code-with-logo','qr-code-for-research-posters','whatsapp-qr-code'];
test('homepage metadata and existing UI preserved',()=>{
 const s=read('index.html');assert.match(s,/<link rel="canonical" href="https:\/\/freeqrstudio.pages.dev\/"/);
 for(const x of ['og:title','og:image','og:url','twitter:card','name="description"'])assert(s.includes(x),x);
 for(const id of ['qrCanvas','batchCreate','scanImageBtn','contactForm','mode-grid'])assert(s.includes(id),id);
 assert.match(s,/href="\/guides\/">QR Guides/);
 assert.match(s,/<nav aria-label="Main navigation">[^<]*<a href="#workspace">Create QR<\/a><a href="#tools">Batch &amp; Tools<\/a><a href="\/guides\/">Guides<\/a>/);
});
test('crawler files contain seven consistent canonical URLs and protect transient paths',()=>{
 const robots=read('robots.txt'),map=read('sitemap.xml');assert(robots.includes('Sitemap: '+host+'/sitemap.xml'));
 for(const x of ['/api/','/file/','/view/'])assert(robots.includes('Disallow: '+x));
 const expected=[host+'/',host+'/guides/',...slugs.map(s=>host+'/guides/'+s+'/')];
 for(const u of expected)assert(map.includes('<loc>'+u+'</loc>'),u);
 assert.equal((map.match(/<loc>/g)||[]).length,7);
});
test('guides have matching self-referential canonical, real article content and related links',()=>{
 for(const slug of slugs){const h=read('guides/'+slug+'/index.html');
 assert(h.includes('rel="canonical" href="'+host+'/guides/'+slug+'/"'));
 assert(h.includes('type=')&&h.includes('#workspace'));
 assert(h.includes('Frequently asked questions'));
 assert(h.includes('/guides/'));
 assert(h.includes('application/ld+json'));
 assert(h.length>3400);
 }
 const h=read('guides/index.html');for(const slug of slugs)assert(h.includes('/guides/'+slug+'/'));
});
test('mode selection deep link is bounded and does not auto-generate or submit',()=>{
 const code=read('assets/js/app.js');assert(code.includes("new URLSearchParams(location.search).get('type')"));
 assert(code.includes('hasOwnProperty.call(labels,requested)'));
 assert(code.includes('chooseMode(requested)'));
});
test('social image is PNG and generated with expected resolution',()=>{
 const b=fs.readFileSync(path.join(P,'assets/img/social-preview.png'));
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.readUInt32BE(16),1200);assert.equal(b.readUInt32BE(20),630);
});
