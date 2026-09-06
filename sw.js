const CACHE = 'dungeon-survivor-v0.2.5g';

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './splash-screen.png',
  './menu-screen.png',
  './player-sprites.png',
  './enemy-sprites.png',

  // Authored 32x32 floor tiles.
  './floor-clean-1.png', './floor-clean-2.png', './floor-clean-3.png', './floor-clean-4.png',
  './floor-debris-1.png', './floor-debris-2.png', './floor-debris-3.png', './floor-debris-4.png',
  './floor-moss-1.png', './floor-moss-2.png', './floor-moss-3.png', './floor-moss-4.png',

  // Authored environmental props.
  './assets/props/torch-1.png', './assets/props/torch-2.png',
  './assets/props/torch-3.png', './assets/props/torch-4.png',
  './assets/props/chest-closed.png', './assets/props/chest-open.png',
  './assets/props/crate-1.png', './assets/props/crate-stack.png',
  './assets/props/barrel.png', './assets/props/pottery.png',
  './assets/props/ruined-pillar.png', './assets/props/rubble.png', './assets/props/statue.png',

  // Authored room architecture.
  './walls/top/top-wall-clean-1.png', './walls/top/top-wall-clean-2.png', './walls/top/top-wall-clean-3.png',
  './walls/top/top-wall-cracked-1.png', './walls/top/top-wall-cracked-2.png', './walls/top/top-wall-cracked-3.png',
  './walls/top/top-wall-mossy-1.png', './walls/top/top-wall-mossy-2.png', './walls/top/top-wall-mossy-3.png',
  './walls/left/left-wall-clean.png', './walls/right/right-wall-clean.png', './walls/bottom/bottom-wall-clean.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(PRECACHE.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE)
          .then(cache => cache.put(event.request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
