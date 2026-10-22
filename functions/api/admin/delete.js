import {apiJson,error,readLimited} from '../../_lib/common.js';
export async function onRequestPost({request,env}){
  const token=request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'')||'';
  if(!env.ADMIN_TOKEN||!token||token.length!==env.ADMIN_TOKEN.length)return error('Not found.',404);
  const a=new TextEncoder().encode(token),b=new TextEncoder().encode(env.ADMIN_TOKEN);
  let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];if(mismatch)return error('Not found.',404);
  if(!env.DB||!env.FILES)return error('Service unavailable.',503);
  let data;try{data=JSON.parse(await (await readLimited(request,1000)).text());}catch{return error('Invalid request.');}
  if(!/^[a-f0-9-]{36}$/.test(data.id||''))return error('Invalid file ID.');
  const row=await env.DB.prepare('SELECT storage_key FROM uploads WHERE id=?').bind(data.id).first();
  if(!row)return error('Not found.',404);
  await env.FILES.delete(row.storage_key);
  await env.DB.prepare('DELETE FROM uploads WHERE id=?').bind(data.id).run();
  return apiJson({ok:true});
}
