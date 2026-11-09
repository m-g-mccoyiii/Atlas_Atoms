// Offline support: pre-cache the game, then answer from the network when possible
// (so updates arrive) and from the cache when offline.
const CACHE = 'atlas-atoms-__BUILD__';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'icon.svg', 'css/style.css',
  'packages/core/vendor/three.min.js',
  'packages/core/js/data.js', 'packages/core/js/chem.js', 'js/lessons.js', 'js/quizzes.js', 'packages/core/js/model.js',
  'packages/core/js/render3d.js', 'packages/core/js/realdata.js', 'js/real.js', 'js/progress.js', 'js/profiles.js', 'js/profileui.js', 'packages/core/js/molinfo.js', 'packages/core/js/orbitals.js', 'packages/core/js/reactionsim.js', 'js/lab.js', 'js/game.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
  );
});
