/* QR Studio Phase 3: browser QR editor + optional expiring file hosting and contact. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const U=window.QRStudioUtils, X=window.QRStudioExports;
const state={mode:null,matrix:null,payload:'',logo:null,logoData:null,uploadMeta:null,config:null,turnstile:{upload:null,contact:null}};
const outputBtns=[$('savePng'),$('saveSvg'),$('savePdf'),$('verify')];
function readFields(){const panel=document.querySelector(`[data-mode-panel="${state.mode}"]`);const f={};panel.querySelectorAll('[data-field]').forEach(el=>f[el.dataset.field]=el.type==='checkbox'?el.checked:el.value);if(state.mode==='location')f.method=document.querySelector('input[name="locationMethod"]:checked').value;return f;}
function settings(){return {fg:$('fg').value,bg:$('bg').value,eye:$('eye').value,fg2:$('fg2').value,gradient:$('gradient').checked,pattern:document.querySelector('input[name="pattern"]:checked').value,finder:document.querySelector('input[name="finder"]:checked').value,frame:$('frame').value,caption:$('caption').value,ecc:$('ecc').value,logo:state.logo,logoData:state.logoData};}
function tell(s,isError=false){$('feedback').textContent=s;$('feedback').classList.toggle('error',isError);$('previewState').classList.toggle('bad',isError);$('previewState').textContent=isError?'Needs attention':'Ready to scan';}
function metadata(mode,payload,bytes){
  $('qrExpiry').textContent='No built-in expiry';$('dataBytes').textContent=U.byteSize(bytes);
  if(mode==='url'||mode==='file'||mode==='whatsapp'||mode==='location'){
    const provider=U.providerOf(payload),expiration=U.expiryOfUrl(payload);
    const owned=(mode==='file' && state.uploadMeta && payload===state.uploadMeta.url);
    $('destinationProvider').textContent=owned?'QR Studio file':mode==='whatsapp'?'WhatsApp':mode==='location'?'Google Maps':mode==='url'?provider:(provider==='Other website'?'Other file host':provider);
    $('linkExpiry').textContent=owned?new Date(state.uploadMeta.expiresAt).toLocaleString():expiration.status==='possible'?'Possibly expiring':'Not verified';
    $('expiryExplanation').textContent=owned?'QR Studio-hosted file; access follows the selected viewing mode until its expiration.':mode==='whatsapp'?'Opens WhatsApp for the specified phone number; WhatsApp availability is outside QR Studio.':mode==='location'?'Opens Google Maps; the mapping service requires internet access.':expiration.detail+(mode==='file'?' File access also depends on sharing permissions and continued storage.':'');
  }else{
    const descriptions={text:['Embedded text','Not applicable','Text is stored in the QR itself. It has no online destination.'],wifi:['Wi-Fi network','Not applicable','The QR does not expire, but changing the password or network name can make it unusable.'],contact:['Contact card','Not applicable','The embedded contact details are static and can become outdated.'],email:['Email app','Not applicable','An email account or mail app is needed to use the QR.'],phone:['Phone app','Not applicable','The phone number must remain active.'],sms:['Messaging app','Not applicable','The mobile number and messaging support must remain available.'],whatsapp:['WhatsApp chat','Not verified','Opens WhatsApp for the specified number; the account must remain available.'],location:['Google Maps','Not verified','Maps require internet access and the destination may change.'],event:['Calendar event','Not applicable','The event details are embedded in the QR. Calendar import support and time-zone interpretation depend on the scanning app.']};
    const d=descriptions[mode];$('destinationProvider').textContent=d[0];$('linkExpiry').textContent=d[1];$('expiryExplanation').textContent=d[2];
  }
}
function refresh(){
  if(!state.mode){state.matrix=null;state.payload='';outputBtns.forEach(b=>b.disabled=true);$('qrCanvas').hidden=true;$('qrPlaceholder').hidden=false;$('qrPlaceholder').textContent='Choose a QR type above to get started.';$('previewState').textContent='Choose a QR type';$('destinationProvider').textContent='—';$('linkExpiry').textContent='—';$('dataBytes').textContent='—';return;}
  const s=settings();const ratio=Math.min(U.contrast(s.fg,s.bg), U.contrast(s.eye,s.bg),s.gradient?U.contrast(s.fg2,s.bg):100);
  $('fgHex').textContent=s.fg.toUpperCase();$('bgHex').textContent=s.bg.toUpperCase();$('eyeHex').textContent=s.eye.toUpperCase();$('fg2Hex').textContent=s.fg2.toUpperCase();
  const warning=$('contrastNote');warning.hidden=ratio>=4.5;warning.textContent=`Low QR/background contrast (${ratio.toFixed(2)}:1). Use darker QR modules and a lighter background; downloads are disabled until contrast reaches 4.5:1.`;
  state.matrix=null;state.payload='';outputBtns.forEach(b=>b.disabled=true);
  try{
    if(ratio<4.5)throw Error('Increase contrast before generating or downloading your QR code.');
    if(s.logo&&s.ecc!=='H')throw Error('Center logos require High (H) error correction.');
    if(state.mode==='file' && document.querySelector('input[name="fileSource"]:checked').value==='upload' && !state.uploadMeta)throw Error('Upload a file first to generate its QR code.');
    const payload=U.encodePayload(state.mode,readFields());
    const matrix=U.createMatrix(payload,s.ecc);
    state.matrix=matrix;state.payload=payload;
    const canvas=X.drawOnCanvas(matrix,s,720);
    const preview=$('qrCanvas'),ctx=preview.getContext('2d');preview.width=canvas.width;preview.height=canvas.height;ctx.drawImage(canvas,0,0);
    preview.hidden=false;$('qrPlaceholder').hidden=true;
    metadata(state.mode,payload,matrix.bytes);
    outputBtns.forEach(b=>b.disabled=false);
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
  if(['whatsapp','location','event'].includes(mode))setMoreTypes(true);
  $('selectPrompt').hidden=true;
  document.querySelectorAll('[data-mode-select]').forEach(b=>{const active=b.dataset.modeSelect===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  document.querySelectorAll('[data-mode-panel]').forEach(el=>el.hidden=el.dataset.modePanel!==mode);
  refresh();
}
function fname(ext){return `QRStudio_${state.mode}.${ext}`;}
async function downloadPng(){if(!state.matrix)return;try{const c=X.drawOnCanvas(state.matrix,settings(),Number($('resolution').value));X.saveBlob(await X.canvasBlob(c),fname('png'));tell('PNG exported successfully.');}catch(e){tell(e.message,true);}}
function downloadSvg(){if(!state.matrix)return;const markup=X.svgMarkup(state.matrix,settings());X.saveBlob(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}),fname('svg'));tell('Vector SVG exported successfully.');}
function downloadPdf(){if(!state.matrix)return;try{const data=X.pdfBytes(state.matrix,settings(),$('pdfTitle').value||'Scan to open');X.saveBlob(new Blob([data],{type:'application/pdf'}),fname('pdf'));tell('Print-ready PDF exported successfully.');}catch(e){tell('Could not export PDF: '+e.message,true);}}
// QR decoding is local: native BarcodeDetector when available, jsQR fallback elsewhere.
// Never send uploaded or generated QR pixels to an external service.
async function decodeQrImage(source){
  let bitmap=null;
  try{
    if(source instanceof File || source instanceof Blob){
      bitmap=await createImageBitmap(source);
    }
    const image=bitmap||source;
    if(typeof window.BarcodeDetector==='function'){
      try{
        const detector=new window.BarcodeDetector({formats:['qr_code']});
        const detected=await detector.detect(image);
        if(detected.length && detected[0].rawValue!=null)return String(detected[0].rawValue);
      }catch(_nativeError){/* Use the local fallback when native detection is unavailable. */}
    }
    if(typeof window.jsQR!=='function')throw Error('The QR reader did not load. Check your internet connection or browser content blocker, then reload.');
    // Bound large images so decoding does not exhaust the browser's memory.
    const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
    if(!iw||!ih)throw Error('This image has no readable dimensions.');
    const scale=Math.min(1,2048/Math.max(iw,ih));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(iw*scale));
    canvas.height=Math.max(1,Math.round(ih*scale));
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Unable to create an image decoder.');
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
    const found=window.jsQR(pixels.data,pixels.width,pixels.height,{inversionAttempts:'attemptBoth'});
    return found&&typeof found.data==='string'?found.data:null;
  }finally{bitmap?.close?.();}
}
async function verify(){
  if(!state.matrix)return;
  const button=$('verify');button.disabled=true;
  try{
    const found=await decodeQrImage($('qrCanvas'));
    if(found===state.payload){
      tell('Verified: QR image decoded successfully and its content matches. Check physical prints and destination access separately.');
    }else if(found===null){
      tell('No readable QR pattern was detected. Try higher contrast, a smaller logo, or a simpler style.',true);
    }else{
      tell('The QR image decoded, but the decoded content differs from the intended destination. Do not distribute this code.',true);
    }
  }catch(error){tell('Could not complete the QR check: '+error.message,true);}
  finally{button.disabled=!state.matrix;}
}
function loadLogo(file){return new Promise((resolve,reject)=>{
  if(!file){resolve(null);return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){reject(Error('Logo must be PNG, JPG or WebP and at most 2 MB.'));return;}
  const reader=new FileReader();reader.onerror=()=>reject(Error('Could not read logo.'));
  reader.onload=()=>{const data=String(reader.result);const img=new Image();img.onload=()=>resolve({img,data});img.onerror=()=>reject(Error('Unable to decode logo image.'));img.src=data;};reader.readAsDataURL(file);
});}
async function createBatch(){const btn=$('batchCreate'),status=$('batchStatus');
  const rowsInput=state.batchCsvRows?.length?state.batchCsvRows:$('batchLinks').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map((url,i)=>({name:`qr-${i+1}`,url}));
  const lines=rowsInput.map(row=>row.url);
  if(!lines.length||lines.length>25){status.textContent='Enter 1–25 links per batch.';return;}
  for(const [i,line] of lines.entries())if(!U.validWebUrl(line)){status.textContent=`Line ${i+1} is not a valid HTTP/HTTPS URL.`;return;}
  btn.disabled=true;status.textContent='Creating ZIP locally…';
  try{
    const files=[],rows=['name,link'];const s={...settings(),logo:null,logoData:null,frame:'none'};
    for(let i=0;i<lines.length;i++){
      const m=U.createMatrix(U.validWebUrl(lines[i]).href,'H');const stem=rowsInput[i].name.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,50)||`qr-${String(i+1).padStart(2,'0')}`;
      const canvas=X.drawOnCanvas(m,s,1100);files.push({name:stem+'.png',bytes:new Uint8Array(await (await X.canvasBlob(canvas)).arrayBuffer())});
      files.push({name:stem+'.svg',bytes:new TextEncoder().encode(X.svgMarkup(m,s))});
      rows.push(`"${rowsInput[i].name.replace(/"/g,'""')}","${U.validWebUrl(lines[i]).href.replace(/"/g,'""')}"`);
      status.textContent=`Created ${i+1} of ${lines.length}…`;
      await new Promise(r=>setTimeout(r,0));
    }
    files.push({name:'links.csv',bytes:new TextEncoder().encode(rows.join('\r\n')+'\r\n')});
    const zip=X.zipBytes(files);X.saveBlob(new Blob([zip],{type:'application/zip'}),'QRStudio_Batch.zip');
    status.textContent=`Done: ${lines.length} QR codes, each in PNG and SVG.`;
  }catch(e){status.textContent='Could not create ZIP: '+e.message;}
  finally{btn.disabled=false;}
}

