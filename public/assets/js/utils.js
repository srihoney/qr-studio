/* QR Studio — browser and Node compatible pure helpers. */
(function (root) {
  'use strict';
  const MAX_QR_BYTES = {L:2953, M:2331, Q:1663, H:1273};
  function escapeWifi(s) { return String(s).replace(/([\\;,":])/g, '\\$1'); }
  function escapeVcard(s) { return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,'); }
  function validWebUrl(s) {
    try { const u=new URL(String(s).trim()); return ['http:','https:'].includes(u.protocol) && !!u.hostname ? u : null; }
    catch { return null; }
  }
  function providerOf(url) {
    const u=validWebUrl(url); if(!u)return 'Unknown';
    const h=u.hostname.toLowerCase();
    if(h==='drive.google.com' || h==='docs.google.com')return 'Google Drive / Docs';
    if(h==='dropbox.com'||h.endsWith('.dropbox.com')||h==='dl.dropboxusercontent.com')return 'Dropbox';
    if(h==='1drv.ms'||h==='onedrive.live.com'||h.endsWith('.sharepoint.com'))return 'OneDrive / SharePoint';
    if(h==='github.com'||h==='raw.githubusercontent.com')return 'GitHub';
    return 'Other website';
  }
  function expiryOfUrl(url) {
    const u=validWebUrl(url);
    if(!u)return {status:'unknown',detail:'Please provide a valid HTTPS or HTTP address.'};
    const params=Array.from(u.searchParams.entries());
    const flagged=params.filter(([key])=>['expires','expire','expiry','exp','se','x-amz-expires','x-goog-expires','x-amz-date','x-goog-date','token_expiry'].includes(key.toLowerCase()));
    if(flagged.length)return {status:'possible',detail:'This URL contains a parameter often used for expiring access. It may be temporary; no reliable expiration date can be verified locally.'};
    return {status:'unknown',detail:'No expiration is declared in the QR code. The destination may change or become unavailable. We cannot verify how long it will remain online.'};
  }
  function escapeIcs(s) { return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,'); }
  function dateIcs(s) {
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s))throw Error('Choose a valid event date and time.');
    const d=new Date(s);
    if(Number.isNaN(d.getTime()) || d.getFullYear()!==Number(s.slice(0,4)) || d.getMonth()+1!==Number(s.slice(5,7)) || d.getDate()!==Number(s.slice(8,10)) || d.getHours()!==Number(s.slice(11,13)) || d.getMinutes()!==Number(s.slice(14,16)))throw Error('Choose a valid local event date and time.');
    return s.replace(/[-:]/g,'')+'00';
  }
  function eventUid(seed) {
    let hash=2166136261;for(const ch of seed){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619);}
    return (hash>>>0).toString(16).padStart(8,'0')+'@qrstudio.invalid';
  }
  function encodePayload(mode, f) {
    const value=k=>String(f[k]||'').trim();
    if(mode==='url'||mode==='file'){
      const u=validWebUrl(value('url')); if(!u)throw Error('Enter a valid http:// or https:// link.');
      return u.href;
    }
    if(mode==='text'){
      if(!value('text'))throw Error('Enter some text to encode.');
      return String(f.text).trim();
    }
    if(mode==='wifi'){
      const ssid=String(f.ssid||''); if(!ssid.trim())throw Error('Enter a Wi-Fi network name.');
      const sec=f.security||'WPA'; if(!['WPA','WEP','nopass'].includes(sec))throw Error('Invalid Wi-Fi security setting.');
      if(sec!=='nopass'&&!String(f.password||''))throw Error('Enter the Wi-Fi password.');
      return `WIFI:T:${sec};S:${escapeWifi(ssid)};P:${sec==='nopass'?'':escapeWifi(f.password||'')};H:${f.hidden?'true':'false'};;`;
    }
    if(mode==='contact'){
      if(!value('name'))throw Error('Enter a contact name.');
      const props=['BEGIN:VCARD','VERSION:3.0',`FN:${escapeVcard(value('name'))}`];
      if(value('organization'))props.push(`ORG:${escapeVcard(value('organization'))}`);
      if(value('phone'))props.push(`TEL:${escapeVcard(value('phone'))}`);
      if(value('email'))props.push(`EMAIL:${escapeVcard(value('email'))}`);
      if(value('website')){if(!validWebUrl(value('website')))throw Error('Enter a valid contact website link.');props.push(`URL:${value('website')}`);}
      props.push('END:VCARD'); return props.join('\r\n');
    }
    if(mode==='email'){
      const to=value('email'); if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))throw Error('Enter a valid email address.');
      const p=[];if(value('subject'))p.push('subject='+encodeURIComponent(value('subject')));
      if(value('body'))p.push('body='+encodeURIComponent(value('body')));
      return 'mailto:'+to+(p.length?'?'+p.join('&'):'');
    }
    if(mode==='phone'){
      if(!/^[+\d() .-]{4,32}$/.test(value('phone')))throw Error('Enter a valid phone number.');
      return 'tel:'+value('phone').replace(/[() .-]/g,'');
    }
    if(mode==='whatsapp'){
      const number=value('phone').replace(/[\s().-]/g,'');
      if(!/^\+?[1-9]\d{6,14}$/.test(number))throw Error('Enter a WhatsApp phone number with country code (7–15 digits).');
      const message=value('message');
      return 'https://wa.me/'+number.replace(/^\+/,'')+(message?'?text='+encodeURIComponent(message):'');
    }
    if(mode==='location'){
      const method=f.method||'address';let query;
      if(method==='address'){
        query=value('address');if(!query)throw Error('Enter an address or place.');
        if(query.length>500)throw Error('Shorten the location address.');
      }else if(method==='coordinates'){
        const lat=value('latitude'),lon=value('longitude');
        if(!lat||!lon||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(lat)||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(lon)||Number(lat)<-90||Number(lat)>90||Number(lon)<-180||Number(lon)>180)throw Error('Enter valid latitude (−90 to 90) and longitude (−180 to 180).');
        query=String(Number(lat))+','+String(Number(lon));
      }else throw Error('Choose a location method.');
      return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);
    }
    if(mode==='event'){
      const title=value('title');if(!title)throw Error('Enter an event name.');
      if(title.length>160)throw Error('Shorten the event name.');
      const start=dateIcs(value('start')),end=dateIcs(value('end'));
      if(end<=start)throw Error('Event end must be later than event start.');
      const location=value('location'),description=value('description');
      const seed=[title,start,end,location,description].join('|');
      // Floating DATE-TIME values have no fixed timezone; readers use their local interpretation.
      const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//QR Studio//Event QR//EN','BEGIN:VEVENT','UID:'+eventUid(seed),'DTSTAMP:'+stamp,'DTSTART:'+start,'DTEND:'+end,'SUMMARY:'+escapeIcs(title)];
      if(location)lines.push('LOCATION:'+escapeIcs(location));
      if(description)lines.push('DESCRIPTION:'+escapeIcs(description));
      return [...lines,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    }
    if(mode==='sms'){
      if(!/^[+\d() .-]{4,32}$/.test(value('phone')))throw Error('Enter a valid phone number.');
      return 'sms:'+value('phone').replace(/[() .-]/g,'')+(value('message')?'?body='+encodeURIComponent(value('message')):'');
    }
    throw Error('Unsupported QR mode.');
  }
  function contrast(a,b) {
    function luminance(h){const rgb=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
    const l1=luminance(a),l2=luminance(b);return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  }
  function createMatrix(payload,ecc='H') {
    if(!MAX_QR_BYTES[ecc])throw Error('Invalid error correction level.');
    const bytes=new TextEncoder().encode(payload);
    if(bytes.length>MAX_QR_BYTES[ecc])throw Error(`Too much information for this QR level (${bytes.length} bytes; maximum ${MAX_QR_BYTES[ecc]}). Shorten the link or reduce error correction.`);
    // Vendored Arase encoder expects single-byte characters; explicitly encode UTF-8 first.
    let binary=''; for(const b of bytes)binary+=String.fromCharCode(b);
    const core=root.QRCore || (typeof require==='function' ? require('./qr-core.js'):null);
    const qr=new core.QRCode(0,core.levels[ecc]);qr.addData(binary);qr.make();
    const count=qr.getModuleCount();
    return {size:count, data:Array.from({length:count},(_,y)=>Array.from({length:count},(_,x)=>!!qr.isDark(y,x))), bytes:bytes.length, ecc};
  }
  function byteSize(n){if(n<1024)return n+' B'; if(n<1048576)return (n/1024).toFixed(1)+' KB';return (n/1048576).toFixed(1)+' MB';}
  const api={encodePayload,validWebUrl,providerOf,expiryOfUrl,escapeWifi,escapeVcard,contrast,createMatrix,MAX_QR_BYTES,byteSize};
  root.QRStudioUtils=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
