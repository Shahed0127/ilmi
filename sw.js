/* ILMI service worker: works offline after the first visit. Bump CACHE when you publish new questions. */
var CACHE = 'ilmi-v2';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      if (res.ok) { caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {}); }
      return res;
    }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match('index.html'); }).then(function (m) { return m || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }); }); }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then(function (m) {
      return m || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
  }
});