// CSV input, quote escaping, headers and named files. Parsing stays entirely in-browser.
function parseCsv(content){
  if(content.charCodeAt(0)===0xfeff)content=content.slice(1);
  const records=[],row=[];let cell='',quoted=false;
  for(let i=0;i<content.length;i++){
    const c=content[i];if(c==='"'){if(quoted&&content[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.trim())throw Error('Invalid CSV quote.');else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(cell.trim());cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&content[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))records.push([...row]);row.length=0;cell='';}
    else cell+=c;
  }
  if(quoted)throw Error('Unclosed CSV quote.');row.push(cell.trim());if(row.some(Boolean))records.push(row);
  if(!records.length)throw Error('CSV is empty.');
  const h=records[0].map(v=>v.toLowerCase()),nameCol=h.indexOf('name'),urlCol=h.indexOf('url');
  if(nameCol<0||urlCol<0)throw Error('First CSV row must contain name,url columns.');
  if(records.length-1>25)throw Error('CSV supports up to 25 QR codes per batch.');
  const seen=new Set();
  return records.slice(1).map((r,i)=>{const name=(r[nameCol]||`QR-${i+1}`).slice(0,50),url=(r[urlCol]||'').trim();
    if(!U.validWebUrl(url))throw Error(`CSV row ${i+2} has an invalid URL.`);
    const stem=name.replace(/[^a-zA-Z0-9_-]/g,'-');if(seen.has(stem))throw Error(`Duplicate CSV name: ${name}`);seen.add(stem);
    return {name,url};
  });
}
function showFileSource(){
  const upload=document.querySelector('input[name="fileSource"]:checked').value==='upload';
  $('uploadFormSection').hidden=!upload;$('cloudLinkSection').hidden=upload;state.uploadMeta=null;$('fileValue').value='';$('uploadResult').hidden=true;$('fileActions').hidden=true;refresh();
}
async function setupServices(){
  try{const response=await fetch('/api/config',{cache:'no-store'});if(!response.ok)throw Error('Service not configured');
    state.config=await response.json();
    if(state.config.uploadsEnabled){$('uploadButton').disabled=false;$('uploadStatus').textContent='Ready: files up to 5 MB, links expire after 30 days.';}
    else $('uploadStatus').textContent='Direct uploads are not yet configured. Use a cloud file link instead.';
    if(state.config.contactEnabled){$('contactSubmit').disabled=false;$('contactStatus').textContent='';}
    else $('contactStatus').textContent='Contact form is being configured.';
    if(state.config.turnstileSiteKey && (state.config.uploadsEnabled||state.config.contactEnabled)){
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      script.addEventListener('load',()=>{
        for(const [kind,id] of [['upload','uploadChallenge'],['contact','contactChallenge']]){
          if(!state.config[kind==='upload'?'uploadsEnabled':'contactEnabled'])continue;
          state.turnstile[kind]=window.turnstile.render('#'+id,{sitekey:state.config.turnstileSiteKey,theme:document.documentElement.dataset.theme==='dark'?'dark':'light'});
        }
      });document.head.appendChild(script);
    }
  }catch{$('uploadStatus').textContent='File hosting is unavailable. You can still paste a cloud link.';$('contactStatus').textContent='Contact form is unavailable right now.';}
}
function challengeToken(kind){const id=state.turnstile[kind];return id!==null&&window.turnstile?window.turnstile.getResponse(id):'';}
function resetChallenge(kind){const id=state.turnstile[kind];if(id!==null&&window.turnstile)window.turnstile.reset(id);}
async function uploadHostedFile(){
  const file=$('hostedFile').files?.[0],button=$('uploadButton');
  if(!file){$('uploadStatus').textContent='Select a file first.';return;}
  if(file.size===0||file.size>5*1024*1024){$('uploadStatus').textContent='Choose a file between 1 byte and 5 MB.';return;}
  if(!challengeToken('upload')){$('uploadStatus').textContent='Please complete the security check first.';return;}
  button.disabled=true;$('uploadStatus').textContent='Uploading file securely…';
  try{const body=new FormData();body.append('file',file);body.append('accessMode',document.querySelector('input[name="accessMode"]:checked').value);body.append('turnstileToken',challengeToken('upload'));
    const response=await fetch('/api/upload',{method:'POST',body});const result=await response.json();
    if(!response.ok)throw Error(result.error||'Upload failed.');
    state.uploadMeta=result;$('fileValue').value=result.url;$('uploadResult').hidden=false;
    $('uploadResult').textContent=`Uploaded: ${result.name}. Expires ${new Date(result.expiresAt).toLocaleString()}. Sharing: ${result.accessMode==='view'?'View Online':'View & Download'}.`;
    $('fileActions').hidden=false;$('openFile').href=result.url;
    $('deleteFileStatus').textContent='Save your private deletion receipt if you want to remove this file early.';
    $('uploadStatus').textContent='Upload complete. Download your QR when ready.';refresh();
  }catch(error){$('uploadStatus').textContent=error.message;}
  finally{button.disabled=false;resetChallenge('upload');}
}
function setFilePreference(){
  const file=$('hostedFile').files?.[0],view=document.querySelector('input[name="accessMode"][value="view"]');
  const previewable=!!file && /\.(pdf|png|jpe?g|webp)$/i.test(file.name);
  view.disabled=!!file&&!previewable;
  if(view.disabled&&view.checked)document.querySelector('input[name="accessMode"][value="download"]').checked=true;
  $('accessHint').textContent=view.disabled?'This file type supports View & Download only.':'View Online is for PDF and images; it cannot prevent copying or screenshots.';
}
function deleteReceipt(){
  const r=state.uploadMeta;if(!r?.deleteToken)return null;
  return `QR Studio private deletion receipt\nFile: ${r.name}\nFile ID: ${r.id}\nDeletion token: ${r.deleteToken}\nExpires: ${r.expiresAt}\nFile link: ${r.url}\n\nKeep this token private. Anyone holding it can delete the upload. Never put it inside a QR code.`;
}
async function deleteFile(id,token,target){
  if(!id||!token){$(target).textContent='A file ID and private deletion token are required.';return;}
  if(!confirm('Permanently delete this uploaded file now? This will make its QR link stop working.'))return;
  $(target).textContent='Deleting…';
  try{const r=await fetch('/api/file/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,deleteToken:token})});
    const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to delete file.');
    $(target).textContent='File deleted. The QR link no longer works.';
    if(state.uploadMeta?.id===id){state.uploadMeta=null;$('fileValue').value='';$('fileActions').hidden=true;$('uploadResult').hidden=true;refresh();}
  }catch(e){$(target).textContent=e.message;}
}
async function sendContact(event){event.preventDefault();const btn=$('contactSubmit');
  if(!challengeToken('contact')){$('contactStatus').textContent='Please complete the security check first.';return;}
  btn.disabled=true;$('contactStatus').textContent='Sending…';
  try{const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('senderName').value,email:$('senderEmail').value,message:$('senderMessage').value,turnstileToken:challengeToken('contact')})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'Could not send the message.');
    $('contactStatus').textContent='Thank you! Your message has been delivered.';$('contactForm').reset();
  }catch(error){$('contactStatus').textContent=error.message;}
  finally{btn.disabled=false;resetChallenge('contact');}
}

