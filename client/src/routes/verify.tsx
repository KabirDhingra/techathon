import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Worker {
  wid: string
  name: string
  work: string
  area: string
  status: string
  issuedAt: number
  phoneHidden: boolean
  phone?: string
}

export default function VerifyPage() {
  const [wid, setWid] = useState('')
  const [result, setResult] = useState<Worker | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Read wid from query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('wid')
    if (q) {
      setWid(q)
      void lookup(q)
    }
  }, [])

  async function lookup(id: string) {
    if (!id.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = (await api(`/id/verify/${encodeURIComponent(id.trim())}`, { auth: false })) as Worker
      setResult(data)
    } catch (err: any) {
      setError(err?.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  const initials = result
    ? String(result.name || 'S')
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : ''

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Identity · Verification</div>
        <h1 className="text-2xl font-bold tracking-tight">Verify a Worker</h1>
        <p className="text-sm text-muted-foreground">Check a SurakshaSetu digital ID.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-2 font-semibold">Worker ID lookup</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void lookup(wid)
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Worker ID (WID)</label>
              <input
                value={wid}
                onChange={(e) => setWid(e.target.value)}
                placeholder="e.g. SS-10428"
                required
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify ID'}
            </Button>
          </form>
          <div className="mt-2 text-xs text-muted-foreground">Demo ID: <b>SS-10428</b>. Verification only shows non-sensitive details.</div>
        </div>

        <div>
          {!result && !error && !loading && (
            <div className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
              Enter a worker ID to see the result here.
            </div>
          )}
          {loading && <div className="text-sm text-muted-foreground">Verifying…</div>}
          {error && (
            <div className="rounded-2xl border-t-4 border-red-500 bg-card p-5 shadow-sm">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
          {result && (
            <div className="rounded-2xl border-t-4 border-primary bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Verified</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{result.status}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold">{initials}</div>
                <div>
                  <h3 className="text-lg font-bold">{result.name}</h3>
                  <div className="text-xs text-muted-foreground">{result.work} · {result.area}</div>
                </div>
              </div>
              <div className="mt-3 divide-y text-sm">
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Worker ID</span>
                  <b>{result.wid}</b>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Issued on</span>
                  <b>{new Date(result.issuedAt).toLocaleDateString()}</b>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Phone number</span>
                  <b>{result.phoneHidden ? 'Hidden for privacy' : result.phone || 'Hidden'}</b>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                This ID is active in the SurakshaSetu registry. Always confirm physical details too.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
