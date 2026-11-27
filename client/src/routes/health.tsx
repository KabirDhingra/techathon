import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

interface Camp {
  id: string
  name: string
  type: string
  location: string
  schedule: string
  distance: string
  registered: boolean
}

export default function HealthPage() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [ambulance, setAmbulance] = useState('108')

  useEffect(() => {
    void (async () => {
      try {
        const [c, e] = await Promise.all([api('/content/camps'), api('/content/emergency')])
        setCamps((c as any).camps || [])
        setAmbulance((e as any)?.numbers?.ambulance || '108')
      } catch {
        /* ignore */
      }
    })()
  }, [])

  async function toggleCamp(camp: Camp) {
    try {
      await api(`/camps/${encodeURIComponent(camp.id)}/register`, {
        method: camp.registered ? 'DELETE' : 'POST',
      })
      setCamps((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, registered: !c.registered } : c)),
      )
    } catch (err: any) {
      alert(err?.message || 'Could not update registration.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Opportunities · Health</div>
        <h1 className="text-2xl font-bold tracking-tight">Health &amp; Wellness</h1>
        <p className="text-sm text-muted-foreground">Register for a camp or call for urgent medical help.</p>
      </div>

      <div className="rounded-2xl border-l-4 border-red-500 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Medical emergency?</div>
            <div className="text-xs text-muted-foreground">Call 108 for an ambulance, or use SOS to share your location.</div>
          </div>
          <div className="flex gap-2">
            <a href={`tel:${ambulance}`}>
              <Button variant="destructive">Call 108</Button>
            </a>
            <Link to="/sos">
              <Button variant="outline">Open SOS</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {camps.map((camp) => (
          <div key={camp.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">❤️</div>
              {camp.registered ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Registered ✓</span>
              ) : (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{camp.type}</span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold">{camp.name}</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <b>{camp.location}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <b>{camp.schedule}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <b>{camp.distance}</b>
              </div>
            </div>
            <Button
              size="sm"
              className="mt-3 w-full"
              variant={camp.registered ? 'outline' : 'default'}
              onClick={() => void toggleCamp(camp)}
            >
              {camp.registered ? 'Cancel registration' : 'Register for free'}
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Before you go</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Bring your digital ID or Aadhaar if you have it.</li>
            <li>Carry your previous prescriptions and glasses.</li>
            <li>Ask for a printed report and keep it for future visits.</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Heat and hydration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Drink water every 30 minutes in summer. If you feel dizzy, sit in shade, loosen clothing, sip ORS and call 108 if you do not improve.
          </p>
          <Link to="/ai">
            <Button size="sm" variant="outline" className="mt-2">
              Ask AI Saathi for more tips
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
