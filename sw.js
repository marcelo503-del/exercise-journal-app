// sw.js — simple PWA service worker

const VERSION = 'v4';
const STATIC_CACHE = `static-${VERSION}`;

// Keep paths **relative** so it works at /Marcelo-Villatoro/ on GitHub Pages
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  // Add icons here if you add them later:
  // './icon-192.png',
  // './icon-512.png',
];

// Install: cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: remove old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== STATIC_CACHE ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch:
// - HTML: network‑first (fallback to cache/offline)
// - Other assets: cache‑first (fallback to network)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';

  // Treat navigations/HTML as network‑first
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('./index.html'))
        )
    );
    return;
  }

  // Other requests (CSS/JS/images): cache‑first
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
