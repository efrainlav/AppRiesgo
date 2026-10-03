const CACHE_NAME = 'guajira-offline-v6';
const urlsToCache = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  '/svg/transmission-tower.svg',
  '/svg/eolica.svg',
  '/svg/hut.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => console.warn('Cache addAll warning:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET. Las peticiones POST a Supabase o Storage se procesan en la red
  if (event.request.method !== 'GET') return;

  // No interceptar peticiones de la API REST o Storage de Supabase en cache estático
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
      .catch(() => caches.match('/index.html'))
  );
});