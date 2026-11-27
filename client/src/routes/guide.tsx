import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

interface Hazard { id: string; name: string; summary: string; action?: string; risk: string; icon?: string; keywords?: string[] }

export default function GuidePage() {
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [tips, setTips] = useState<string[]>([])
  const [term, setTerm] = useState('')
  const [level, setLevel] = useState('')
  const [selected, setSelected] = useState<Hazard | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [h, t] = await Promise.all([api('/content/hazards'), api('/content/tips')])
        setHazards((h as any).hazards || [])
        setTips((t as any).tips || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const filtered = hazards.filter((h) => {
    const text = (h.name + ' ' + (h.keywords || []).join(' ')).toLowerCase()
    const matchesTerm = !term || text.includes(term.toLowerCase())
    const matchesLevel = !level || h.risk === level
    return matchesTerm && matchesLevel
  })

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Guide</div>
        <h1 className="text-2xl font-bold tracking-tight">Waste Guide</h1>
        <p className="text-sm text-muted-foreground">A simple reference for the materials you handle every day.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="w-64 rounded-lg border px-3 py-2 text-sm"
          placeholder="Search glass, battery, syringe…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-44 rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All risk levels</option>
          <option value="high">High risk</option>
          <option value="medium">Medium risk</option>
          <option value="low">Low risk</option>
        </select>
        <Link to="/scanner">
          <Button>🔍 Scan instead</Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => setSelected(h)}
            className="rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">{h.icon || '⚠️'}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{h.risk}</span>
            </div>
            <div className="mt-2 font-semibold text-sm">{h.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">{h.summary}</p>
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold">Everyday safety habits</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm">{tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <span>{selected.icon || '⚠️'}</span> {selected.name}
              </h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{selected.risk}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{selected.summary}</p>
            <div className="mt-3 rounded-xl bg-muted/40 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Safe handling</div>
              <p className="mt-1 text-sm">{selected.action}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setSelected(null)} className="flex-1">
                Understood
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setSelected(null); window.location.href = '/scanner' }}>
                Scan a photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
