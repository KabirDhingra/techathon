import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Hazard { id: string; name: string; summary: string; risk: string; icon?: string }
interface Lesson { id: string; title: string; completed?: boolean }
interface EmergencyNumbers { police: string; ambulance: string; fire: string; women?: string; cyber?: string }

export default function SafetyPage() {
  const [emergency, setEmergency] = useState<EmergencyNumbers | null>(null)
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [doneToday, setDoneToday] = useState(false)
  const [tips, setTips] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const [e, h, l, c, tp] = await Promise.all([
          api('/content/emergency'),
          api('/content/hazards'),
          api('/content/lessons'),
          api('/checklists'),
          api('/content/tips'),
        ])
        setEmergency((e as any).numbers || null)
        setHazards((h as any).hazards || [])
        setLessons((l as any).lessons || [])
        setDoneToday(Boolean((c as any).doneToday))
        setTips((tp as any).tips || [])
      } catch {
        /* offline: keep empty */
      }
    })()
  }, [])

  const doneLessons = lessons.filter((l) => l.completed).length

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety</div>
        <h1 className="text-2xl font-bold tracking-tight">Safety Centre</h1>
        <p className="text-sm text-muted-foreground">Quick reference for hazards, emergencies and daily habits.</p>
      </div>

      <div className="rounded-2xl border-l-4 border-red-500 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">🚨</div>
            <div>
              <div className="font-bold">In an emergency right now?</div>
              <div className="text-xs text-muted-foreground">Hold the SOS button for 3 seconds to alert help with your location.</div>
            </div>
          </div>
          <Link to="/sos">
            <Button variant="destructive">Open SOS</Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold">Emergency numbers</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {emergency &&
            Object.entries(emergency).map(([key, value]) => (
              <a
                key={key}
                href={`tel:${value}`}
                className="flex flex-col items-center justify-center rounded-xl border bg-card p-3 shadow-sm hover:bg-muted"
              >
                <b className="text-lg">{value}</b>
                <span className="text-xs capitalize text-muted-foreground">{key}</span>
              </a>
            ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/check">
          <div className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">✅</div>
              <div>
                <div className="font-bold">Daily checklist</div>
                <div className="text-xs text-muted-foreground">
                  {doneToday ? 'Completed today ✓' : '7 items · about 1 minute'}
                </div>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/scanner">
          <div className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">📷</div>
              <div>
                <div className="font-bold">Hazard scanner</div>
                <div className="text-xs text-muted-foreground">Identify risk from a photo</div>
              </div>
            </div>
          </div>
        </Link>
        <Link to="/training">
          <div className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">🎓</div>
              <div>
                <div className="font-bold">Training</div>
                <div className="text-xs text-muted-foreground">
                  {doneLessons} of {lessons.length} lessons complete
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="font-semibold">Common hazards</h3>
            <Link to="/guide" className="text-xs font-semibold text-primary hover:underline">
              Full guide
            </Link>
          </div>
          <div className="divide-y">
            {hazards.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">
                    {h.icon || '⚠️'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.summary}</div>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{h.risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Safety habits</h3>
          </div>
          <ul className="divide-y">
            {tips.slice(0, 6).map((tip, i) => (
              <li key={i} className="px-5 py-2 text-sm text-muted-foreground">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
