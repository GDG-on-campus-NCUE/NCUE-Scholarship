const CACHE_NAME = 'ncue-scholarship-v3';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/logo.png',
  '/banner.jpg',
  '/manifest.webmanifest',
  '/offline',
];

// 安裝時預先快取靜態資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. 對於同源的導覽請求 (HTML)，使用 Network-First 策略
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((response) => {
          return response || caches.match('/offline');
        });
      })
    );
    return;
  }

  // 2. 對於靜態資源 (JS, CSS, Images)，使用 Stale-While-Revalidate
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. 其他請求直接走網路
  event.respondWith(fetch(request));
});