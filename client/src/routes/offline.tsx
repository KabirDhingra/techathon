import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getQueue, getState, hydrateQueue, idbDelete } from '@/lib/db/offline'
import { syncQueue } from '@/lib/api'

interface QueueItem {
  id: string
  path: string
  method: string
  at: number
}

export default function OfflinePage() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [syncing, setSyncing] = useState(false)

  async function refresh() {
    await hydrateQueue()
    setQueue([...getQueue()].reverse())
  }

  useEffect(() => {
    void refresh()
    const onOnline = () => {
      setOnline(true)
      void refresh()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      await syncQueue()
      await refresh()
    } finally {
      setSyncing(false)
    }
  }

  async function handleDrop(id: string) {
    const s = getState()
    s.queue = s.queue.filter((item) => item.id !== id)
    try {
      localStorage.setItem('ss_queue', JSON.stringify(s.queue))
    } catch {
      /* ignore */
    }
    await idbDelete('queue', id)
    await refresh()
  }

  const pending = queue.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          Account · Offline
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Offline &amp; Sync</h1>
        <p className="text-sm text-muted-foreground">
          SurakshaSetu keeps your important actions safe until you reconnect.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status card */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {online ? '⟳' : '⊘'}
              </span>
              <div>
                <div className="font-semibold">
                  {online ? 'You are online' : 'You are offline'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Connection status updates automatically
                </div>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {online ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending actions</span>
              <span className="font-bold">{pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">App shell</span>
              <span className="font-bold">Cached for offline use</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Saathi</span>
              <span className="font-bold">Works offline</span>
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            disabled={!online || pending === 0 || syncing}
            onClick={handleSync}
          >
            {syncing ? 'Syncing…' : `Sync ${pending} pending action${pending === 1 ? '' : 's'}`}
          </Button>
        </div>

        {/* Queued actions card */}
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Queued actions</h3>
          </div>
          <div className="p-2">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <div className="text-3xl">⟳</div>
                <p className="mt-2 text-sm">Nothing waiting to sync.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {queue.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {item.method} {item.path}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDrop(item.id)}
                    >
                      ✕
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold">What works offline</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['AI Saathi', 'Rules-based answers in Hindi, English and Hinglish.'],
            ['Hazard guidance', 'Known hazard advice is available instantly.'],
            ['SOS alerts', 'Saved on this device and sent when you reconnect.'],
            ['Collection logs', 'Queued with their original time and location.'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="font-semibold text-sm">{title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
