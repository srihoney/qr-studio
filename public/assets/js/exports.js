/* QR Studio — all exports run locally; no network calls or external packages. */
(function(root){
'use strict';
const quiet=4;
const hexRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const pdfColor=h=>hexRgb(h).map(v=>(v/255).toFixed(4)).join(' ');
function logoGeometry(matrix){const full=matrix.size+quiet*2, side=matrix.size*.16;return {full,side,x:quiet+(matrix.size-side)/2,y:quiet+(matrix.size-side)/2};}
function drawOnCanvas(matrix,settings,pixels=720){
  const size=matrix.size+quiet*2, step=Math.max(1,Math.ceil(pixels/size)), px=size*step;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=px;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle=settings.bg;ctx.fillRect(0,0,px,px);
  ctx.fillStyle=settings.fg;
  for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.data[y][x])ctx.fillRect((x+quiet)*step,(y+quiet)*step,step,step);
  if(settings.logo){const g=logoGeometry(matrix), pad=step*.7;
    ctx.fillStyle='#ffffff';ctx.fillRect(g.x*step-pad,g.y*step-pad,g.side*step+pad*2,g.side*step+pad*2);
    ctx.drawImage(settings.logo,g.x*step,g.y*step,g.side*step,g.side*step);
  }
  return canvas;
}
function svgMarkup(matrix,settings){
  const size=matrix.size+quiet*2;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  s+=`<rect width="${size}" height="${size}" fill="${settings.bg}"/>`;
  s+=`<path fill="${settings.fg}" d="`;
  for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.data[y][x])s+=`M${x+quiet} ${y+quiet}h1v1h-1z`;
  s+='"/>';
  if(settings.logo&&settings.logoData){const g=logoGeometry(matrix);const pad=.7;
    s+=`<rect x="${g.x-pad}" y="${g.y-pad}" width="${g.side+pad*2}" height="${g.side+pad*2}" fill="#ffffff"/>`;
    s+=`<image href="${settings.logoData}" x="${g.x}" y="${g.y}" width="${g.side}" height="${g.side}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return s+'</svg>';
}
function canvasBlob(canvas,type='image/png'){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export failed.')),type));}
function saveBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function ascii(str){return String(str).normalize('NFKD').replace(/[^\x20-\x7e]/g,'?').replace(/[()\\]/g,'\\$&');}
function concatBytes(parts){const arrays=parts.map(p=>typeof p==='string'?new TextEncoder().encode(p):p);const len=arrays.reduce((a,b)=>a+b.length,0);const out=new Uint8Array(len);let i=0;for(const a of arrays){out.set(a,i);i+=a.length;}return out;}
function pdfBytes(matrix,settings,title='Scan to open'){
  const pageW=612,pageH=792,side=420,qrX=(pageW-side)/2,qrY=190,n=matrix.size+8,cell=side/n;
  let commands=['q',`${pdfColor(settings.bg)} rg`,`${qrX} ${qrY} ${side} ${side} re f`,`${pdfColor(settings.fg)} rg`];
  for(let y=0;y<matrix.size;y++)for(let x=0;x<matrix.size;x++)if(matrix.data[y][x])commands.push(`${(qrX+(x+4)*cell).toFixed(4)} ${(qrY+side-(y+5)*cell).toFixed(4)} ${cell.toFixed(4)} ${cell.toFixed(4)} re f`);
  let jpeg=null, jpegWidth=0,jpegHeight=0;
  if(settings.logo){const g=logoGeometry(matrix), pad=cell*.7, bx=qrX+g.x*cell, by=qrY+side-(g.y+g.side)*cell;
    commands.push('1 1 1 rg',`${(bx-pad).toFixed(3)} ${(by-pad).toFixed(3)} ${(g.side*cell+2*pad).toFixed(3)} ${(g.side*cell+2*pad).toFixed(3)} re f`);
    // Canvas image is converted locally to JPEG before embedding as a standard PDF XObject.
    const image=document.createElement('canvas');image.width=image.height=360;const c=image.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,360,360);c.drawImage(settings.logo,0,0,360,360);
    jpeg=Uint8Array.from(atob(image.toDataURL('image/jpeg',.96).split(',')[1]),ch=>ch.charCodeAt(0));jpegWidth=360;jpegHeight=360;
    commands.push(`q ${(g.side*cell).toFixed(3)} 0 0 ${(g.side*cell).toFixed(3)} ${bx.toFixed(3)} ${by.toFixed(3)} cm /Logo Do Q`);
  }
  commands.push('Q','0.13 0.18 0.26 rg','BT /F1 17 Tf',`${Math.max(40,306-Math.min(62,title.length*3.7)).toFixed(0)} 665 Td`,'('+ascii(title.slice(0,65))+') Tj','ET');
  commands.push('0.37 0.43 0.50 rg','BT /F1 10 Tf','147 158 Td','(Static QR - No built-in expiration) Tj','ET');
  const content=new TextEncoder().encode(commands.join('\n')+'\n');
  let objects=[];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> ${jpeg?'/XObject << /Logo 6 0 R >>':''} >> >>`);
  objects.push(concatBytes([`<< /Length ${content.length} >>\nstream\n`,content,'endstream']));
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  if(jpeg)objects.push(concatBytes([`<< /Type /XObject /Subtype /Image /Width ${jpegWidth} /Height ${jpegHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,jpeg,'\nendstream']));
  const sections=['%PDF-1.4\n%QRstudio\n'], offsets=[0];let length=new TextEncoder().encode(sections[0]).length;
  for(let i=0;i<objects.length;i++){offsets.push(length);const block=concatBytes([`${i+1} 0 obj\n`,objects[i],'\nendobj\n']);sections.push(block);length+=block.length;}
  const xref=length;
  sections.push(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`);
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
