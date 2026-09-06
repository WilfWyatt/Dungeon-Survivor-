const CACHE='dungeon-survivor-v0.2.5b';
const PRECACHE=['./','./index.html','./style.css','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./splash-screen.png','./menu-screen.png','./player-sprites.png','./enemy-sprites.png','./great-hall-modular-atlas.png','./great-hall-props.png','./floor-clean-1.png','./floor-clean-2.png','./floor-clean-3.png','./floor-clean-4.png','./floor-debris-1.png','./floor-debris-2.png','./floor-debris-3.png','./floor-debris-4.png','./floor-moss-1.png','./floor-moss-2.png','./floor-moss-3.png','./floor-moss-4.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
