/* Offline navigation shell only. Never store auth, API responses, admin HTML or payments. */
const CACHE = 'dark-poke-admin-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add('/admin-offline.html')));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('dark-poke-admin-shell-') && k !== CACHE).map(k => caches.delete(k))))]));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || url.origin !== self.location.origin || !/^\/(admin|pos)(\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match('/admin-offline.html')) || new Response('Mất kết nối. Vui lòng kết nối mạng rồi tải lại.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })));
});
