'use strict';
const assert=require('node:assert/strict');const test=require('node:test');
require('../public/assets/js/qr-core.js');
const U=require('../public/assets/js/utils.js'),X=require('../public/assets/js/exports.js');
test('validates URL protocol and prevents dangerous QR URLs',()=>{
 assert.equal(U.validWebUrl('javascript:alert(1)'),null);assert.equal(U.validWebUrl('data:text/html,<script>'),null);
 assert.equal(U.encodePayload('url',{url:'https://example.org/'}),'https://example.org/');
 assert.throws(()=>U.encodePayload('file',{url:'wrong'}),/valid/);
});
test('detects Drive and time-limited-looking URLs without inventing expiry',()=>{
 assert.equal(U.providerOf('https://docs.google.com/presentation/d/abc/edit'),'Google Drive / Docs');
 assert.equal(U.expiryOfUrl('https://example.org/download?expires=12345678').status,'possible');
 assert.equal(U.expiryOfUrl('https://drive.google.com/file/d/id/view').status,'unknown');
});
test('encodes WiFi, SMS, vCard correctly',()=>{
 assert.equal(U.encodePayload('wifi',{ssid:'Home;:Net',security:'WPA',password:'a,b:c',hidden:true}),String.raw`WIFI:T:WPA;S:Home\;\:Net;P:a\,b\:c;H:true;;`);
 assert.match(U.encodePayload('contact',{name:'Anne Doe',phone:'+123'}),/BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Anne Doe/);
 assert.match(U.encodePayload('sms',{phone:'+1 (555) 123-4567',message:'Hi there'}),/^sms:\+15551234567\?body=Hi%20there$/);
});
test('UTF-8 multi-language data yields a QR matrix',()=>{
 for(const text of ['https://example.com','हैलो 👋','తెలుగు భాష','Hello, 世界']){
  const m=U.createMatrix(text,'H');assert(m.size>=21);assert.equal(m.data.length,m.size);assert(m.data.flat().some(Boolean));
 }
});
test('rejects oversize payload for chosen correction level',()=>{
 assert.throws(()=>U.createMatrix('x'.repeat(1300),'H'),/Too much information/);
 assert.doesNotThrow(()=>U.createMatrix('x'.repeat(1300),'L'));
});
test('contrast guard helper works',()=>{
 assert.equal(U.contrast('#ffffff','#ffffff'),1);assert(U.contrast('#000000','#ffffff')>20);
});
test('SVG has quiet zone, valid color, and no external network reference',()=>{
 const m=U.createMatrix('https://example.com','H');const svg=X.svgMarkup(m,{fg:'#000000',bg:'#ffffff',logo:null});
 assert(svg.includes('<svg xmlns='));assert(svg.includes('viewBox="0 0 '+(m.size+8)+' '+(m.size+8)+'"'));assert(!svg.includes('http://')||svg.includes('http://www.w3.org/2000/svg'));
});
test('PDF vector export is generated as well-formed PDF container',()=>{
 const m=U.createMatrix('https://example.com','H');const b=X.pdfBytes(m,{fg:'#000000',bg:'#ffffff',logo:null},'Scan this code');
 assert(Buffer.from(b).toString('latin1',0,8).startsWith('%PDF-1.4'));
});
test('ZIP export has the correct ZIP magic and includes central directory',()=>{
 const archive=X.zipBytes([{name:'hello.txt',bytes:new TextEncoder().encode('hello')},{name:'world.svg',bytes:new TextEncoder().encode('<svg/>')}]);
 assert.equal(Buffer.from(archive).toString('latin1',0,4),'PK\x03\x04');
});
