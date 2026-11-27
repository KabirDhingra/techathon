import 'fake-indexeddb/auto'

// Minimal localStorage polyfill for the node test environment.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)) },
    removeItem: (k: string) => { store.delete(k) },
    clear: () => { store.clear() },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
  } as Storage
}
if (typeof globalThis.navigator === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.navigator = { onLine: true, serviceWorker: undefined }
}
if (typeof globalThis.location === 'undefined') {
  // @ts-expect-error polyfill
  globalThis.location = { hash: '', href: 'http://localhost/' }
}
