// da – Service Worker
// Bewusst minimal gehalten: Die App nutzt einen eigenen
// Cache-Buster-Reload (?_=timestamp) und einen periodischen
// version.json-Check, um Nutzer aktiv auf Updates hinzuweisen.
// Ein aggressiv cachender Service Worker würde dem widersprechen
// (Nutzer könnte trotz "Update"-Banner eine alte Fassung offline
// aus dem SW-Cache bekommen). Daher: reines Passthrough, nur zur
// Erfüllung der PWA-Installierbarkeits-Kriterien (Safari/iOS
// verlangt einen registrierten Service Worker für "Zum Home-
// Bildschirm hinzufügen" in manchen Konstellationen).

const CACHE = 'da-shell-v1';
const SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: immer zuerst frisch vom Netz holen (passend zum
// Cache-Buster-Konzept der App). Cache dient nur als Offline-Fallback.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
