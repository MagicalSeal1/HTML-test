const CACHE_NAME = 'karsu-app-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/common.css',
  './assets/css/index.css',
  './assets/css/studycards.css',
  './assets/js/router.js',
  './assets/js/login.js',
  './assets/js/views/home.js',
  './assets/js/views/studycards.js',
  './assets/js/views/profile.js',
  './assets/icons/logo.png',
  './assets/icons/favicon-32.png',
  './assets/icons/favicon-16.png',
  './assets/icons/android-192.png',
  './assets/icons/android-512.png'
];

// Kurulum: Dosyaları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Önbellek açıldı');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// İstekleri Yakala: Önce Cache'e bak, yoksa Network'e git
self.addEventListener('fetch', (event) => {
  // Firebase ve API isteklerini cache'leme (Network First)
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('firebase')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache'de varsa döndür
        if (response) {
          return response;
        }
        // Yoksa internetten çek
        return fetch(event.request);
      })
  );
});

// Aktivasyon: Eski cache'leri temizle
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});