/* QR Studio Phase 1: static browser-only QR generation. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const U=window.QRStudioUtils, X=window.QRStudioExports;
const state={mode:'url',matrix:null,payload:'',logo:null,logoData:null,historyKey:'qrstudio_history_v1'};
const outputBtns=[$('savePng'),$('saveSvg'),$('savePdf'),$('verify'),$('saveHistory')];
function readFields(){const panel=document.querySelector(`[data-mode-panel="${state.mode}"]`);const f={};panel.querySelectorAll('[data-field]').forEach(el=>f[el.dataset.field]=el.type==='checkbox'?el.checked:el.value);return f;}
function settings(){return {fg:$('fg').value,bg:$('bg').value,ecc:$('ecc').value,logo:state.logo,logoData:state.logoData};}
function tell(s,isError=false){$('feedback').textContent=s;$('feedback').classList.toggle('error',isError);$('previewState').classList.toggle('bad',isError);$('previewState').textContent=isError?'Needs attention':'Ready to scan';}
function metadata(mode,payload,bytes){
  $('qrExpiry').textContent='Never';$('dataBytes').textContent=U.byteSize(bytes);
  if(mode==='url'||mode==='file'){
    const provider=U.providerOf(payload),expiration=U.expiryOfUrl(payload);
    $('destinationProvider').textContent=mode==='url'?provider:(provider==='Other website'?'Other file host':provider);
    $('linkExpiry').textContent=expiration.status==='possible'?'Possibly expiring':'Not verified';
    $('expiryExplanation').textContent=expiration.detail+(mode==='file'?' File access also depends on sharing permissions and continued storage.':'');
  }else{
    const descriptions={text:['Embedded text','Not applicable','Text is stored in the QR itself. It has no online destination.'],wifi:['Wi-Fi network','Not applicable','The QR does not expire, but changing the password or network name can make it unusable.'],contact:['Contact card','Not applicable','The embedded contact details are static and can become outdated.'],email:['Email app','Not applicable','An email account or mail app is needed to use the QR.'],phone:['Phone app','Not applicable','The phone number must remain active.'],sms:['Messaging app','Not applicable','The mobile number and messaging support must remain available.']};
    const d=descriptions[mode];$('destinationProvider').textContent=d[0];$('linkExpiry').textContent=d[1];$('expiryExplanation').textContent=d[2];
  }
}
function refresh(){
  const s=settings();const ratio=U.contrast(s.fg,s.bg);
  $('fgHex').textContent=s.fg.toUpperCase();$('bgHex').textContent=s.bg.toUpperCase();
  const warning=$('contrastNote');warning.hidden=ratio>=4.5;warning.textContent=`Low QR/background contrast (${ratio.toFixed(2)}:1). Use darker QR modules and a lighter background; downloads are disabled until contrast reaches 4.5:1.`;
  state.matrix=null;state.payload='';outputBtns.forEach(b=>b.disabled=true);
  try{
    if(ratio<4.5)throw Error('Increase contrast before generating or downloading your QR code.');
    if(s.logo&&s.ecc!=='H')throw Error('Center logos require High (H) error correction.');
    const payload=U.encodePayload(state.mode,readFields());
    const matrix=U.createMatrix(payload,s.ecc);
    state.matrix=matrix;state.payload=payload;
    const canvas=X.drawOnCanvas(matrix,s,720);
    const preview=$('qrCanvas'),ctx=preview.getContext('2d');preview.width=preview.height=canvas.width;ctx.drawImage(canvas,0,0);
    preview.hidden=false;$('qrPlaceholder').hidden=true;
    metadata(state.mode,payload,matrix.bytes);
    outputBtns.forEach(b=>b.disabled=false);
    $('saveHistory').disabled=!['url','file','text'].includes(state.mode);
    tell('Ready to download. Test a printed QR with your phone before distributing it.');
  }catch(err){
    $('qrCanvas').hidden=true;$('qrPlaceholder').hidden=false;$('qrPlaceholder').textContent=err.message;
    $('dataBytes').textContent='—';$('destinationProvider').textContent='—';$('linkExpiry').textContent='—';
    $('expiryExplanation').textContent='Complete the fields above to see QR and destination expiration guidance.';
    tell(err.message,true);
  }
}
function chooseMode(mode){
  state.mode=mode;
  document.querySelectorAll('[data-mode-select]').forEach(b=>{const active=b.dataset.modeSelect===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  document.querySelectorAll('[data-mode-panel]').forEach(el=>el.hidden=el.dataset.modePanel!==mode);
  refresh();
}
function fname(ext){return `QRStudio_${state.mode}.${ext}`;}
async function downloadPng(){if(!state.matrix)return;try{const c=X.drawOnCanvas(state.matrix,settings(),Number($('resolution').value));X.saveBlob(await X.canvasBlob(c),fname('png'));tell('PNG exported successfully.');}catch(e){tell(e.message,true);}}
function downloadSvg(){if(!state.matrix)return;const markup=X.svgMarkup(state.matrix,settings());X.saveBlob(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}),fname('svg'));tell('Vector SVG exported successfully.');}
function downloadPdf(){if(!state.matrix)return;try{const data=X.pdfBytes(state.matrix,settings(),$('pdfTitle').value||'Scan to open');X.saveBlob(new Blob([data],{type:'application/pdf'}),fname('pdf'));tell('Print-ready PDF exported successfully.');}catch(e){tell('Could not export PDF: '+e.message,true);}}
async function verify(){if(!state.matrix)return;
  if(!('BarcodeDetector' in window)){tell('Automatic QR decoding is unavailable in this browser. Scan the preview or printed code with a phone and check the destination.',true);return;}
  try{const detector=new BarcodeDetector({formats:['qr_code']});const found=await detector.detect($('qrCanvas'));
    if(found.some(f=>f.rawValue===state.payload))tell('Verified: your browser decoded the QR and matched its content. Test printing and destination access separately.');
    else tell('Automatic scan could not confirm the full content. Try another color or remove the logo; test on your phone.',true);
  }catch(e){tell('Automatic scanner could not run. Please test using your phone camera. '+e.message,true);}
}
function historyLoad(){try{const parsed=JSON.parse(localStorage.getItem(state.historyKey)||'[]');return Array.isArray(parsed)?parsed.slice(0,20):[];}catch{return [];}}
function historyStore(entries){try{localStorage.setItem(state.historyKey,JSON.stringify(entries));return true;}catch{return false;}}
function renderHistory(){const list=$('historyList');list.replaceChildren();const all=historyLoad();
  if(!all.length){const p=document.createElement('p');p.className='muted';p.textContent='No codes saved yet.';list.append(p);return;}
  for(const [i,entry] of all.entries()){
    const item=document.createElement('div');item.className='history-item';
    const details=document.createElement('div'),title=document.createElement('strong'),sub=document.createElement('small');
    title.textContent=entry.mode==='file'?'File link':entry.mode==='url'?'Website':'Text';sub.textContent=entry.payload.length>100?entry.payload.slice(0,100)+'…':entry.payload;
    details.append(title,sub);const b=document.createElement('button');b.type='button';b.textContent='Load QR';b.addEventListener('click',()=>{
      chooseMode(entry.mode);const panel=document.querySelector(`[data-mode-panel="${entry.mode}"]`);panel.querySelector('[data-field]').value=entry.payload;refresh();$('workspace').scrollIntoView({behavior:'smooth'});
    });item.append(details,b);list.append(item);
  }
}
function saveHistory(){if(!state.payload||!['url','file','text'].includes(state.mode))return;
  const all=historyLoad().filter(e=>e.payload!==state.payload);
  all.unshift({mode:state.mode,payload:state.payload});
  if(historyStore(all.slice(0,20))){renderHistory();tell('Saved only in this browser. Clear local history whenever you wish.');}
  else tell('Local browser storage is unavailable. Your QR itself is unaffected.',true);
}
function loadLogo(file){return new Promise((resolve,reject)=>{
  if(!file){resolve(null);return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){reject(Error('Logo must be PNG, JPG or WebP and at most 2 MB.'));return;}
  const reader=new FileReader();reader.onerror=()=>reject(Error('Could not read logo.'));
  reader.onload=()=>{const data=String(reader.result);const img=new Image();img.onload=()=>resolve({img,data});img.onerror=()=>reject(Error('Unable to decode logo image.'));img.src=data;};reader.readAsDataURL(file);
});}
async function createBatch(){const btn=$('batchCreate'),status=$('batchStatus');
  const lines=$('batchLinks').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length||lines.length>25){status.textContent='Enter 1–25 links per batch.';return;}
  for(const [i,line] of lines.entries())if(!U.validWebUrl(line)){status.textContent=`Line ${i+1} is not a valid HTTP/HTTPS URL.`;return;}
  btn.disabled=true;status.textContent='Creating ZIP locally…';
  try{
    const files=[],rows=['index,link'];const s={fg:'#12263c',bg:'#ffffff',logo:null,logoData:null};
    for(let i=0;i<lines.length;i++){
      const m=U.createMatrix(U.validWebUrl(lines[i]).href,'H');const stem=`qr-${String(i+1).padStart(2,'0')}`;
      const canvas=X.drawOnCanvas(m,s,1100);files.push({name:stem+'.png',bytes:new Uint8Array(await (await X.canvasBlob(canvas)).arrayBuffer())});
      files.push({name:stem+'.svg',bytes:new TextEncoder().encode(X.svgMarkup(m,s))});
      rows.push(`${i+1},"${U.validWebUrl(lines[i]).href.replace(/"/g,'""')}"`);
      status.textContent=`Created ${i+1} of ${lines.length}…`;
      await new Promise(r=>setTimeout(r,0));
    }
    files.push({name:'links.csv',bytes:new TextEncoder().encode(rows.join('\r\n')+'\r\n')});
    const zip=X.zipBytes(files);X.saveBlob(new Blob([zip],{type:'application/zip'}),'QRStudio_Batch.zip');
    status.textContent=`Done: ${lines.length} QR codes, each in PNG and SVG.`;
  }catch(e){status.textContent='Could not create ZIP: '+e.message;}
  finally{btn.disabled=false;}
}
document.querySelectorAll('[data-mode-select]').forEach(btn=>btn.addEventListener('click',()=>chooseMode(btn.dataset.modeSelect)));
document.querySelector('.mode-tabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();const tabs=Array.from(document.querySelectorAll('[data-mode-select]'));
  const i=tabs.findIndex(t=>t.dataset.modeSelect===state.mode);
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+tabs.length)%tabs.length;
  chooseMode(tabs[next].dataset.modeSelect);tabs[next].focus();
});
document.querySelectorAll('.mode-panel input, .mode-panel textarea, .mode-panel select').forEach(el=>{if(el.id!=='localFile')el.addEventListener('input',refresh);});
['fg','bg','ecc','resolution'].forEach(id=>$(id).addEventListener('input',()=>{if(id!=='resolution')refresh();}));
$('resetDesign').addEventListener('click',()=>{$('fg').value='#12263c';$('bg').value='#ffffff';$('ecc').value='H';$('resolution').value='2048';state.logo=null;state.logoData=null;$('logoFile').value='';$('clearLogo').hidden=true;refresh();});
$('localFile').addEventListener('change',e=>{const f=e.target.files[0];$('fileStatus').textContent=f?`${f.name} (${U.byteSize(f.size)}) selected locally. ${f.size>10*1024*1024?'For a large file,':'For this file,'} upload it to your cloud storage and paste its public viewer link above. The file is not uploaded or encoded into the QR.`:'';});
$('logoFile').addEventListener('change',async e=>{try{const data=await loadLogo(e.target.files[0]);state.logo=data?.img||null;state.logoData=data?.data||null;if(state.logo)$('ecc').value='H';$('clearLogo').hidden=!state.logo;refresh();}catch(err){e.target.value='';state.logo=null;state.logoData=null;$('clearLogo').hidden=true;refresh();tell(err.message,true);}});
$('clearLogo').addEventListener('click',()=>{state.logo=null;state.logoData=null;$('logoFile').value='';$('clearLogo').hidden=true;refresh();});
$('savePng').addEventListener('click',downloadPng);$('saveSvg').addEventListener('click',downloadSvg);$('savePdf').addEventListener('click',downloadPdf);
$('verify').addEventListener('click',verify);$('saveHistory').addEventListener('click',saveHistory);
$('clearHistory').addEventListener('click',()=>{if(confirm('Delete all QR Studio history saved in this browser?')){try{localStorage.removeItem(state.historyKey);}catch{}renderHistory();}});
$('batchCreate').addEventListener('click',createBatch);
renderHistory();chooseMode('url');
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
