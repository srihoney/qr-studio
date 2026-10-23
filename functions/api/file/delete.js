import {apiJson,error,allowedOrigin,readLimited} from '../../_lib/common.js';
function bytes(s){return new TextEncoder().encode(s);}
function equalHash(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export async function onRequestPost({request,env}){
  if(!env.DB||!env.FILES)return error('File deletion is unavailable.',503);
  if(!allowedOrigin(request))return error('Origin not allowed.',403);
  let body;try{body=JSON.parse(await (await readLimited(request,2000)).text());}catch{return error('Invalid request.');}
  const id=String(body.id||''),token=String(body.deleteToken||'');
  if(!/^[a-f0-9-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(token))return error('Invalid deletion credentials.',403);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes(token)));
  const hash=Array.from(digest).map(b=>b.toString(16).padStart(2,'0')).join('');
  const row=await env.DB.prepare('SELECT storage_key,delete_token_hash FROM uploads WHERE id=?').bind(id).first();
  if(!row?.delete_token_hash||!equalHash(hash,row.delete_token_hash))return error('Invalid deletion credentials.',403);
  try{await env.FILES.delete(row.storage_key);await env.DB.prepare('DELETE FROM uploads WHERE id=?').bind(id).run();return apiJson({ok:true});}
  catch{return error('Deletion could not be completed. Retry later.',503);}
}
