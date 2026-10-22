import {apiJson} from '../_lib/common.js';
export async function onRequestGet({env}){
  const challenge=!!(env.TURNSTILE_SITE_KEY&&env.TURNSTILE_SECRET);
  return apiJson({
    uploadsEnabled:challenge&&!!(env.FILES&&env.DB&&env.RATE_SALT),
    contactEnabled:challenge&&!!(env.DB&&env.RATE_SALT&&env.RESEND_API_KEY&&env.CONTACT_TO&&env.RESEND_FROM),
    turnstileSiteKey:challenge?env.TURNSTILE_SITE_KEY:null,
    maxFileBytes:5242880,retentionDays:30
  });
}
