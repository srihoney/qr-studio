import {MAX_BYTES,RETENTION_MS,DAILY_GLOBAL_MAX,ACTIVE_GLOBAL_MAX,DAILY_PER_IP_MAX,apiJson,error,allowedOrigin,verifyTurnstile,clientHash,safeFilename,uploadType,readLimited} from '../_lib/common.js';
export async function onRequestPost({request,env}){
  if(!env.FILES||!env.DB||!env.RATE_SALT||!env.TURNSTILE_SECRET)return error('File hosting is unavailable.',503);
  if(!allowedOrigin(request))return error('Origin not allowed.',403);
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>MAX_BYTES+60000)return error('Upload exceeds 5 MB.',413);
  let body;try{const limited=await readLimited(request,MAX_BYTES+60000);body=await new Response(limited,{headers:{'Content-Type':request.headers.get('Content-Type')||''}}).formData();}
  catch{return error('Invalid upload or upload exceeds 5 MB.',413);}
  const file=body.get('file'),token=body.get('turnstileToken');
  if(!(file instanceof File)||file.size===0||file.size>MAX_BYTES)return error('Choose a file between 1 byte and 5 MB.',413);
  if(!await verifyTurnstile(String(token||''),env,request))return error('Security check expired or failed. Try again.',403);
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=uploadType(file.name,bytes);
  if(!mime)return error('Unsupported or invalid file. Use PDF, PNG, JPG, WebP, TXT, DOCX, PPTX, XLSX or MP4.');
  const now=Date.now(),dayStart=now-now%86400000,identity=await clientHash(request,env);
  try{
    const per=await env.DB.prepare('SELECT COUNT(*) AS count FROM uploads WHERE creator_hash=? AND created_at>=?').bind(identity,dayStart).first();
    if((per?.count||0)>=DAILY_PER_IP_MAX)return error('Daily upload allowance reached. Please try again tomorrow.',429);
    const global=await env.DB.prepare('SELECT COALESCE(SUM(CASE WHEN created_at>=? THEN size ELSE 0 END),0) AS today, COALESCE(SUM(CASE WHEN expires_at>? THEN size ELSE 0 END),0) AS active FROM uploads').bind(dayStart,now).first();
    if(Number(global?.today||0)+file.size>DAILY_GLOBAL_MAX||Number(global?.active||0)+file.size>ACTIVE_GLOBAL_MAX)return error('Temporary hosting capacity is full. Use your own cloud link or try again later.',429);
    const id=crypto.randomUUID(),expiresAt=now+RETENTION_MS,name=safeFilename(file.name),key='uploads/'+id;
    await env.FILES.put(key,bytes,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{expiresAt:String(expiresAt)}});
    try{await env.DB.prepare('INSERT INTO uploads(id,storage_key,file_name,mime,size,creator_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,key,name,mime,file.size,identity,now,expiresAt).run();}
    catch(e){await env.FILES.delete(key);throw e;}
    const url=new URL('/file/'+id,request.url).href;
    return apiJson({url,id,expiresAt:new Date(expiresAt).toISOString(),size:file.size,name},201);
  }catch{return error('Unable to store the file right now. Please try later.',503);}
}