document.querySelectorAll('[data-mode-select]').forEach(btn=>btn.addEventListener('click',()=>chooseMode(btn.dataset.modeSelect)));
function setMoreTypes(open){
  const more=$('moreQrTypes'),panel=$('additionalQrTypes');
  panel.hidden=!open;more.setAttribute('aria-expanded',String(open));
  more.querySelector('.more-chevron').textContent=open?'⌃':'⌄';
  // Keep a selected extra mode reachable even when toggling the section.
  if(!open && ['whatsapp','location','event'].includes(state.mode))chooseMode('url');
}
$('moreQrTypes').addEventListener('click',()=>setMoreTypes($('additionalQrTypes').hidden));
document.querySelectorAll('input[name="locationMethod"]').forEach(r=>r.addEventListener('change',()=>{
  const coords=document.querySelector('input[name="locationMethod"]:checked').value==='coordinates';
  $('locationAddressFields').hidden=coords;$('locationCoordinateFields').hidden=!coords;refresh();
}));
document.querySelector('.mode-column').addEventListener('keydown',e=>{
  if(!e.target.closest('[data-mode-select]'))return;
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();const tabs=Array.from(document.querySelectorAll('[data-mode-select]')).filter(t=>!t.closest('[hidden]'));
  const i=Math.max(0,tabs.findIndex(t=>t===e.target.closest('[data-mode-select]')));
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)+tabs.length)%tabs.length;
  chooseMode(tabs[next].dataset.modeSelect);tabs[next].focus();
});
document.querySelectorAll('.mode-panel input, .mode-panel textarea, .mode-panel select').forEach(el=>{if(el.id!=='localFile')el.addEventListener('input',refresh);});
['fg','bg','eye','fg2','ecc','resolution','gradient','frame','caption'].forEach(id=>$(id).addEventListener('input',()=>{
  $('fg2Group').hidden=!$('gradient').checked;
  $('captionGroup').hidden=$('frame').value==='none';
  if(id!=='resolution')refresh();
}));
document.querySelectorAll('input[name="pattern"],input[name="finder"]').forEach(el=>el.addEventListener('change',refresh));
const colorPresets={navy:['#12263c','#12263c','#145f71'],forest:['#075d4e','#075d4e','#166c67'],royal:['#123f8a','#123f8a','#28578b'],plum:['#56316c','#56316c','#66407c'],black:['#151515','#151515','#333333']};
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{
  const colors=colorPresets[button.dataset.preset];$('fg').value=colors[0];$('eye').value=colors[1];$('fg2').value=colors[2];$('bg').value='#ffffff';
  document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b===button));refresh();
}));
const themeButton=$('themeToggle');
function setTheme(theme){document.documentElement.dataset.theme=theme;themeButton.setAttribute('aria-pressed',String(theme==='dark'));themeButton.setAttribute('aria-label','Switch to '+(theme==='dark'?'light':'dark')+' mode');themeButton.title=themeButton.getAttribute('aria-label');
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#071725':'#f4f8fb';
  try{localStorage.setItem('qrstudio_theme',theme);}catch{}
}
let initialTheme='dark';try{initialTheme=localStorage.getItem('qrstudio_theme')||'dark';}catch{}
setTheme(initialTheme==='dark'?'dark':'light');
themeButton.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
$('resetDesign').addEventListener('click',()=>{$('fg').value='#154fa0';$('bg').value='#ffffff';$('eye').value='#163e8e';$('fg2').value='#6541b2';$('gradient').checked=false;$('fg2Group').hidden=true;$('frame').value='none';$('caption').value='SCAN ME';$('captionGroup').hidden=true;document.querySelector('input[name="pattern"][value="square"]').checked=true;document.querySelector('input[name="finder"][value="square"]').checked=true;document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset==='navy'));$('ecc').value='H';$('resolution').value='2048';state.logo=null;state.logoData=null;$('logoFile').value='';$('clearLogo').hidden=true;refresh();});

