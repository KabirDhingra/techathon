import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Scheme {
  id: string
  name: string
  who: string
  amount: string
  benefit: string
  documents: string[]
  steps: string[]
  url: string
  eligible: boolean
  delhiOnly: boolean
}

export default function BenefitsPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [onlyEligible, setOnlyEligible] = useState(false)
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/content/schemes')) as { schemes: Scheme[] }
        setSchemes(data.schemes || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const eligibleCount = schemes.filter((s) => s.eligible).length
  const visible = onlyEligible ? schemes.filter((s) => s.eligible) : schemes

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Opportunities · Welfare</div>
        <h1 className="text-2xl font-bold tracking-tight">Benefits &amp; Schemes</h1>
        <p className="text-sm text-muted-foreground">Check eligibility, documents and the official application link.</p>
      </div>

      <div className="rounded-2xl border-l-4 border-primary bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">{eligibleCount} schemes look relevant to you</div>
            <div className="text-xs text-muted-foreground">Based on your work category and area. Always confirm at the official website or a CSC centre.</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOnlyEligible((v) => !v)}>
            {onlyEligible ? 'Show all schemes' : 'Show eligible only'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((s) => (
          <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    s.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {s.eligible ? 'Likely eligible' : 'Check eligibility'}
                </span>
                <h3 className="mt-2 text-base font-bold">{s.name}</h3>
                <div className="text-xs text-muted-foreground">{s.who}</div>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{s.amount}</span>
            </div>
            <p className="mt-3 text-sm">{s.benefit}</p>
            <button
              type="button"
              onClick={() => setOpenDetails((d) => ({ ...d, [s.id]: !d[s.id] }))}
              className="mt-2 text-xs font-semibold text-primary hover:underline"
            >
              {openDetails[s.id] ? 'Hide details' : 'Documents & steps →'}
            </button>
            {openDetails[s.id] && (
              <div className="mt-2 space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Documents</div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {(s.documents || []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How to apply</div>
                  <ol className="mt-1 list-decimal pl-5 text-xs text-muted-foreground">
                    {(s.steps || []).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm">Official site →</Button>
              </a>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  s.delhiOnly ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {s.delhiOnly ? 'Delhi residents' : 'Pan India'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
