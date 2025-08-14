/**
 * BlockZone Lab PWA Service Worker
 * Following Web3 gaming industry best practices (Axie Infinity, Gods Unchained)
 * Optimized for gaming performance and Web3 functionality
 * Fixed: Browser-safe cache handling with proper error recovery
 */

const CACHE_NAME = 'blockzone-lab-v1.0.0';
const GAME_CACHE = 'blockzone-games-v1.0.0';
const API_CACHE = 'blockzone-api-v1.0.0';

// Critical files for instant loading (like top Web3 games)
// Only include files that actually exist to prevent cache failures
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Game assets for offline play - only essential files
const GAME_FILES = [
  '/games/',
  '/games/index.html'
];

// Web3/API endpoints that can be cached
const CACHEABLE_APIS = [
  '/api/scores',
  '/api/leaderboard',
  '/api/tournaments'
];

/**
 * Safe cache addition with error handling
 */
async function safeCacheAdd(cache, url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(url, response);
      // console.log(`[SW] Cached: ${url}`);
      return true;
    } else {
      console.warn(`[SW] Failed to fetch for cache: ${url} (${response.status})`);
      return false;
    }
  } catch (error) {
    console.warn(`[SW] Error caching ${url}:`, error);
    return false;
  }
}

/**
 * Safe cache addition for multiple files
 */
async function safeCacheAddAll(cache, urls) {
  const results = await Promise.allSettled(
    urls.map(url => safeCacheAdd(cache, url))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - successful;
  
  // console.log(`[SW] Cache results: ${successful} successful, ${failed} failed`);
  return { successful, failed };
}

// Install event - preload critical assets with safe handling
self.addEventListener('install', event => {
  // console.log('[SW] Installing BlockZone Lab PWA...');
  
  event.waitUntil(
    Promise.all([
      // Cache core platform files with error handling
      caches.open(CACHE_NAME).then(async cache => {
        // console.log('[SW] Caching core files...');
        const result = await safeCacheAddAll(cache, CORE_FILES);
        // console.log(`[SW] Core cache complete: ${result.successful}/${CORE_FILES.length} files`);
        return result;
      }),
      
      // Cache game files with error handling
      caches.open(GAME_CACHE).then(async cache => {
        // console.log('[SW] Caching game files...');
        const result = await safeCacheAddAll(cache, GAME_FILES);
        // console.log(`[SW] Game cache complete: ${result.successful}/${GAME_FILES.length} files`);
        return result;
      })
    ]).then(results => {
      // console.log('[SW] BlockZone Lab PWA installation complete');
      // console.log('[SW] Cache results:', results);
      self.skipWaiting(); // Activate immediately
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
      // Don't fail completely - allow partial installation
      self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  // console.log('[SW] Activating BlockZone Lab PWA...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old versions
          if (cacheName !== CACHE_NAME && 
              cacheName !== GAME_CACHE && 
              cacheName !== API_CACHE) {
            // console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // console.log('[SW] BlockZone Lab PWA activated');
      self.clients.claim(); // Take control immediately
    }).catch(error => {
      console.error('[SW] Activation failed:', error);
      // Don't fail completely
      self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy for Web3 games with robust error handling
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests that we can't cache
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Skip Web3 wallet requests (must be online)
  if (isWeb3Request(url)) {
    return; // Let it go to network
  }
  
  // Game assets - cache first (for performance)
  if (isGameAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, GAME_CACHE));
    return;
  }
  
  // API requests - network first with cache fallback
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // Core platform - cache first with network fallback
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

// Cache-first strategy (for games and static assets) with robust error handling
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Update cache in background (stale-while-revalidate)
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before caching (response can only be consumed once)
      const responseClone = response.clone();
      try {
        await cache.put(request, responseClone);
      } catch (cacheError) {
        console.warn('[SW] Cache put failed:', cacheError);
        // Continue without caching
      }
    }
    
    return response;
    
  } catch (error) {
    console.warn('[SW] Cache-first strategy failed:', error);
    
    // Try to return offline fallback
    return createOfflineFallback(request.url);
  }
}

// Network-first strategy (for API calls) with robust error handling
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      try {
        // Clone response before caching
        const responseClone = response.clone();
        await cache.put(request, responseClone);
      } catch (cacheError) {
        console.warn('[SW] API cache put failed:', cacheError);
        // Continue without caching
      }
    }
    
    return response;
    
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    
    // Network failed, try cache
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
    } catch (cacheError) {
      console.warn('[SW] Cache lookup failed:', cacheError);
    }
    
    // Both network and cache failed
    return createAPIFallback(request.url);
  }
}

