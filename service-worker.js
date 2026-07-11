// ════════════════════════════════════════════════════════════
// SERVICE WORKER — cache do "casco" do app (HTML/CSS/JS/ícones)
// Os dados (Firestore) NÃO são cacheados aqui — precisam de internet.
// ════════════════════════════════════════════════════════════

const CACHE_NAME = 'escala-porteiros-v6';

const ARQUIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/firebase-config.js',
  './js/utils.js',
  './js/store.js',
  './js/auth.js',
  './js/notificacoes.js',
  './js/router.js',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/detalheCulto.js',
  './js/screens/escalaAdmin.js',
  './js/screens/minhaEscala.js',
  './js/screens/calendario.js',
  './js/screens/adminPorteiros.js',
  './js/screens/adminPosicoes.js',
  './assets/brasao-ccb.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cacheia chamadas ao Firestore/Firebase — sempre busca da rede
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebaseapp.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
