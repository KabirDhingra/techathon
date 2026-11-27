import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import {
  idbOpen,
  idbPut,
  idbGet,
  idbGetAll,
  idbDelete,
  hydrateQueue,
  queueAction,
  getCached,
  setCached,
  getQueue,
  __resetForTests,
} from './offline'

beforeEach(() => {
  // Reset IndexedDB between tests.
  // @ts-expect-error assign polyfill
  global.indexedDB = new IDBFactory()
  // Clear localStorage queue mirror.
  localStorage.removeItem('ss_queue')
  __resetForTests()
})

describe('offline IndexedDB layer', () => {
  it('opens the surakshasetu database with the three stores', async () => {
    const db = await idbOpen()
    expect(db).not.toBeNull()
    expect(db!.objectStoreNames.contains('queue')).toBe(true)
    expect(db!.objectStoreNames.contains('cache')).toBe(true)
    expect(db!.objectStoreNames.contains('meta')).toBe(true)
  })

  it('put/get round-trips a queue item', async () => {
    const item = { id: 'Q1', path: '/sos', method: 'POST', body: { a: 1 }, at: 123 }
    expect(await idbPut('queue', item)).toBe(true)
    const got = await idbGet('queue', 'Q1')
    expect(got).toMatchObject(item)
  })

  it('getAll returns all inserted rows', async () => {
    await idbPut('queue', { id: 'A', path: '/x', method: 'POST', body: {}, at: 1 })
    await idbPut('queue', { id: 'B', path: '/y', method: 'POST', body: {}, at: 2 })
    const all = await idbGetAll('queue')
    expect(all).toHaveLength(2)
    expect(all.map((r: any) => r.id).sort()).toEqual(['A', 'B'])
  })

  it('delete removes a row', async () => {
    await idbPut('queue', { id: 'Z', path: '/z', method: 'POST', body: {}, at: 1 })
    expect(await idbDelete('queue', 'Z')).toBe(true)
    expect(await idbGet('queue', 'Z')).toBeNull()
  })

  it('queueAction persists to IndexedDB and in-memory state', async () => {
    const item = queueAction('/sos', 'POST', { description: 'test' })
    expect(item.id).toMatch(/^Q/)
    expect(getQueue()).toHaveLength(1)
    const stored = await idbGetAll('queue')
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe(item.id)
  })

  it('hydrateQueue loads from IndexedDB when present', async () => {
    await idbPut('queue', { id: 'H1', path: '/h', method: 'POST', body: {}, at: 5 })
    const count = await hydrateQueue()
    expect(count).toBe(1)
    expect(getQueue().map((q) => q.id)).toEqual(['H1'])
  })

  it('hydrateQueue mirrors localStorage queue into IDB when IDB is empty', async () => {
    localStorage.setItem('ss_queue', JSON.stringify([{ id: 'L1', path: '/l', method: 'POST', body: {}, at: 9 }]))
    const count = await hydrateQueue()
    expect(count).toBe(1)
    const stored = await idbGetAll('queue')
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('L1')
  })

  it('setCached/getCached round-trips a GET response', async () => {
    await setCached('GET anon /user/dashboard', { user: { id: 'U1' }, fromCache: false })
    const got = await getCached('GET anon /user/dashboard')
    expect(got).not.toBeNull()
    expect(got.user.id).toBe('U1')
    expect(got.fromCache).toBe(true)
    expect(typeof got.cachedAt).toBe('number')
  })

  it('getCached returns null for missing keys', async () => {
    expect(await getCached('GET anon /nope')).toBeNull()
  })
})
