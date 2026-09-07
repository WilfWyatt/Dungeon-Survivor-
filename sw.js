const CACHE='dungeon-survivor-v0.2.5i';
const PRECACHE=[
 './','./index.html','./style.css','./game.js','./manifest.json','./icon-192.png','./icon-512.png','./splash-screen.png','./menu-screen.png','./assets/sprites/player.png','./assets/sprites/bat.png','./assets/sprites/goblin.png','./assets/sprites/skeleton.png','./assets/sprites/boss_mage.png',
 './assets/floor/floor_tiles.png','./floor_tiles.png','./floor-tiles-atlas.png',
 './floor-clean-1.png','./floor-clean-2.png','./floor-clean-3.png','./floor-clean-4.png','./floor-debris-1.png','./floor-debris-2.png','./floor-debris-3.png','./floor-debris-4.png','./floor-moss-1.png','./floor-moss-2.png','./floor-moss-3.png','./floor-moss-4.png',
 './assets/props/torch-1.png','./assets/props/torch-2.png','./assets/props/torch-3.png','./assets/props/torch-4.png','./assets/props/chest-closed.png','./assets/props/chest-open.png','./assets/props/crate-1.png','./assets/props/crate-stack.png','./assets/props/barrel.png','./assets/props/pottery.png','./assets/props/ruined-pillar.png','./assets/props/rubble.png','./assets/props/statue.png',
 './walls/top/top-wall-clean-1.png','./assets/walls/top/top-wall-clean-1.png','./walls/top/top-wall-clean-2.png','./assets/walls/top/top-wall-clean-2.png','./walls/top/top-wall-clean-3.png','./assets/walls/top/top-wall-clean-3.png','./walls/top/top-wall-cracked-1.png','./assets/walls/top/top-wall-cracked-1.png','./walls/top/top-wall-cracked-2.png','./assets/walls/top/top-wall-cracked-2.png','./walls/top/top-wall-cracked-3.png','./assets/walls/top/top-wall-cracked-3.png','./walls/top/top-wall-mossy-1.png','./assets/walls/top/top-wall-mossy-1.png','./walls/top/top-wall-mossy-2.png','./assets/walls/top/top-wall-mossy-2.png','./walls/top/top-wall-mossy-3.png','./assets/walls/top/top-wall-mossy-3.png',
 './walls/left/left-wall-clean.png','./assets/walls/left/left-wall-clean.png','./walls/right/right-wall-clean.png','./assets/walls/right/right-wall-clean.png','./walls/bottom/bottom-wall-clean.png','./assets/walls/bottom/bottom-wall-clean.png',
 './top-wall-clean.png','./top-wall-cracked.png','./top-wall-mossy.png','./left-wall-clean.png','./right-wall-clean.png','./bottom-wall-clean.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(PRECACHE.map(u=>cache.add(u)));}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
