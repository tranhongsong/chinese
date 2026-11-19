/* Service worker: lưu sẵn toàn bộ trang để dùng offline. Đổi VERSION khi cập nhật nội dung. */
const VERSION = 'hn-v5';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/lecture.js',
  'vendor/hanzi-writer.min.js', 'vendor/strokes.js',
  'audio/manifest.js', 'video/manifest.js',
  'data/pinyin.js', 'data/writing.js', 'data/radicals.js', 'data/lessons.js',
  'data/tones.js', 'data/ask.js', 'data/phrases.js', 'data/licenses.js',
  'tutor/index.html', 'tutor/persona.js', 'tutor/gemini.js', 'data/lessons.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  /* Ưu tiên mạng để luôn có bản mới, mất mạng thì dùng bản đã lưu */
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
