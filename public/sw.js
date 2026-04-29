// 純自殺 SW v3 — 不觸發 navigate，避免造成 reload 迴圈
// 任何瀏覽器若仍快取著舊版 sw.js，這個版本會在 activate 階段
// 解除自身註冊並清空所有 caches，但**不主動 reload client**。
// 用戶下一次自然 reload 即會載入無 SW 的乾淨版本。

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.registration.unregister(); })
      .catch(function () {})
  );
});

// 不攔截任何 fetch（讓瀏覽器走原生 network stack）
