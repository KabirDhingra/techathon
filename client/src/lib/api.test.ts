import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { api, ApiError } from './api'
import { setCached } from './db/offline'
import { saveSession, getToken } from './auth'
import { z } from 'zod'

beforeEach(() => {
  // @ts-expect-error assign polyfill
  global.indexedDB = new IDBFactory()
  localStorage.clear()
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api wrapper', () => {
  it('returns parsed JSON on a successful GET', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, value: 42 }),
    }))
    const data = await api<{ value: number }>('/things')
    expect(data.value).toBe(42)
  })

  it('throws ApiError with status on a 4xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: 'Bad input' }),
    }))
    await expect(api('/things')).rejects.toMatchObject({ message: 'Bad input', status: 400 })
  })

  it('clears the session on a 401', async () => {
    saveSession({ token: 'tok-123', user: { id: 'U1', name: 'X', email: '', phone: '', work: '', area: '', emergencyContact: '', wid: 'W', role: 'worker', verified: true, lang: 'en', photo: '', issuedAt: null, createdAt: 0, idCreated: true, privacy: {}, phoneVerified: false } as any, profileComplete: true })
    expect(getToken()).toBe('tok-123')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, error: 'Unauthorized' }),
    }))
    await expect(api('/protected')).rejects.toBeInstanceOf(ApiError)
    expect(getToken()).toBe('')
  })

  it('validates responses with a Zod schema', async () => {
    const Schema = z.object({ count: z.number() })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 7, extra: 'ignored' }),
    }))
    const data = await api<{ count: number }>('/count', { schema: Schema })
    expect(data.count).toBe(7)
  })

  it('falls back to the IndexedDB cache when offline on GET', async () => {
    await setCached('GET anon /cached', { value: 'from-cache', fromCache: false })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const data = await api<{ value: string; fromCache?: boolean }>('/cached')
    expect(data.value).toBe('from-cache')
    expect(data.fromCache).toBe(true)
  })

  it('queues a POST action when offline and queue option is set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(
      api('/sos', { method: 'POST', queue: true, body: { description: 'help' } }),
    ).rejects.toMatchObject({ offline: true })
    const { getQueue } = await import('./db/offline')
    expect(getQueue()).toHaveLength(1)
    expect(getQueue()[0].path).toBe('/sos')
  })

  it('throws an offline error when no cache is available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api('/missing')).rejects.toMatchObject({ offline: true })
  })
})
