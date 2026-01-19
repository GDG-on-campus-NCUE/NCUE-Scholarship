// Basic Service Worker for PWA installability
const CACHE_NAME = 'ncue-scholarship-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through everything to the network
  event.respondWith(fetch(event.request));
});
