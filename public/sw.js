/* Bitaqa — cache coque légère (dashboard + assets statiques). */
const CACHE = 'bitaqa-shell-v2';
const PRECACHE = ['/icons/icon.svg', '/manifest.webmanifest'];
const DASHBOARD_PATH = /^\/(fr|ar)\/dashboard(\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((path) => cache.add(path))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

function store(request, response) {
  if (response.ok && !response.redirected && response.type === 'basic') {
    const copy = response.clone();
    void caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

/* Build files are content-hashed, so a cached copy is always the right one. */
function cacheFirst(request) {
  return caches
    .match(request)
    .then((cached) => cached || fetch(request).then((response) => store(request, response)));
}

/* Pages must stay fresh after a deploy; the cache only helps when the network is gone. */
function networkFirst(request) {
  return fetch(request)
    .then((response) => store(request, response))
    .catch(() => caches.match(request).then((cached) => cached || Response.error()));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Public profiles, API routes and the client space always go straight to the network.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === 'navigate' && DASHBOARD_PATH.test(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
