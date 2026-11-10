// Mamy to? — prosty cache, żeby apka otwierała się też bez zasięgu (np. w sklepie)
const C = 'mamyto-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase/Firestore — nigdy nie cache'ujemy
  if (u.hostname.includes('googleapis.com') && !u.hostname.includes('fonts')) return;
  const cacheable = u.origin === location.origin || u.hostname === 'cdn.jsdelivr.net' || u.hostname.includes('fonts.g');
  if (!cacheable) return;
  e.respondWith(
    caches.open(C).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })
  );
});
