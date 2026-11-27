import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Incident {
  id: string
  type: string
  severity: string
  description: string
  at: number
  status: string
  source?: string
}

const TYPES = ['Injury', 'Hazardous waste', 'Sharp object', 'Chemical exposure', 'Unsafe area', 'Other']
const SEVERITIES = [
  { value: 'low', label: 'Low · minor issue' },
  { value: 'medium', label: 'Medium · needs attention' },
  { value: 'high', label: 'High · dangerous' },
  { value: 'critical', label: 'Critical · immediate danger' },
]

export default function IncidentPage() {
  const [type, setType] = useState('Hazardous waste')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [locationHint, setLocationHint] = useState('Not added')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/incidents')) as { incidents: Incident[] }
        setIncidents((data.incidents || []).filter((i) => i.source !== 'sos'))
      } catch {
        /* ignore */
      }
    })()
  }, [])

  async function getLocation() {
    if (!navigator.geolocation) {
      setLocationHint('Location unavailable')
      return
    }
    setLocationHint('Locating…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationHint(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`)
      },
      () => {
        setGps(null)
        setLocationHint('Location unavailable — you can still report')
      },
    )
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const reader = new FileReader()
      reader.onload = () => setPhoto(String(reader.result || ''))
      reader.readAsDataURL(file)
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 5) {
      setMessage('Description must be at least 5 characters.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const result = (await api('/incidents', {
        method: 'POST',
        queue: true,
        body: { type, severity, description: description.trim(), photo, gps },
      })) as { progress?: unknown; awarded?: number; message?: string }
      if (result.progress) {
        try {
          localStorage.setItem('ss_progress', JSON.stringify(result.progress))
        } catch {
          /* ignore */
        }
      }
      setMessage(`Report submitted. Thank you! +${result.awarded ?? 15} points.`)
      setDescription('')
      setPhoto('')
      setGps(null)
      setLocationHint('Not added')
      // Refresh list.
      try {
        const data = (await api('/incidents')) as { incidents: Incident[] }
        setIncidents((data.incidents || []).filter((i) => i.source !== 'sos'))
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      if (err?.offline) {
        setMessage('Saved offline. Will sync when you reconnect.')
      } else {
        setMessage(err?.message || 'Could not submit report.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Report</div>
        <h1 className="text-2xl font-bold tracking-tight">Report an Incident</h1>
        <p className="text-sm text-muted-foreground">Your report helps protect other workers in your area.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            If someone is in immediate danger, use SOS and call 112 or 108 first.
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">What happened?</label>
              <textarea
                required
                minLength={5}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                rows={4}
                placeholder="Describe the hazard and where you found it…"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPhoto}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Location</label>
              <div className="mt-1 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={getLocation}>
                  📍 Use my current location
                </Button>
                <span className="text-xs text-muted-foreground">{locationHint}</span>
              </div>
            </div>
            {message && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting…' : 'Submit report · +15 points'}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Your reports</h3>
          </div>
          <div className="divide-y">
            {incidents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No reports yet.</div>
            ) : (
              incidents.slice(0, 10).map((item) => (
                <div key={item.id} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{item.type}</div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{item.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{new Date(item.at).toLocaleString()}</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{item.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
