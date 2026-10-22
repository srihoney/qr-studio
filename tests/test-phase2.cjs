'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../public/assets/js/qr-core.js');
const U=require('../public/assets/js/utils.js');
const X=require('../public/assets/js/exports.js');
const base=U.createMatrix('https://freeqrstudio.pages.dev/','H');
const dark={fg:'#12263c',bg:'#ffffff',eye:'#145a60',fg2:'#145f71',gradient:true};
test('supports four pattern styles and two scan-safe finder styles',()=>{
  for(const pattern of ['square','soft','dots','tiles'])for(const finder of ['square','rounded']){
    const svg=X.svgMarkup(base,{...dark,pattern,finder});
    assert.match(svg,/<svg xmlns=/);assert.match(svg,/linearGradient/);
    assert(svg.includes('url(#codefill)'));
    assert(!svg.includes('<script'));
  }
});
test('supports foreground gradient, solid color and independent finder accent',()=>{
  const gradient=X.svgMarkup(base,{...dark,pattern:'dots',finder:'rounded'});
  assert.match(gradient,/stop-color="#145f71"/);
  assert.match(gradient,/fill="#145a60"/);
  const solid=X.svgMarkup(base,{fg:'#111111',bg:'#ffffff'});
  assert.doesNotMatch(solid,/linearGradient/);
});
test('caption safely escapes user content in SVG',()=>{
  const svg=X.svgMarkup(base,{...dark,frame:'caption',caption:'Scan <poster> & "see"'});
  assert.match(svg,/Scan &lt;poster&gt; &amp; &quot;see&quot;/);
  assert(!svg.includes('Scan <poster>'));
});
test('PDF includes styled vector drawing, PDF title and optional caption',()=>{
 const pdf=X.pdfBytes(base,{...dark,pattern:'dots',finder:'rounded',frame:'caption',caption:'SCAN ME'},'My Poster');
 const text=Buffer.from(pdf).toString('latin1');
 assert.match(text,/My Poster/);assert.match(text,/SCAN ME/);assert.match(text,/BT \/F1/);
});
test('new design controls are present without numbered panels or Pricing',()=>{
 const html=fs.readFileSync(require('node:path').join(__dirname,'../public/index.html'),'utf8');
 assert.match(html,/id="themeToggle"/);
 assert.match(html,/value="dots"/);
 assert.match(html,/id="gradient"/);
 assert.match(html,/id="scanImage"/);
 assert.doesNotMatch(html,/01 \/ CREATE|02 \/ CUSTOMIZE|03 \/ DOWNLOAD|>Pricing</);
});
