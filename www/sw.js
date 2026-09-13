/* Service worker: la app entera queda cacheada y funciona sin internet.
   Al cambiar los archivos, subí el número de CACHE para forzar la actualización. */
const CACHE = 'monedas-v2';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './fonts/fredoka-latin.woff2',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Cache primero, red como respaldo. La app no pide nada a servidores externos.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok && new URL(req.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
