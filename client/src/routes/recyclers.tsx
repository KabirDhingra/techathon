import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Centre {
  id?: string
  name: string
  lat: number
  lng: number
  hours: string
  materials: string
  verified: boolean
  phone?: string
  distance?: number
}

function isOpenNow(hours: string): boolean | null {
  const text = String(hours || '')
  if (/vary|call ahead/i.test(text)) return null
  const match = text.match(/(\d{1,2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2})\s*(AM|PM)?/i)
  if (!match) return null
  let start = Number(match[1])
  let end = Number(match[3])
  const startMer = (match[2] || '').toUpperCase()
  const endMer = (match[4] || '').toUpperCase()
  if (startMer === 'PM' && start < 12) start += 12
  if (startMer === 'AM' && start === 12) start = 0
  if (endMer === 'PM' && end < 12) end += 12
  if (endMer === 'AM' && end === 12) end = 0
  if (end <= start) end += 12
  const now = new Date().getHours() + new Date().getMinutes() / 60
  return now >= start && now < end
}

export default function RecyclersPage() {
  const [centres, setCentres] = useState<Centre[]>([])
  const [source, setSource] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)

  async function load(lat?: number, lng?: number) {
    setLoading(true)
    try {
      const url = lat != null && lng != null ? `/centres?lat=${lat}&lng=${lng}` : '/centres'
      const data = (await api(url)) as { centres: Centre[]; source: string }
      setCentres(data.centres || [])
      setSource(data.source || '')
    } catch {
      /* keep empty */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function locate() {
    setLocating(true)
    if (!navigator.geolocation) {
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void load(pos.coords.latitude, pos.coords.longitude).finally(() => setLocating(false))
      },
      () => setLocating(false),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Work · Nearby centres</div>
          <h1 className="text-2xl font-bold tracking-tight">Recycling centres</h1>
          <p className="text-sm text-muted-foreground">Verified drop-off points and live recycling locations.</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
          {source === 'live' ? 'Live OpenStreetMap' : 'Verified Delhi centres'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Map panel */}
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl border bg-muted/40" style={{ aspectRatio: '4/3' }}>
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              Schematic map — {centres.length} locations listed.
            </div>
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md"
              aria-label="Use my location"
            >
              📍
            </button>
          </div>
          <Button onClick={locate} disabled={locating} className="w-full">
            {locating ? 'Locating…' : 'Find nearby centres'}
          </Button>
        </div>

        {/* Centre list */}
        <div className="space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Loading centres…</div>}
          {!loading && centres.length === 0 && (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              No locations available.
            </div>
          )}
          {centres.map((c, i) => {
            const open = isOpenNow(c.hours)
            const phone = c.phone || '155304'
            const distance = c.distance != null ? `${Number(c.distance).toFixed(1)} km away` : 'Tap locate for distance'
            return (
              <div key={i} className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      📍 {distance} · {c.hours}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      open === null
                        ? 'bg-muted text-muted-foreground'
                        : open
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {open === null ? 'Call ahead' : open ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {String(c.materials || 'General recyclables')
                    .split('·')
                    .map((tag, j) => (
                      <span key={j} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <a href={`tel:${phone}`} className="text-sm font-semibold text-primary">
                    📞 {phone}
                  </a>
                  {c.verified ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      Community
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Directions
                    </Button>
                  </a>
                  <Button size="sm" className="flex-1">
                    Log here
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
