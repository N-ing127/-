// 自毀 Service Worker v2
// 目的：替換舊 VitePWA SW → 清快取 → 解除自己 → 強制重載
// 在自毀完成前，所有 fetch 直接放行到網路（不攔截不快取）

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      })
      .then(function() {
        return self.registration.unregister();
      })
      .then(function() {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function(clients) {
        clients.forEach(function(c) { c.navigate(c.url); });
      })
  );
});

// 存活期間不攔截任何請求
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
