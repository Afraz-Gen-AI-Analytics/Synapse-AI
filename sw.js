const CACHE_NAME = 'synapse-ai-cache-v2';
// Add core app shell files to the cache.
// CDN assets will be cached on first request via the fetch handler.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx', // The module entry point
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json',
  'https://cdn.tailwindcss.com' // Common dependency
];

// Install the service worker and cache the app shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and pre-caching app shell.');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

// Clean up old caches on activation.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients.
  );
});

// Intercept fetch requests.
self.addEventListener('fetch', event => {
  const { request } = event;

  // Do not cache non-GET requests or Google API calls.
  if (request.method !== 'GET' || request.url.includes('googleapis.com')) {
    // Let the browser handle it.
    return;
  }
  
  // Stale-While-Revalidate strategy for app assets and CDN resources (fonts, scripts).
  // This provides an "offline-first" experience by serving from cache immediately.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        // Fetch from the network in the background to update the cache.
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
          console.warn(`Network request for ${request.url} failed:`, err);
          // The request failed, but we might have served a cached response.
          // If not, the user will see a browser error, which is expected offline.
        });

        // Return the cached response if available, otherwise wait for the network.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
