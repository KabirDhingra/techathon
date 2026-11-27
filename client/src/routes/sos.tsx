import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Alert { id: string; at: number; synced: boolean }

export default function SosPage() {
  const { user } = useAuth()
  const [emergency, setEmergency] = useState<Record<string, string>>({})
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [holding, setHolding] = useState(false)
  const [fired, setFired] = useState(false)
  const [count, setCount] = useState(3.0)
  const [status, setStatus] = useState('Ready · location will be attached automatically')
  const [disabled, setDisabled] = useState(false)
  const [modal, setModal] = useState<{ id: string; gps: boolean; links: any } | null>(null)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [e, a] = await Promise.all([api('/content/emergency'), api('/sos')])
        setEmergency((e as any).numbers || {})
        setAlerts((a as any).alerts || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setHolding(false)
    if (!fired) {
      setCount(3.0)
      setStatus('Cancelled. Hold again when ready.')
    }
  }

  async function fire() {
    setFired(true)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setHolding(false)
    setStatus('Sending alert…')
    setDisabled(true)
    try {
      const gps = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
        )
      })
      const result = (await api('/sos', {
        method: 'POST',
        queue: true,
        body: {
          gps,
          description: `Emergency SOS from ${user?.name || 'a worker'} · ${user?.area || 'Delhi'}`,
        },
      })) as { incident: { id: string }; links?: any; progress?: unknown }
      setModal({ id: result.incident.id, gps: Boolean(gps), links: result.links || {} })
      if (result.progress) {
        try {
          localStorage.setItem('ss_progress', JSON.stringify(result.progress))
        } catch {
          /* ignore */
        }
      }
      // Refresh alerts.
      try {
        const a = (await api('/sos')) as { alerts: Alert[] }
        setAlerts(a.alerts || [])
      } catch {
        /* ignore */
      }
    } catch {
      setStatus('Alert saved offline. It will sync later.')
    } finally {
      setDisabled(false)
    }
  }

  function startHold(e: React.SyntheticEvent) {
    e.preventDefault()
    if (holding || fired || disabled) return
    setHolding(true)
    setFired(false)
    setStatus('Keep holding… release to cancel')
    const start = Date.now()
    timerRef.current = window.setInterval(() => {
      const remaining = Math.max(0, 3 - (Date.now() - start) / 1000)
      setCount(remaining)
      if (remaining <= 0) void fire()
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Emergency</div>
        <h1 className="text-2xl font-bold tracking-tight">Emergency SOS</h1>
        <p className="text-sm text-muted-foreground">Sends your location and a shareable alert to your emergency contacts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Hold to arm SOS</h2>
          <p className="mt-1 text-xs text-muted-foreground">Press and hold for 3 full seconds. Release early to cancel.</p>
          <button
            id="sosButton"
            type="button"
            disabled={disabled}
            onPointerDown={startHold}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onTouchStart={startHold}
            onTouchEnd={stop}
            className={`mt-4 flex h-40 w-40 items-center justify-center rounded-full border-4 text-2xl font-black transition ${
              holding ? 'scale-95 border-red-600 bg-red-600 text-white' : 'border-red-500 bg-red-100 text-red-600'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            HOLD
            <br />
            SOS
          </button>
          <div className="mt-3 text-2xl font-bold">{count.toFixed(1)}</div>
          <p className="mt-1 text-xs text-muted-foreground">{status}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              stop()
              setStatus('SOS cancelled. No alert was sent.')
            }}
          >
            Cancel
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <h3 className="mb-2 font-semibold">Call for help directly</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(emergency).map(([key, value]) => (
                <a
                  key={key}
                  href={`tel:${value}`}
                  className="flex flex-col items-center justify-center rounded-xl border bg-muted/40 p-3 hover:bg-muted"
                >
                  <b className="text-lg">{value}</b>
                  <span className="text-xs capitalize text-muted-foreground">{key}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="font-semibold">Recent SOS alerts</h3>
            </div>
            <div className="divide-y">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No SOS alerts. Stay safe out there.</div>
              ) : (
                alerts.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold">{item.id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.synced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.synced ? 'Synced' : 'Sent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">
              Working offline? The alert is saved on this device and sent automatically when you reconnect.
            </p>
            <Link to="/offline">
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Manage offline queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
                🚨
              </div>
              <h3 className="mt-3 text-lg font-bold">SOS alert sent</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Alert <b>{modal.id}</b> is recorded{modal.gps ? ' with your location.' : ' without location (GPS unavailable).'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {modal.links.whatsapp && (
                  <a href={modal.links.whatsapp} target="_blank" rel="noopener noreferrer">
                    <Button size="sm">Share on WhatsApp</Button>
                  </a>
                )}
                {modal.links.sms && (
                  <a href={modal.links.sms}>
                    <Button variant="outline" size="sm">Send SMS</Button>
                  </a>
                )}
                <a href={modal.links.call || 'tel:112'}>
                  <Button variant="destructive" size="sm">Call 112</Button>
                </a>
              </div>
              {modal.links.maps && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Location link: <a href={modal.links.maps} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open map</a>
                </p>
              )}
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => setModal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
