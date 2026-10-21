const CACHE='qrstudio-static-v1.0.0';
const ASSETS=['/','/index.html','/favicon.svg','/assets/css/styles.css','/assets/js/qr-core.js','/assets/js/utils.js','/assets/js/exports.js','/assets/js/app.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;event.respondWith(fetch(r).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(r,copy));}return response;}).catch(()=>caches.match(r).then(c=>c||caches.match('/index.html'))));});
