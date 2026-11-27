import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

const MATERIALS = ['Plastic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Cardboard', 'Other']

interface Collection {
  id: string
  material: string
  kg: number
  destination?: string
  at: number
}

interface Centre { name: string }

export default function CollectPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [material, setMaterial] = useState(MATERIALS[0])
  const [kg, setKg] = useState('')
  const [destination, setDestination] = useState('')
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null)
  const [locationHint, setLocationHint] = useState('Not added')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    try {
      const [c, cen] = await Promise.all([api('/collections'), api('/centres')])
      setCollections((c as any).collections || [])
      setCentres((cen as any).centres || [])
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function getLocation() {
    if (!navigator.geolocation) {
      setLocationHint('GPS unavailable — still saved')
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
        setLocationHint('GPS unavailable — still saved')
      },
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!kg || Number(kg) <= 0) {
      setMessage('Enter a valid quantity.')
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const result = (await api('/collections', {
        method: 'POST',
        queue: true,
        body: { material, kg: Number(kg), destination: destination.trim(), gps },
      })) as { awarded?: number; message?: string }
      setMessage(`Collection logged! +${result.awarded ?? 10} points.`)
      setKg('')
      setDestination('')
      setGps(null)
      setLocationHint('Not added')
      await load()
    } catch (err: any) {
      if (err?.offline) {
        setMessage('Saved offline. Will sync when you reconnect.')
        setKg('')
        setDestination('')
        setGps(null)
        setLocationHint('Not added')
      } else {
        setMessage(err?.message || 'Could not log collection.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const today = collections.filter((c) => new Date(c.at).toDateString() === new Date().toDateString())
  const totalKg = collections.reduce((s, c) => s + (Number(c.kg) || 0), 0)
  const todayKg = today.reduce((s, c) => s + (Number(c.kg) || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Work · Collections</div>
        <h1 className="text-2xl font-bold tracking-tight">Collection Log</h1>
        <p className="text-sm text-muted-foreground">Every entry builds your work record and earns points.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Today</div>
          <div className="mt-1 text-2xl font-bold">{todayKg.toFixed(1)} kg</div>
          <div className="text-xs text-muted-foreground">{today.length} entries</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">All time</div>
          <div className="mt-1 text-2xl font-bold">{totalKg.toFixed(1)} kg</div>
          <div className="text-xs text-muted-foreground">Lifetime total</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Entries</div>
          <div className="mt-1 text-2xl font-bold">{collections.length}</div>
          <div className="text-xs text-muted-foreground">Verified records</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Points per log</div>
          <div className="mt-1 text-2xl font-bold">+10</div>
          <div className="text-xs text-muted-foreground">Added automatically</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Log a collection</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Quantity (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  max="5000"
                  step="0.1"
                  required
                  value={kg}
                  onChange={(e) => setKg(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="e.g. 6.5"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Destination / centre</label>
              <input
                list="centreList"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="e.g. Rohini Recycling Point"
              />
              <datalist id="centreList">
                {centres.map((c, i) => (
                  <option key={i} value={c.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Location</label>
              <div className="mt-1 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={getLocation}>
                  📍 Add GPS
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
              {submitting ? 'Saving…' : 'Save collection · +10 points'}
            </Button>
            <p className="text-xs text-muted-foreground">No signal? The entry is saved on your device and synced later.</p>
          </form>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="font-semibold">Recent collections</h3>
            <Link to="/history" className="text-xs font-semibold text-primary hover:underline">
              Full history →
            </Link>
          </div>
          <div className="divide-y">
            {collections.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No collections logged yet.</div>
            ) : (
              collections.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">♻</div>
                    <div>
                      <div className="text-sm font-semibold">
                        {item.material} · {item.kg} kg
                      </div>
                      <div className="text-xs text-muted-foreground">{item.destination || 'No destination'}</div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(item.at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
