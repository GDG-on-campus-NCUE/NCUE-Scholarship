// Scripts for firebase syntax
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDB-E0TfwF0DlRAs08w8y00Y1nXVGYDBm4",
  authDomain: "scholarship-7e13c.firebaseapp.com",
  projectId: "scholarship-7e13c",
  storageBucket: "scholarship-7e13c.firebasestorage.app",
  messagingSenderId: "639605064231",
  appId: "1:639605064231:web:37a66395f29539e3fd4402",
  measurementId: "G-TEET6EMDVJ"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 處理背景訊息
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || '彰師校外獎助學金平台';
  const notificationOptions = {
    body: payload.notification?.body || '您有新的獎助學金資訊',
    icon: '/logo.png',
    badge: '/favicon.ico',
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- PWA Offline Support (Original sw.js content) ---
const CACHE_NAME = 'ncue-scholarship-v4';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/logo.png',
  '/banner.jpg',
  '/manifest.webmanifest',
  OFFLINE_URL,
  '/fonts/NotoSansTC-Regular.ttf',
  '/fonts/NotoSansTC-Bold.ttf',
];

// 安裝時預先快取靜態資源
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 強制跳過等待，立即進入啟動狀態
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline page and assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 激活時清理舊快取並取得控制權
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 清理舊快取
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
      // 立即取得所有頁面的控制權
      clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 忽略非 GET 請求與外部 API
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 1. 導覽請求 (HTML)：Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch((err) => {
          console.log('[SW] Navigation fetch failed, serving offline page:', err);
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 2. 靜態資源：Stale-While-Revalidate
  const isStaticAsset = 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/fonts/');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. 其他所有請求 (含內部 API)：Network-Only 但處理 Catch
  event.respondWith(
    fetch(request).catch((err) => {
      console.warn('[SW] Fetch failed for:', request.url, err);
      if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'offline', message: '您目前處於離線狀態' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return caches.match(OFFLINE_URL);
    })
  );
});

// 注意：FCM 的 onBackgroundMessage 已經處理了 push 事件，
// 除非您有非 FCM 的推播需求，否則不需要額外的 self.addEventListener('push')

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // 取得目標 URL (這應該已經是絕對路徑)
  let urlToOpen = event.notification.data.url || '/';
  
  // 確保 urlToOpen 是完整的 URL
  if (!urlToOpen.startsWith('http')) {
    urlToOpen = new URL(urlToOpen, self.location.origin).href;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. 檢查是否已經有開啟該 URL 的視窗，如果有就聚焦它
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 2. 如果沒有，嘗試尋找任何同 Origin 的視窗，並將其導向該 URL
      for (let client of windowClients) {
        if ('navigate' in client && client.url.startsWith(self.location.origin)) {
          client.navigate(urlToOpen);
          if ('focus' in client) return client.focus();
          return;
        }
      }

      // 3. 如果都找不到，開啟新視窗
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
