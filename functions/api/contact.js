import {apiJson,error,allowedOrigin,verifyTurnstile,clientHash,readLimited} from '../_lib/common.js';
export async function onRequestPost({request,env}){
  if(!env.DB||!env.RATE_SALT||!env.RESEND_API_KEY||!env.CONTACT_TO||!env.RESEND_FROM||!env.TURNSTILE_SECRET)return error('Contact form unavailable.',503);
  if(!allowedOrigin(request))return error('Origin not allowed.',403);
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>7000)return error('Message is too long.',413);
  let body;try{body=JSON.parse(await (await readLimited(request,7000)).text());}catch{return error('Invalid or oversized message.',413);}
  const name=String(body.name||'').trim(),email=String(body.email||'').trim(),message=String(body.message||'').trim();
  if(name.length<2||name.length>90||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)||email.length>254||message.length<10||message.length>4000)return error('Check name, email and message.');
  if(!await verifyTurnstile(String(body.turnstileToken||''),env,request))return error('Security check expired or failed.',403);
  const identity=await clientHash(request,env),now=Date.now(),dayStart=now-now%86400000;
  try{const per=await env.DB.prepare('SELECT COUNT(*) AS count FROM contacts_rate WHERE sender_hash=? AND created_at>=?').bind(identity,dayStart).first();
    if((per?.count||0)>=3)return error('Daily contact limit reached. Try again tomorrow.',429);
    const global=await env.DB.prepare('SELECT COUNT(*) AS count FROM contacts_rate WHERE created_at>=?').bind(dayStart).first();
    if((global?.count||0)>=60)return error('Contact capacity reached today. Please try tomorrow.',429);
    // Reserve a send before calling external provider; prevents rapid replay storms.
    await env.DB.prepare('INSERT INTO contacts_rate(id,sender_hash,created_at) VALUES(?,?,?)').bind(crypto.randomUUID(),identity,now).run();
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.RESEND_FROM,to:[env.CONTACT_TO],reply_to:email,subject:'QR Studio: website feedback',text:`Name: ${name}\nReply email: ${email}\n\n${message}`}),signal:AbortSignal.timeout(12000)});
    if(!response.ok)return error('We could not deliver your message right now. Please retry later.',502);
    return apiJson({ok:true});
  }catch{return error('Message service is temporarily unavailable.',503);}
}
