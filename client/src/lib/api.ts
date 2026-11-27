import type { ZodTypeAny } from 'zod'
import { authHeaders, getToken, clearSession } from './auth'
import {
  getCached,
  setCached,
  queueAction,
  getQueue,
  getState,
} from './db/offline'
import type { QueueItem } from './db/offline'

export interface ApiOptions {
  method?: string
  body?: unknown
  auth?: boolean
  queue?: boolean
  schema?: ZodTypeAny
}

export class ApiError extends Error {
  status?: number
  offline?: boolean
  constructor(message: string, status?: number, offline?: boolean) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.offline = offline
  }
}

function userIdForCache(): string {
  try {
    const raw = localStorage.getItem('ss_user')
    if (!raw) return 'anon'
    const parsed = JSON.parse(raw) as { id?: string }
    return parsed.id || 'anon'
  } catch {
    return 'anon'
  }
}

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {}
  if (options.auth !== false && getToken()) {
    Object.assign(headers, authHeaders())
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  const cacheKey = `GET ${userIdForCache()} ${path}`

  let response: Response
  try {
    response = await fetch('/api' + path, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    if (method === 'GET') {
      const cached = await getCached(cacheKey)
      if (cached) return cached as T
    }
    if (method !== 'GET' && options.queue) {
      queueAction(path, method, (options.body as Record<string, unknown>) || {})
    }
    throw new ApiError('You are offline. Please check your connection.', 0, true)
  }

  let data: unknown = {}
  try {
    data = await response.json()
  } catch {
    /* empty response */
  }

  const payload = (data ?? {}) as Record<string, unknown>

  if (!response.ok || payload.ok === false) {
    if (response.status === 401 && options.auth !== false) {
      clearSession()
      if (typeof location !== 'undefined' && location.hash !== '#/auth') {
        location.hash = '#/auth'
      }
    }
    throw new ApiError(
      (payload.error as string) || 'Request failed. Please try again.',
      response.status,
    )
  }

  if (options.schema) {
    const parsed = options.schema.safeParse(payload)
    if (!parsed.success) {
      // eslint-disable-next-line no-console
      console.warn('[api] schema mismatch for', path, parsed.error.flatten())
      // Fall back to raw payload rather than crashing the UI.
    } else {
      Object.assign(payload, parsed.data)
    }
  }

  if (method === 'GET') void setCached(cacheKey, payload)

  return payload as T
}

export async function syncQueue(): Promise<{ synced: number; pending: number }> {
  const token = getToken()
  if (!token || getQueue().length === 0) {
    return { synced: 0, pending: getQueue().length }
  }
  let synced = 0
  const remaining: QueueItem[] = []
  for (const item of [...getQueue()]) {
    try {
      await api(item.path, {
        method: item.method,
        body: { ...item.body, queuedAt: item.at, synced: true },
        queue: false,
      })
      synced += 1
      await (await import('./db/offline')).idbDelete('queue', item.id)
    } catch {
      remaining.push(item)
    }
  }
  // Reconcile in-memory queue with what actually remains.
  const { idbGetAll } = await import('./db/offline')
  const stored = await idbGetAll('queue')
  const s = getState()
  if (stored.length) {
    const ids = new Set(stored.map((r: QueueItem) => r.id))
    s.queue = getQueue().filter((q) => ids.has(q.id))
  } else {
    s.queue = remaining
  }
  try {
    localStorage.setItem('ss_queue', JSON.stringify(s.queue))
  } catch {
    /* ignore */
  }
  return { synced, pending: getState().queue.length }
}
