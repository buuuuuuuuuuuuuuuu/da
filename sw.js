const CACHE='da-shell-2026.10.07.02';
const SHELL=['./','./index.html','./manifest.json','./version.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./favicon.png'];
const SHELL_PATHS=new Set(SHELL.map(p=>new URL(p,self.registration.scope).pathname));
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
// Network-first. Gecacht werden nur erfolgreiche Antworten der eigenen App-Shell, und zwar
// OHNE Query-String — sonst legt jeder version.json?t=… / ?_=… / Nominatim-Abruf einen
// eigenen Eintrag an und der Cache wächst unbegrenzt.
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  const isNav=req.mode==='navigate';
  const key=isNav?'./index.html':url.pathname;
  const cacheable=isNav||SHELL_PATHS.has(url.pathname);
  e.respondWith(fetch(req).then(r=>{
    if(cacheable&&r.ok&&!r.redirected){const c=r.clone(); caches.open(CACHE).then(cache=>cache.put(key,c)).catch(()=>{});}
    return r;
  }).catch(()=>caches.match(key,{ignoreSearch:true}).then(m=>m||Response.error())));
});
