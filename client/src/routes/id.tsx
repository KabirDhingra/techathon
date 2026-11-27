import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

interface IdData {
  wid: string
  name: string
  work: string
  area: string
  photo: string
  emergencyContact: string
  issuedAt: number
  privacy: { sharePhone: boolean }
}

export default function IdPage() {
  const [data, setData] = useState<IdData | null>(null)
  const [error, setError] = useState('')
  const [qrSvg, setQrSvg] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const d = (await api('/user/id')) as IdData
        setData(d)
        const verifyUrl = `${window.location.origin}/#/verify?wid=${encodeURIComponent(d.wid)}`
        // Generate QR using the global qrcode lib if available.
        const qrcode = (window as any).qrcode
        if (typeof qrcode === 'function') {
          try {
            const qr = qrcode(0, 'M')
            qr.addData(verifyUrl)
            qr.make()
            setQrSvg(qr.createSvgTag(4, 2))
          } catch {
            setQrSvg('')
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Complete your profile to create your ID.')
      }
    })()
  }, [])

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Identity</div>
          <h1 className="text-2xl font-bold tracking-tight">My Digital ID</h1>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/onboard" className="mt-3 inline-block">
            <Button>Complete my profile</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-sm text-muted-foreground">Loading digital ID…</div>
  }

  const initials = String(data.name || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  const verifyUrl = `${window.location.origin}/#/verify?wid=${encodeURIComponent(data.wid)}`

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Identity · Card</div>
        <h1 className="text-2xl font-bold tracking-tight">My Digital ID</h1>
        <p className="text-sm text-muted-foreground">Show this card to employers, MCD staff or verifiers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-emerald-600 p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-bold">
                {data.photo ? <img src={data.photo} alt="Profile" className="h-full w-full object-cover" /> : initials}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">SurakshaSetu · Verified Worker</div>
                <h2 className="mt-1 text-2xl font-bold">{data.name}</h2>
                <div className="text-sm text-emerald-100">{data.work} · {data.area}</div>
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">Worker ID</div>
                <div className="text-2xl font-black tracking-wide">{data.wid}</div>
                <div className="mt-1 text-xs text-emerald-100">Issued {new Date(data.issuedAt).toLocaleDateString()}</div>
              </div>
              <div className="rounded-xl bg-white p-2" dangerouslySetInnerHTML={{ __html: qrSvg || '<div class="text-xs text-muted-foreground">QR unavailable</div>' }} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => window.print()}>🖨 Print / save as PDF</Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`My SurakshaSetu verified worker ID: ${data.wid} — verify at ${verifyUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">📱 Share on WhatsApp</Button>
            </a>
            <Link to="/profile">
              <Button variant="outline">Edit details</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h3 className="font-semibold">Card details</h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Active</span>
            </div>
            <div className="divide-y">
              {[
                ['Worker ID', data.wid],
                ['Full name', data.name],
                ['Work category', data.work],
                ['Area', data.area],
                ['Emergency contact', data.emergencyContact || 'Not added'],
                ['Issued on', new Date(data.issuedAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-2 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-l-4 border-primary bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="text-sm font-bold">Your privacy is protected</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your mobile number and full address are never shown on the public verification page.{' '}
                  {data.privacy?.sharePhone ? 'You currently allow phone sharing — turn it off in Privacy.' : 'Phone sharing is turned off.'}
                </p>
                <Link to="/privacy" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  Privacy settings
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">How verification works</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Anyone with your QR code or worker ID can confirm that your card is active. They only see your name, work category, area and issue date.
            </p>
            <Link to="/verify" className="mt-2 inline-block">
              <Button size="sm" variant="outline">Try the verifier</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