$('logoFile').addEventListener('change',async e=>{try{const data=await loadLogo(e.target.files[0]);state.logo=data?.img||null;state.logoData=data?.data||null;if(state.logo)$('ecc').value='H';$('clearLogo').hidden=!state.logo;refresh();}catch(err){e.target.value='';state.logo=null;state.logoData=null;$('clearLogo').hidden=true;refresh();tell(err.message,true);}});
$('clearLogo').addEventListener('click',()=>{state.logo=null;state.logoData=null;$('logoFile').value='';$('clearLogo').hidden=true;refresh();});
$('savePng').addEventListener('click',downloadPng);$('saveSvg').addEventListener('click',downloadSvg);$('savePdf').addEventListener('click',downloadPdf);
$('verify').addEventListener('click',verify);
$('batchCreate').addEventListener('click',createBatch);
$('batchLinks').addEventListener('input',()=>{state.batchCsvRows=null;$('batchCsv').value='';});
$('batchCsv').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;
  if(file.size>150000){$('batchStatus').textContent='CSV must be under 150 KB.';return;}
  try{state.batchCsvRows=parseCsv(await file.text());$('batchStatus').textContent=`Loaded ${state.batchCsvRows.length} named URLs from CSV.`;}
  catch(e){state.batchCsvRows=null;$('batchStatus').textContent=e.message;}
});
document.querySelectorAll('input[name="fileSource"]').forEach(el=>el.addEventListener('change',showFileSource));
$('uploadButton').addEventListener('click',uploadHostedFile);
$('hostedFile').addEventListener('change',()=>{state.uploadMeta=null;$('fileValue').value='';$('fileActions').hidden=true;setFilePreference();refresh();});
$('copyFileLink').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.uploadMeta.url);$('deleteFileStatus').textContent='File link copied.';}catch{$('deleteFileStatus').textContent='Copy unavailable; open your file and copy its URL.';}});
$('saveDeleteReceipt').addEventListener('click',()=>{const r=deleteReceipt();if(r){X.saveBlob(new Blob([r],{type:'text/plain;charset=utf-8'}),'QRStudio_Private_Deletion_Receipt.txt');$('deleteFileStatus').textContent='Receipt downloaded. Keep it private.';}});
$('deleteCurrentFile').addEventListener('click',()=>deleteFile(state.uploadMeta?.id,state.uploadMeta?.deleteToken,'deleteFileStatus'));
$('deleteWithReceipt').addEventListener('click',()=>deleteFile($('deleteId').value.trim(),$('deleteToken').value.trim(),'deleteReceiptStatus'));

