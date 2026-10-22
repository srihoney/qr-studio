/* QR Studio Phase 2 — local, dependency-free vector and raster exports. */
(function(root){
'use strict';
const quiet=4;
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hex=r=>'#'+r.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const pdfColor=h=>hexRgb(h).map(v=>(v/255).toFixed(4)).join(' ');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const escapeXml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function safeSettings(s={}){
  return {fg:s.fg||'#12263c',bg:s.bg||'#ffffff',fg2:s.fg2||s.fg||'#12263c',eye:s.eye||s.fg||'#12263c',gradient:!!s.gradient,pattern:['square','soft','dots','tiles'].includes(s.pattern)?s.pattern:'square',finder:['square','rounded'].includes(s.finder)?s.finder:'square',frame:s.frame==='caption'?'caption':'none',caption:String(s.caption||'SCAN ME').slice(0,36),logo:s.logo||null,logoData:s.logoData||null};
}
function shade(s,y,n){if(!s.gradient)return s.fg;const a=hexRgb(s.fg),b=hexRgb(s.fg2),t=clamp(y/n,0,1);return hex(a.map((v,i)=>v+(b[i]-v)*t));}
function inEye(x,y,n){return (x<7&&y<7)||(x>=n-7&&y<7)||(x<7&&y>=n-7);}
function logoGeometry(matrix){const full=matrix.size+quiet*2,side=matrix.size*.15;return {full,side,x:quiet+(matrix.size-side)/2,y:quiet+(matrix.size-side)/2};}
function shapeParams(style){if(style==='soft')return [.98,.20];if(style==='tiles')return [.96,.08];if(style==='dots')return [.94,.47];return [1,0];}
function finderLocations(n){return [[quiet,quiet],[quiet+n-7,quiet],[quiet,quiet+n-7]];}
function drawRect(ctx,x,y,w,h,r=0){if(r<=0){ctx.fillRect(x,y,w,h);return;}ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(w/2,h/2,r));ctx.fill();}
function drawFinderCanvas(ctx,x,y,step,s){
  const circular=s.finder==='circle';
  const r=s.finder==='rounded'?.65*step:circular?3.5*step:0;
  ctx.fillStyle=s.eye;
  drawRect(ctx,x*step,y*step,7*step,7*step,r);
  ctx.fillStyle=s.bg;drawRect(ctx,(x+1)*step,(y+1)*step,5*step,5*step,circular?2.5*step:s.finder==='rounded'?.55*step:0);
  ctx.fillStyle=s.eye;drawRect(ctx,(x+2)*step,(y+2)*step,3*step,3*step,circular?1.5*step:s.finder==='rounded'?.45*step:0);
}
function drawOnCanvas(matrix,input,pixels=720){
 const s=safeSettings(input),n=matrix.size,size=n+quiet*2,step=Math.max(1,Math.ceil(pixels/size)),px=size*step;
 const frameH=s.frame==='caption'?Math.round(step*5.3):0;
 const canvas=document.createElement('canvas');canvas.width=px;canvas.height=px+frameH;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle=s.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
 const [scale,radius]=shapeParams(s.pattern),inset=(1-scale)/2;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(matrix.data[y][x]&&!inEye(x,y,n)){
  const z=scale*step,l=(x+quiet+inset)*step,t=(y+quiet+inset)*step;
  ctx.fillStyle=shade(s,y,n);
  drawRect(ctx,l,t,z,z,radius*step);
 }
 for(const [x,y] of finderLocations(n))drawFinderCanvas(ctx,x,y,step,s);
 if(s.logo){const g=logoGeometry(matrix),pad=step*.7;ctx.fillStyle=s.bg;drawRect(ctx,g.x*step-pad,g.y*step-pad,g.side*step+pad*2,g.side*step+pad*2,step*.35);ctx.drawImage(s.logo,g.x*step,g.y*step,g.side*step,g.side*step);}
 if(frameH){ctx.fillStyle=s.fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.max(13,step*2.0)}px system-ui, Arial, sans-serif`;ctx.fillText(s.caption,px/2,px+frameH*.43,px*.83);}
 return canvas;
}
function svgShape(x,y,w,h,r){if(!r)return `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;}
function svgMarkup(matrix,input){
 const s=safeSettings(input),n=matrix.size,size=n+8,height=size+(s.frame==='caption'?5.3:0);
 let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${size*20}" height="${height*20}" viewBox="0 0 ${size} ${height}">`;
 out+=`<rect width="${size}" height="${height}" fill="${s.bg}"/>`;
 if(s.gradient)out+=`<defs><linearGradient id="codefill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.fg}"/><stop offset="1" stop-color="${s.fg2}"/></linearGradient></defs>`;
 out+=`<g fill="${s.gradient?'url(#codefill)':s.fg}">`;
 const [scale,r]=shapeParams(s.pattern),inset=(1-scale)/2;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(matrix.data[y][x]&&!inEye(x,y,n))out+=svgShape(quiet+x+inset,quiet+y+inset,scale,scale,r);
 out+='</g>';
 const fR=s.finder==='rounded'?.65:s.finder==='circle'?3.5:0;
 const innerR=s.finder==='rounded'?.55:s.finder==='circle'?2.5:0;
 const coreR=s.finder==='rounded'?.45:s.finder==='circle'?1.5:0;
 for(const [x,y] of finderLocations(n))out+=`<g fill="${s.eye}">${svgShape(x,y,7,7,fR)}</g><g fill="${s.bg}">${svgShape(x+1,y+1,5,5,innerR)}</g><g fill="${s.eye}">${svgShape(x+2,y+2,3,3,coreR)}</g>`;
 if(s.logo&&s.logoData){const g=logoGeometry(matrix),pad=.7;out+=`<rect x="${g.x-pad}" y="${g.y-pad}" width="${g.side+2*pad}" height="${g.side+2*pad}" rx=".35" fill="${s.bg}"/><image href="${s.logoData}" x="${g.x}" y="${g.y}" width="${g.side}" height="${g.side}" preserveAspectRatio="xMidYMid meet"/>`;}
 if(s.frame==='caption')out+=`<text x="${size/2}" y="${size+3.1}" fill="${s.fg}" font-family="Arial,sans-serif" font-size="2" font-weight="bold" text-anchor="middle">${escapeXml(s.caption)}</text>`;
 return out+'</svg>';
}
function canvasBlob(canvas,type='image/png'){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),type));}
function saveBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function ascii(str){return String(str).normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replace(/[()\\]/g,'\\$&');}
function concatBytes(parts){const arrays=parts.map(p=>typeof p==='string'?new TextEncoder().encode(p):p);const len=arrays.reduce((a,b)=>a+b.length,0);const out=new Uint8Array(len);let i=0;for(const a of arrays){out.set(a,i);i+=a.length;}return out;}
function pdfPath(x,y,w,h,r){
 if(!r)return `${x.toFixed(4)} ${y.toFixed(4)} ${w.toFixed(4)} ${h.toFixed(4)} re f`;
 r=Math.min(w/2,h/2,r);const k=.5522847498,c=r*k;
 return `${(x+r).toFixed(4)} ${y.toFixed(4)} m ${(x+w-r).toFixed(4)} ${y.toFixed(4)} l ${(x+w-r+c).toFixed(4)} ${y.toFixed(4)} ${(x+w).toFixed(4)} ${(y+r-c).toFixed(4)} ${(x+w).toFixed(4)} ${(y+r).toFixed(4)} c ${(x+w).toFixed(4)} ${(y+h-r).toFixed(4)} l ${(x+w).toFixed(4)} ${(y+h-r+c).toFixed(4)} ${(x+w-r+c).toFixed(4)} ${(y+h).toFixed(4)} ${(x+w-r).toFixed(4)} ${(y+h).toFixed(4)} c ${(x+r).toFixed(4)} ${(y+h).toFixed(4)} l ${(x+r-c).toFixed(4)} ${(y+h).toFixed(4)} ${x.toFixed(4)} ${(y+h-r+c).toFixed(4)} ${x.toFixed(4)} ${(y+h-r).toFixed(4)} c ${x.toFixed(4)} ${(y+r).toFixed(4)} l ${x.toFixed(4)} ${(y+r-c).toFixed(4)} ${(x+r-c).toFixed(4)} ${y.toFixed(4)} ${(x+r).toFixed(4)} ${y.toFixed(4)} c h f`;
}
function pdfBytes(matrix,input,title='Scan to open'){
 const s=safeSettings(input),pageW=612,pageH=792,side=420,qrX=(pageW-side)/2,qrY=190,n=matrix.size,cell=side/(n+8);
 const commands=['q',`${pdfColor(s.bg)} rg`,`${qrX} ${qrY} ${side} ${side} re f`];
 const [scale,radius]=shapeParams(s.pattern),inset=(1-scale)/2;
 let last='';
 const fill=color=>{if(color!==last){commands.push(pdfColor(color)+' rg');last=color;}};
 const rect=(x,y,w,h,r=0)=>{commands.push(pdfPath(qrX+x*cell,qrY+side-(y+h)*cell,w*cell,h*cell,r*cell));};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(matrix.data[y][x]&&!inEye(x,y,n)){fill(shade(s,y,n));rect(x+4+inset,y+4+inset,scale,scale,radius);}
 const fR=s.finder==='rounded'?.65:s.finder==='circle'?3.5:0,innerR=s.finder==='rounded'?.55:s.finder==='circle'?2.5:0,coreR=s.finder==='rounded'?.45:s.finder==='circle'?1.5:0;
 for(const [x,y] of finderLocations(n)){fill(s.eye);rect(x,y,7,7,fR);fill(s.bg);rect(x+1,y+1,5,5,innerR);fill(s.eye);rect(x+2,y+2,3,3,coreR);}
 let jpeg=null;
 if(s.logo){const g=logoGeometry(matrix),pad=.7,bx=qrX+g.x*cell,by=qrY+side-(g.y+g.side)*cell;
   fill(s.bg);rect(g.x-pad,g.y-pad,g.side+pad*2,g.side+pad*2,.35);
   const image=document.createElement('canvas');image.width=image.height=360;const ctx=image.getContext('2d');ctx.fillStyle=s.bg;ctx.fillRect(0,0,360,360);ctx.drawImage(s.logo,0,0,360,360);
   jpeg=Uint8Array.from(atob(image.toDataURL('image/jpeg',.96).split(',')[1]),ch=>ch.charCodeAt(0));
   commands.push(`q ${(g.side*cell).toFixed(3)} 0 0 ${(g.side*cell).toFixed(3)} ${bx.toFixed(3)} ${by.toFixed(3)} cm /Logo Do Q`);
 }
 commands.push('Q','0.13 0.18 0.26 rg','BT /F1 17 Tf',`${Math.max(40,306-Math.min(62,title.length*3.7)).toFixed(0)} 665 Td`,'('+ascii(title.slice(0,65))+') Tj','ET');
 if(s.frame==='caption')commands.push('0.16 0.22 0.27 rg','BT /F1 13 Tf',`${Math.max(90,306-Math.min(145,s.caption.length*3.5)).toFixed(0)} 166 Td`,'('+ascii(s.caption)+') Tj','ET');
 commands.push('0.37 0.43 0.50 rg','BT /F1 10 Tf','147 138 Td','(Static QR - No built-in expiration) Tj','ET');
 const content=new TextEncoder().encode(commands.join('\n')+'\n');
 let objects=[];
 objects.push('<< /Type /Catalog /Pages 2 0 R >>');
 objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> ${jpeg?'/XObject << /Logo 6 0 R >>':''} >> >>`);
 objects.push(concatBytes([`<< /Length ${content.length} >>\nstream\n`,content,'endstream']));
 objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 if(jpeg)objects.push(concatBytes([`<< /Type /XObject /Subtype /Image /Width 360 /Height 360 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,jpeg,'\nendstream']));
 const sections=['%PDF-1.4\n%QRstudio\n'],offsets=[0];let length=new TextEncoder().encode(sections[0]).length;
 for(let i=0;i<objects.length;i++){offsets.push(length);const block=concatBytes([`${i+1} 0 obj\n`,objects[i],'\nendobj\n']);sections.push(block);length+=block.length;}
 const xref=length;sections.push(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`);
 for(let i=1;i<offsets.length;i++)sections.push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
 sections.push(`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return concatBytes(sections);
}
const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);return c>>>0;});
function crc32(a){let crc=0xffffffff;for(const b of a)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function zipBytes(files){
  const encoder=new TextEncoder(),local=[],central=[];let offset=0;
  function uint16(v){return [v&255,(v>>>8)&255];}
  function uint32(v){return [v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];}
  for(const file of files){const name=encoder.encode(file.name);const data=file.bytes;const crc=crc32(data);
    const localHeader=Uint8Array.from([80,75,3,4,...uint16(20),...uint16(0x0800),...uint16(0),...uint16(0),...uint16(0),...uint32(crc),...uint32(data.length),...uint32(data.length),...uint16(name.length),...uint16(0)]);
    local.push(localHeader,name,data);
    const center=Uint8Array.from([80,75,1,2,...uint16(20),...uint16(20),...uint16(0x0800),...uint16(0),...uint16(0),...uint16(0),...uint32(crc),...uint32(data.length),...uint32(data.length),...uint16(name.length),...uint16(0),...uint16(0),...uint16(0),...uint16(0),...uint32(0),...uint32(offset)]);
    central.push(center,name);offset+=localHeader.length+name.length+data.length;
  }
  const c=concatBytes(central),end=Uint8Array.from([80,75,5,6,0,0,0,0,...uint16(files.length),...uint16(files.length),...uint32(c.length),...uint32(offset),0,0]);
  return concatBytes([...local,c,end]);
}
root.QRStudioExports={drawOnCanvas,svgMarkup,canvasBlob,saveBlob,pdfBytes,zipBytes,concatBytes};
if(typeof module!=='undefined'&&module.exports)module.exports=root.QRStudioExports;
})(typeof window!=='undefined'?window:globalThis);
