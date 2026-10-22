export const MAX_BYTES = 5 * 1024 * 1024;
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const DAILY_GLOBAL_MAX = 150 * 1024 * 1024; // fail closed if exhausted
export const ACTIVE_GLOBAL_MAX = 3 * 1024 * 1024 * 1024;
export const DAILY_PER_IP_MAX = 10;
export function apiJson(payload,status=200){return Response.json(payload,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function error(message,status=400){return apiJson({error:message},status);}
export function allowedOrigin(request){const origin=request.headers.get('Origin');return !origin || origin===new URL(request.url).origin;}
export async function verifyTurnstile(token,env,request){
  if(!env.TURNSTILE_SECRET || !token || token.length>2048)return false;
  try{const body=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});
    const ip=request.headers.get('CF-Connecting-IP');if(ip)body.set('remoteip',ip);
    const resp=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(7000)});
    if(!resp.ok)return false;const data=await resp.json();
    const hostname=new URL(request.url).hostname;
    return data.success===true && data.hostname===hostname;
  }catch{return false;}
}
export async function readLimited(request,limit){
  if(!request.body)throw Error('Missing request body.');
  const chunks=[];let total=0;const reader=request.body.getReader();
  try{while(true){const {done,value}=await reader.read();if(done)break;
    total+=value.byteLength;if(total>limit){await reader.cancel();throw Error('Request exceeds maximum size.');}
    chunks.push(value);
  }}finally{reader.releaseLock();}
  return new Blob(chunks);
}
export async function clientHash(req,env){
  const ip=req.headers.get('CF-Connecting-IP')||'shared-anonymous';
  const bytes=new TextEncoder().encode(`${env.RATE_SALT}:${ip}`);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function safeFilename(name){return String(name||'download').replace(/[\r\n\\/\u0000-\u001f\u007f"<>]/g,'_').slice(0,100)||'download';}
export function uploadType(name,bytes){
  const ext=String(name).toLowerCase().split('.').pop();
  if(bytes.length<4)return null;
  const begins=(...arr)=>arr.every((v,i)=>bytes[i]===v);
  const zip=begins(0x50,0x4b,0x03,0x04)||begins(0x50,0x4b,0x05,0x06);
  const rules={
    pdf: ['application/pdf',begins(0x25,0x50,0x44,0x46,0x2d)],
    png: ['image/png',begins(137,80,78,71,13,10,26,10)],
    jpg: ['image/jpeg',begins(0xff,0xd8,0xff)],
    jpeg:['image/jpeg',begins(0xff,0xd8,0xff)],
    webp:['image/webp',String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'],
    docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document',zip],
    pptx:['application/vnd.openxmlformats-officedocument.presentationml.presentation',zip],
    xlsx:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',zip],
    mp4:['video/mp4',String.fromCharCode(...bytes.slice(4,8))==='ftyp'],
    txt:['text/plain',!bytes.some(b=>b===0)],
  };
  return rules[ext]?.[1]?rules[ext][0]:null;
}
