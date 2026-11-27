// IndexedDB persistence: queue, GET cache, and token mirror.
// Database name, version, store names and key paths are kept identical to the
// vanilla app (public/js/core.js) so saved data survives the migration.

export interface QueueItem {
  id: string
  path: string
  method: string
  body: Record<string, unknown>
  at: number
}

export interface OfflineState {
  queue: QueueItem[]
  online: boolean
}

const DB_NAME = 'surakshasetu'
const DB_VERSION = 1
const STORES = ['queue', 'cache', 'meta'] as const
type StoreName = (typeof STORES)[number]

const state: OfflineState = {
  queue: [],
  online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
}

let dbPromise: Promise<IDBDatabase | null> | null = null

export function idbOpen(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
  return dbPromise
}

export async function idbPut(store: StoreName, value: unknown): Promise<boolean> {
  const db = await idbOpen()
  if (!db) return false
  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
      tx.onabort = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

export async function idbDelete(store: StoreName, key: IDBValidKey): Promise<boolean> {
  const db = await idbOpen()
  if (!db) return false
  return new Promise<boolean>((resolve) => {
    try {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).delete(key)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

export async function idbGet(store: StoreName, key: IDBValidKey): Promise<any | null> {
  const db = await idbOpen()
  if (!db) return null
  return new Promise<any | null>((resolve) => {
    try {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function idbGetAll(store: StoreName): Promise<any[]> {
  const db = await idbOpen()
  if (!db) return []
  return new Promise<any[]>((resolve) => {
    try {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).getAll()
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
}

export async function hydrateQueue(): Promise<number> {
  const stored = await idbGetAll('queue')
  if (stored.length) {
    state.queue = (stored as QueueItem[]).sort((a, b) => a.at - b.at)
  } else {
    if (state.queue.length === 0) {
      try {
        const raw = localStorage.getItem('ss_queue')
        if (raw) state.queue = JSON.parse(raw) as QueueItem[]
      } catch {
        state.queue = []
      }
    }
    for (const item of state.queue) await idbPut('queue', item)
  }
  try {
    localStorage.setItem('ss_queue', JSON.stringify(state.queue))
  } catch {
    /* ignore */
  }
  return state.queue.length
}

export function getQueue(): QueueItem[] {
  return state.queue
}

export function getState(): OfflineState {
  return state
}

export function queueAction(path: string, method: string, body: Record<string, unknown> = {}): QueueItem {
  const item: QueueItem = {
    id: 'Q' + Date.now() + Math.floor(Math.random() * 1000),
    path,
    method,
    body: body || {},
    at: Date.now(),
  }
  state.queue.push(item)
  try {
    localStorage.setItem('ss_queue', JSON.stringify(state.queue))
  } catch {
    /* ignore */
  }
  void idbPut('queue', item)
  registerBackgroundSync()
  return item
}

export async function getCached(key: string): Promise<any | null> {
  const row = await idbGet('cache', key)
  if (row && row.data) {
    row.data.cachedAt = row.at
    row.data.fromCache = true
    return row.data
  }
  return null
}

export async function setCached(key: string, data: unknown): Promise<void> {
  await idbPut('cache', { key, at: Date.now(), data })
}

export function registerBackgroundSync(): void {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return
  navigator.serviceWorker.ready
    .then((registration) => {
      const reg = registration as { sync?: { register?: (tag: string) => Promise<unknown> } }
      if (reg.sync && typeof reg.sync.register === 'function') {
        return reg.sync!.register!('ss-sync-queue')
      }
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ss-queue-updated' })
      }
      return null
    })
    .catch(() => {
      /* background sync is optional */
    })
}

// Re-hydrate from localStorage on module load (best-effort mirror).
try {
  const raw = localStorage.getItem('ss_queue')
  if (raw) state.queue = JSON.parse(raw) as QueueItem[]
} catch {
  state.queue = []
}

// Test-only reset hook.
export function __resetForTests(): void {
  dbPromise = null
  state.queue = []
}
