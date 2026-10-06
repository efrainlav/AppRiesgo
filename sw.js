const CACHE_NAME = 'guajira-offline-v9';
const TILES_CACHE_NAME = 'guajira-tiles-v1';

const urlsToCache = [
  '/',
  '/index.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  '/js/leaflet.polylineDecorator.min.js',
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
  '/kml/Ocupaciones_Cauce_Parque.kml',
  '/shp/Vias_Medicion.geojson',
  '/shp/Via_No_Autorizada.geojson',
  '/shp/Via_Acceso_Windpeshi.geojson'
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

  // 1. Manejo de navegación / páginas HTML: ESTRATEGIA NETWORK-FIRST
  // Siempre intentar traer la última versión desde Netlify si hay conexión disponible.
  // Si no hay red (modo offline en campo de La Guajira), usar la versión almacenada en caché.
  const isHtml = event.request.mode === 'navigate' || 
                 event.request.destination === 'document' ||
                 url.endsWith('/index.html') ||
                 url === self.location.origin ||
                 url === self.location.origin + '/' ||
                 (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => cached || caches.match('/index.html') || caches.match('/'));
        })
    );
    return;
  }

  // 2. Manejo específico de mosaicos de mapa (Google Satellite / Hybrid, Esri, Bing, OSM)
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

  // 3. Manejo de recursos estáticos, librerías, KMLs, GeoJSONs, SVGs (Cache-First con respaldo de red)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});