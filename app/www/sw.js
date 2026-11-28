/* Rel Nusantara: penyimpanan offline. Berkas game disimpan di ponsel saat pertama dibuka, sehingga game tetap bisa dimainkan tanpa internet.
   Saat online, versi terbaru selalu diambil lebih dulu (jaringan dulu, cadangan dari simpanan), jadi pembaruan tetap masuk. */
const CACHE = 'rel-nusantara-v6';
const CORE = ['./', 'index.html', 'game.js', 'style.css', 'i18n.js', 'splash.js', 'viewport.js', 'manifest.webmanifest', 'privacy.html',
  'icon-180.png', 'pembuka.jpg', 'menu-kabin.jpg', 'menu-kartu-harian.jpg', 'menu-kartu-1-1.jpg', 'menu-kartu-1-2.jpg', 'menu-kartu-1-3.jpg', 'menu-kartu-1-4.jpg', 'menu-kartu-1-5.jpg', 'menu-kartu-1-6.jpg', 'menu-kartu-1-7.jpg', 'menu-kartu-2-1.jpg', 'menu-kartu-2-2.jpg', 'menu-kartu-2-3.jpg', 'menu-kartu-3-1.jpg', 'menu-kartu-3-2.jpg', 'menu-kartu-3-3.jpg', 'menu-kartu-3-4.jpg', 'menu-kartu-4-1.jpg', 'icon-192.png', 'icon-512.png', 'fonts/fonts.css', 'fonts/PlusJakartaSans-latin.woff2', 'fonts/PlusJakartaSans-latin-ext.woff2',
  'fonts/BigShouldersDisplay-latin.woff2', 'fonts/BigShouldersDisplay-latin-ext.woff2', 'fonts/Cinzel-latin.woff2', 'fonts/Cinzel-latin-ext.woff2'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin || req.headers.has('range')) return; // video (permintaan potongan) langsung ke jaringan / simpanan browser
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try { // jaringan dulu (maks 4 detik), simpan salinan terbaru
      const net = await Promise.race([fetch(req), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
      if (net && net.ok) cache.put(req, net.clone());
      return net;
    } catch (err) { // offline / lambat: pakai simpanan
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
      if (hit) return hit; throw err;
    }
  })());
});