$('contactForm').addEventListener('submit',sendContact);

$('scanImageBtn').addEventListener('click',async()=>{
  const f=$('scanImage').files?.[0],result=$('scanResult'),button=$('scanImageBtn');
  result.replaceChildren();
  if(!f){result.textContent='Select an image containing a QR code first.';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>10*1024*1024){result.textContent='Choose a PNG, JPG or WebP image smaller than 10 MB.';return;}
  button.disabled=true;result.textContent='Reading QR image…';
  try{
    const payload=await decodeQrImage(f);
    result.replaceChildren();
    if(payload===null){result.textContent='No readable QR code was detected. Try a sharper, higher-contrast image.';return;}
    const lead=document.createElement('strong');lead.textContent='Decoded content: ';
    const output=document.createElement('span');output.textContent=payload;
    result.append(lead,output);
    const target=U.validWebUrl(payload);
    if(target){const link=document.createElement('a');link.href=target.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open decoded website ↗';result.append(link);}
  }catch(error){result.textContent='Unable to decode this image: '+error.message;}
  finally{button.disabled=false;}
});

refresh();
setupServices();

// Neon Horizon interface-only controls. Core generation and Cloudflare integrations remain unchanged.
{
 const designTabs=[...document.querySelectorAll('[data-design-tab]')];
 designTabs.forEach(tab=>tab.addEventListener('click',()=>{
  const selected=tab.dataset.designTab;
  designTabs.forEach(button=>{button.classList.toggle('active',button===tab);button.setAttribute('aria-selected',String(button===tab));});
  document.querySelectorAll('.design-pane').forEach(pane=>{pane.hidden=pane.dataset.pane!==selected;});
 }));
 const dial=$('sizeDial'), res=$('resolution'), sizeText=$('sizeText');
 if(dial && res && sizeText){
  const sizes=['1024','2048','3072'];
  const syncDial=()=>{dial.value=String(Math.max(0,sizes.indexOf(res.value)));sizeText.textContent=res.value+' px';};
  dial.addEventListener('input',()=>{res.value=sizes[Number(dial.value)]||'2048';sizeText.textContent=res.value+' px';res.dispatchEvent(new Event('input',{bubbles:true}));});
  res.addEventListener('input',syncDial);syncDial();
 }
 const heading=$('dynamicHeading');
 const titles={url:'Website',file:'Share a file',text:'Text',wifi:'Wi-Fi network',contact:'Contact card',email:'Email address',phone:'Phone number',sms:'SMS message',whatsapp:'WhatsApp chat',location:'Share a location',event:'Calendar event'};
 if(heading)document.querySelectorAll('[data-mode-select]').forEach(tab=>tab.addEventListener('click',()=>{heading.textContent=titles[tab.dataset.modeSelect]||'Create QR';}));
}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
