import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface HistoryItem {
  id: string
  kind: string
  title: string
  detail: string
  at: number
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/history')) as { items: HistoryItem[] }
        setItems(data.items || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const filtered = filter === 'all' ? items : items.filter((i) => i.kind === filter)

  function exportCsv() {
    const rows = [['Date', 'Type', 'Title', 'Details']].concat(
      items.map((item) => [new Date(item.at).toISOString(), item.kind, item.title, item.detail]),
    )
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'surakshasetu-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Work · History</div>
        <h1 className="text-2xl font-bold tracking-tight">Work History</h1>
        <p className="text-sm text-muted-foreground">A complete record of your activity.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {['all', 'collection', 'incident', 'sos', 'scan'].map((kind) => (
            <Button
              key={kind}
              size="sm"
              variant={filter === kind ? 'default' : 'outline'}
              onClick={() => setFilter(kind)}
            >
              {kind === 'all' ? 'All' : kind.charAt(0).toUpperCase() + kind.slice(1)}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="divide-y">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No activity recorded yet.</div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.detail}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{item.kind}</span>
                  <span className="text-xs text-muted-foreground">{new Date(item.at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
