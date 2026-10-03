const CACHE_NAME = 'guajira-offline-v7';
const TILES_CACHE_NAME = 'guajira-tiles-v1';

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
  '/svg/hut.svg',
  '/kml/Torres.kml',
  '/kml/Aeros_Parque.kml',
  '/kml/Area_Parque.kml',
  '/kml/Comunidades_2026.kmz',
  '/kml/Ocupacion_Cauce_Linea.kml',
  '/kml/Ocupaciones_Cauce_Parque.kml'
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
          if (cache !== CACHE_NAME && cache !== TILES_CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET. Las peticiones POST a Supabase o Storage se procesan en la red
  if (event.request.method !== 'GET') return;

  // No interceptar peticiones de la API REST o Storage de Supabase
  if (event.request.url.includes('supabase.co')) return;

  const url = event.request.url;

  // 1. Manejo específico de mosaicos de mapa (Google Satellite / Hybrid, Esri, Bing)
  const isMapTile = url.includes('google.com/vt') || 
                    url.includes('virtualearth.net/tiles') || 
                    url.includes('arcgisonline.com') ||
                    url.includes('tile.openstreetmap.org');

  if (isMapTile) {
    event.respondWith(
      caches.open(TILES_CACHE_NAME).then(tileCache => {
        return tileCache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              tileCache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cached || new Response('', { status: 408, statusText: 'Offline tile' }));
        });
      })
    );
    return;
  }

  // 2. Manejo de recursos estáticos, HTML, CSS, JS y KMLs
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        // Cachear dinámicamente si es un KML, SVG o archivo estático
        if (networkResponse && networkResponse.status === 200 && (url.includes('/kml/') || url.includes('/svg/') || url.endsWith('.html') || url.endsWith('.js') || url.endsWith('.css'))) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return networkResponse;
      });
    }).catch(() => caches.match('/index.html'))
  );
});