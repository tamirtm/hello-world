// Offline support. Network-first so a deploy is picked up on the next online
// visit; the cache is only the fallback when there is no connection.
const CACHE = 'glide-v1';
const SHELL = [
  './', 'index.html', 'style.css', 'icon.svg', 'manifest.webmanifest',
  'src/ui.js', 'src/engine.js', 'src/solver.js', 'src/generator.js',
  'src/levels.js', 'src/rng.js', 'src/storage.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit ?? Response.error())),
  );
});
