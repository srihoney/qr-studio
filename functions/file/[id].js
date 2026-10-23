import {error} from '../_lib/common.js';
const safeInlineMimes=new Set(['application/pdf','image/png','image/jpeg','image/webp']);
async function handler({request,env,params}){
  if(!env.DB||!env.FILES)return error('File service unavailable.',503);
  const id=params.id||'';
  if(!/^[a-f0-9-]{36}$/.test(id))return error('File not found.',404);
  let row;
  try{row=await env.DB.prepare('SELECT * FROM uploads WHERE id=?').bind(id).first();}
  catch{return error('File metadata unavailable.',503);}
  if(!row)return error('File not found or removed.',404);
  if(Date.now()>=row.expires_at)return error('This file link expired after 30 days.',410);
  const obj=await env.FILES.get(row.storage_key);
  if(!obj)return error('File no longer available.',404);
  const permittedMime=safeInlineMimes.has(row.mime)?row.mime:null;
  const allowInline=!!permittedMime;
  const raw=new URL(request.url).searchParams.get('download')==='1';
  const wantDownload=raw && row.access_mode!=='view';
  const asciiName=String(row.file_name||'download').replace(/[^\x20-\x7E]|["\\;]/g,'_').slice(0,100);
  const encodedName=encodeURIComponent(String(row.file_name||'download'));
  const headers=new Headers({
    'Content-Type':allowInline?permittedMime:'application/octet-stream',
    'Content-Disposition':`${allowInline&&!wantDownload?'inline':'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    'X-Content-Type-Options':'nosniff',
    'Content-Security-Policy':"default-src 'none'; sandbox",
    'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow',
    'Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'
  });
  // Never inline Office documents or TXT to avoid active content in the website origin.
  headers.set('Content-Length',String(obj.size));
  return new Response(request.method==='HEAD'?null:obj.body,{headers});
}
export const onRequestGet=handler;
export const onRequestHead=handler;
