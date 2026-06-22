// リフティングメーター Service Worker
// v2: ネットワーク優先方式に変更（更新が確実に反映されるように）
const CACHE_NAME = 'lifting-meter-v2';
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// インストール時：必要なファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// index.htmlから「今すぐ切り替えて」と言われたら即座に有効化
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 有効化時：古いバージョンのキャッシュを全て削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// リクエスト時：ネットワーク優先。取得できたら常に最新を使い、キャッシュも更新する。
// オフライン時のみキャッシュから返す。
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
