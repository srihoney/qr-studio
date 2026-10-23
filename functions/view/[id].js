const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function onRequestGet({request,env,params}){
  if(!env.DB||!env.FILES)return new Response('Viewer unavailable',{status:503});
  const id=params.id||'';
  if(!/^[a-f0-9-]{36}$/.test(id))return new Response('File not found',{status:404});
  const row=await env.DB.prepare('SELECT id,storage_key,file_name,mime,expires_at,access_mode FROM uploads WHERE id=?').bind(id).first();
  if(!row)return new Response('File not found',{status:404});
  if(Date.now()>=row.expires_at)return new Response('This file has expired',{status:410});
  if(!await env.FILES.head(row.storage_key))return new Response('File not found',{status:404});
  const inline=['application/pdf','image/png','image/jpeg','image/webp'].includes(row.mime);
  const image=row.mime?.startsWith('image/');
  const viewOnly=row.access_mode==='view';
  const fileUrl='/file/'+id;
  const body=inline?(image?`<img class="doc-preview" src="${fileUrl}" alt="${esc(row.file_name)}">`:`<iframe title="PDF viewer" src="${fileUrl}#toolbar=${viewOnly?'0':'1'}" loading="eager"></iframe>`):`<div class="no-preview"><h2>Preview unavailable</h2><p>This type of file requires a compatible application to open.</p></div>`;
  const date=new Date(row.expires_at).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
  const download=!viewOnly?`<a class="download" href="${fileUrl}?download=1">↓ Download file</a>`:'';
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(row.file_name)} | QR Studio</title><link rel="stylesheet" href="/assets/css/viewer.css"></head><body><header class="top"><div class="top-inner"><a class="brand" href="/">▦ QR <span>Studio</span></a><span class="chip">${viewOnly?'View Online':'View &amp; Download'}</span></div></header><main><div class="details"><div><h1>${esc(row.file_name)}</h1><p>Available through ${esc(date)} · Anyone with this link can access the file.</p></div>${download}</div><div class="viewer">${body}</div><p class="notice">${viewOnly?'Viewing only hides the download control; it cannot prevent screenshots, copying or saving with browser tools.':'You can view supported documents above or download the original file.'}</p></main><footer>QR Studio · File sharing expires after 30 days.</footer></body></html>`;
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self'; img-src 'self'; frame-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}});
}
