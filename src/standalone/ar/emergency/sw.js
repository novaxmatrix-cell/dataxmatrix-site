// Offline cache for جدول إيرس للطوارئ (/ar/emergency/). Cache-first; the build stamps VERSION with a hash of this
// folder, so any change ships a new sw.js: the browser installs it on the next online visit, which caches the new files and
// deletes the old cache. Scope: this folder only.
const VERSION = '__EMERGENCY_VERSION__';
const CACHE = `iris-emergency-${VERSION}`;
const FILES = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('iris-emergency-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './' : req; // the page, with or without index.html or a query string
  e.respondWith(caches.open(CACHE).then((c) => c.match(key, { ignoreSearch: true })).then((hit) => hit || fetch(req)));
});