// Update cache in background without blocking the response
function updateCacheInBackground(request, cache) {
  // Don't await this - let it run in background
  fetch(request)
    .then(response => {
      if (response.ok) {
        return cache.put(request, response.clone());
      }
    })
    .catch(error => {
      console.warn('[SW] Background cache update failed:', error);
    });
}

// Create offline fallback response
function createOfflineFallback(url) {
  if (url.endsWith('.html') || url.endsWith('/')) {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offline - BlockZone Lab</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ffff; 
            text-align: center; 
            padding: 50px 20px;
            margin: 0;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: #1a1a1a;
            padding: 30px;
            border-radius: 10px;
            border: 2px solid #00ffff;
          }
          h1 { color: #ff0040; margin-bottom: 20px; }
          p { margin: 15px 0; line-height: 1.6; }
          button {
            background: #00ffff;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 20px;
          }
          button:hover { background: #00cccc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎮 You're Offline</h1>
          <p>BlockZone Lab games are temporarily unavailable.</p>
          <p>Check your internet connection and try again.</p>
          <button onclick="window.location.reload()">🔄 Retry</button>
        </div>
      </body>
      </html>
    `, {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Offline - Resource unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Create API fallback response
function createAPIFallback(url) {
  return new Response(JSON.stringify({
    error: 'Offline',
    message: 'API temporarily unavailable',
    offline: true,
    timestamp: Date.now()
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions with improved detection
function isWeb3Request(url) {
  const path = url.pathname.toLowerCase();
  const host = url.hostname.toLowerCase();
  
  return path.includes('wallet') || 
         path.includes('metamask') ||
         path.includes('walletconnect') ||
         host.includes('infura') ||
         host.includes('alchemy') ||
         host.includes('ethereum') ||
         host.includes('sonic');
}

function isGameAsset(url) {
  const path = url.pathname.toLowerCase();
  
  return path.includes('/games/') ||
         path.endsWith('.js') ||
         path.endsWith('.css') ||
         path.endsWith('.svg') ||
         path.endsWith('.png') ||
         path.endsWith('.jpg') ||
         path.endsWith('.webp') ||
         path.endsWith('.mp3') ||
         path.endsWith('.wav');
}

function isAPIRequest(url) {
  const path = url.pathname.toLowerCase();
  
  return path.includes('/api/') ||
         path.includes('/shared/api/') ||
         path.includes('/tournaments/') ||
         CACHEABLE_APIS.some(api => path.startsWith(api));
}

// Background sync for tournament scores (like Axie Infinity)
self.addEventListener('sync', event => {
  if (event.tag === 'tournament-score-sync') {
    event.waitUntil(syncTournamentScores());
  }
});

async function syncTournamentScores() {
  // console.log('[SW] Syncing tournament scores...');
  
  try {
    // Get pending scores from IndexedDB or localStorage
    const pendingScores = await getPendingScores();
    
    for (const score of pendingScores) {
      try {        const response = await fetch('https://api.blockzonelab.com/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(score)
        });
        
        if (response.ok) {
          await removePendingScore(score.id);
          // console.log('[SW] Score synced:', score.id);
        }
      } catch (error) {
        console.warn('[SW] Score sync failed:', score.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Tournament score sync failed:', error);
  }
}

// Mock functions for score sync (would integrate with your tournament system)
async function getPendingScores() {
  // Implementation would read from IndexedDB or localStorage
  return [];
}

async function removePendingScore(scoreId) {
  // Implementation would remove from IndexedDB or localStorage
}

// Push notifications for tournaments
self.addEventListener('push', event => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      event.waitUntil(
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/badge-72.png',
          tag: data.tag || 'tournament',
          data: data.url || '/',
          actions: [
            {
              action: 'play',
              title: '🎮 Play Now'
            },
            {
              action: 'dismiss',
              title: '✖️ Dismiss'
            }
          ]
        })
      );
    } catch (error) {
      console.error('[SW] Push notification failed:', error);
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'play') {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/games/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  // Analytics or cleanup if needed
  // console.log('[SW] Notification closed:', event.notification.tag);
});

// Message handling for communication with the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_VERSION':
        event.ports[0].postMessage({
          version: CACHE_NAME,
          caches: [CACHE_NAME, GAME_CACHE, API_CACHE]
        });
        break;
        
      case 'CLEAR_CACHE':
        event.waitUntil(clearAllCaches());
        break;
        
      default:
        // console.log('[SW] Unknown message type:', event.data.type);
    }
  }
});

// Clear all caches (for debugging)
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    // console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Cache clearing failed:', error);
  }
}

// console.log('[SW] BlockZone Lab Service Worker loaded successfully');
