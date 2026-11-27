'use strict';

const CACHE = 'surakshasetu-v7';
const SHELL = [
  '/', '/index.html', '/styles.css?v=7', '/icon.svg', '/manifest.webmanifest',
  '/vendor/qrcode.min.js?v=7', '/js/i18n.js?v=7', '/js/core.js?v=7', '/js/firebase-phone.js?v=7', '/app.js?v=7',
  '/js/pages/auth.js?v=7', '/js/pages/home.js?v=7', '/js/pages/safety.js?v=7',
  '/js/pages/work.js?v=7', '/js/pages/identity.js?v=7', '/js/pages/opportunity.js?v=7',
  '/js/pages/system.js?v=7'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('/index.html') : Response.error())))
  );
});

/* ---------- Background sync for queued offline actions ---------- */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('surakshasetu', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGetAll(db, store) {
  return new Promise((resolve) => {
    try {
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch (_) { resolve([]); }
  });
}

function txGet(db, store, key) {
  return new Promise((resolve) => {
    try {
      const request = db.transaction(store, 'readonly').objectStore(store).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
}

function txDelete(db, store, key) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (_) { resolve(false); }
  });
}

async function flushQueue() {
  let db;
  try { db = await openDb(); } catch (_) { return; }
  const tokenRow = await txGet(db, 'meta', 'token');
  const token = tokenRow && tokenRow.value;
  if (!token) return;

  const items = await txGetAll(db, 'queue');
  for (const item of items) {
    try {
      const response = await fetch('/api' + item.path, {
        method: item.method || 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ ...(item.body || {}), queuedAt: item.at, synced: true })
      });
      if (response.ok) await txDelete(db, 'queue', item.id);
    } catch (_) { /* retry on the next sync */ }
  }

  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clients.forEach((client) => client.postMessage({ type: 'ss-queue-synced' }));
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'ss-sync-queue') event.waitUntil(flushQueue());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ss-queue-updated') event.waitUntil(flushQueue());
});
