// Service Worker für "da"
// Cache-Name enthält die Version — bei jedem Update wird der alte Cache verworfen.
const VERSION = '2026.07.04.6';
const CACHE = 'da-cache-' + VERSION;

// Assets, die sich selten ändern und offline verfügbar sein sollen.
const ASSETS = [
  './apple-touch-icon.png',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isCore = url.pathname.endsWith('/') ||
                 url.pathname.endsWith('index.html') ||
                 url.pathname.endsWith('version.json');

  if (isCore) {
    // Network-First: neue Version immer bevorzugen, Cache nur als Offline-Fallback.
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Cache-First für statische Assets (Icons etc.).
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
