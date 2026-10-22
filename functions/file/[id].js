import {error} from '../_lib/common.js';
async function handler({request,env,params}){
  if(!env.DB||!env.FILES)return error('File service unavailable.',503);
  const id=params.id||'';
  if(!/^[a-f0-9-]{36}$/.test(id))return error('File not found.',404);
  const row=await env.DB.prepare('SELECT * FROM uploads WHERE id=?').bind(id).first();
  if(!row)return error('File not found or removed.',404);
  if(Date.now()>=row.expires_at)return error('This file link expired after 30 days.',410);
  const obj=await env.FILES.get(row.storage_key);
  if(!obj)return error('File no longer available.',404);
  const header=new Headers({
    'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${row.file_name.replace(/["\\]/g,'_')}"`,
    'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",
    'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'
  });
  header.set('Content-Length',String(obj.size));
  return new Response(request.method==='HEAD'?null:obj.body,{headers:header});
}
export const onRequestGet=handler;
export const onRequestHead=handler;
