const CACHE='dungeon-survivor-v0.2.5';
const PRECACHE=['./','./index.html','./style.css','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./splash-screen.png','./menu-screen.png','./player-sprites.png','./enemy-sprites.png','./great-hall-modular-atlas.png','./great-hall-props.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
