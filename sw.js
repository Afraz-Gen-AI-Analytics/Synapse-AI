// A more robust service worker with different caching strategies.
// v2: Switched to more advanced caching strategies.

const STATIC_CACHE_NAME = 'synapse-ai-static-v2';
const DYNAMIC_CACHE_NAME = 'synapse-ai-dynamic-v2';

// App shell and core static assets.
// index.tsx is requested but it's a source file. The build system will produce a JS file.
// Assuming the dev server handles this, we cache the requested path.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx', 
  '/icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json',
];

// On install, cache the app shell and skip waiting
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching App Shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install successful, skipping waiting.');
        return self.skipWaiting();
      })
  );
});

// On activation, clean up old caches and claim clients
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Claiming clients.');
        return self.clients.claim();
    })
  );
});

// Centralized fetch handler with multiple strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Network only for API calls (Firebase, Google APIs)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
    // Let the browser handle these requests to ensure they are always fresh.
    return; 
  }

  // Strategy 2: Stale-While-Revalidate for CDN assets (React, Tailwind, Fonts, etc.)
  // This serves content from cache immediately for speed, then updates the cache in the background.
  if (url.hostname === 'aistudiocdn.com' || url.hostname === 'cdn.tailwindcss.com' || url.hostname.includes('gstatic.com') || url.hostname.includes('imgur.com')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            // If network fails, and we have a cached response, we've already returned it.
            // If not, this error will propagate.
            console.warn(`[SW] Network fetch failed for ${request.url}:`, err);
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Strategy 3: Cache first, then network for all other requests (app shell, local assets)
  // This is ideal for offline-first functionality.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then(networkResponse => {
          // For any successful request not in the pre-cache, add it to the dynamic cache.
          // This allows pages visited online to be available offline later.
          if (networkResponse && networkResponse.status === 200) {
            return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        });
      })
      .catch(error => {
        console.error('[SW] Fetch failed; could not serve from cache or network.', error);
        // Optional: Return a custom offline fallback page.
        // return caches.match('/offline.html');
      })
  );
});
