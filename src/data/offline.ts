export function serviceWorkerSource(files: string[], version: string) {
  const assets=[...new Set(['./','./index.html',...files.map(f=>'./'+f)])]
  return `const CACHE=${JSON.stringify('little-daily-'+version)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('little-daily-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreVary:true}))||cache.match('./index.html'))));return;
  }
  const allowed=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
  if(!allowed.has(url.href))return;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request,{ignoreVary:true}))||fetch(request)));
});`
}

