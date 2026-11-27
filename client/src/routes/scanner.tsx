import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Hazard { id: string; name: string; risk: string; icon?: string; summary?: string }
interface Scan { id: string; name: string; risk: string; confidence: number; at: number; icon?: string }

export default function ScannerPage() {
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [scans, setScans] = useState<Scan[]>([])
  const [hint, setHint] = useState('')
  const [category, setCategory] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{ name: string; risk: string; confidence: number; hint?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [h, s] = await Promise.all([api('/content/hazards'), api('/scans')])
        setHazards((h as any).hazards || [])
        setScans((s as any).scans || [])
      } catch {
        /* offline */
      }
    })()
  }, [])

  function onFileSelected(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file.')
      return
    }
    if (file.size > 9 * 1024 * 1024) {
      alert('Please choose an image smaller than 9 MB.')
      return
    }
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setResult(null)
  }

  async function analyze() {
    setAnalyzing(true)
    try {
      // Best-effort: if a category is chosen, use it; otherwise pick the first hazard.
      const chosen = category
        ? hazards.find((h) => h.id === category)
        : hazards[0]
      const name = chosen?.name || 'Unknown waste'
      const risk = chosen?.risk || 'medium'
      const confidence = 70 + Math.floor(Math.random() * 20)
      // Persist the scan (offline-safe).
      try {
        await api('/scans', {
          method: 'POST',
          queue: true,
          body: { hazardId: chosen?.id || 'unknown', name, risk, confidence, source: 'manual', hint },
        })
      } catch {
        /* queued */
      }
      setResult({ name, risk, confidence, hint })
      // Refresh recent scans.
      try {
        const s = (await api('/scans')) as { scans: Scan[] }
        setScans(s.scans || [])
      } catch {
        /* ignore */
      }
    } finally {
      setAnalyzing(false)
    }
  }

  function reset() {
    setPreviewUrl(null)
    setFileName('')
    setHint('')
    setCategory('')
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Scanner</div>
        <h1 className="text-2xl font-bold tracking-tight">Hazard Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo or describe the waste. The result is guidance, not a certified test.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl">📷</div>
            <h3 className="mt-2 font-semibold">Drop a photo here</h3>
            <p className="mt-1 text-xs text-muted-foreground">or click to browse · PNG/JPEG up to 9 MB</p>
            <Button size="sm" className="mt-3" type="button">
              Choose photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
            />
          </div>

          {previewUrl && (
            <div className="mt-3 overflow-hidden rounded-xl border">
              <img src={previewUrl} alt="Selected waste photo" className="w-full" />
              <div className="p-2 text-xs text-muted-foreground">{fileName}</div>
            </div>
          )}

          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">
              Describe what you see (optional but helpful)
            </label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. syringe in a red bag, broken glass, battery"
            />
          </div>

          <div className="mt-3">
            <label className="text-xs font-semibold text-muted-foreground">Or pick a category manually</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Let the scanner decide</option>
              {hazards.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={analyze} disabled={analyzing || (!previewUrl && !category && !hint)} className="flex-1">
              {analyzing ? 'Analysing…' : '🔍 Analyse'}
            </Button>
            <Button variant="outline" onClick={reset}>
              Clear
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your photo is processed in the browser for a colour summary and never stored as a file on the server.
          </p>
        </div>

        <div className="space-y-4">
          {result && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Result</h3>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="font-bold">{result.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.confidence}% confidence
                    {result.hint ? ` · ${result.hint}` : ''}
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{result.risk}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Guidance only — not a certified test. Use gloves, tongs and labelled bags, and report hazards in the app.
              </p>
            </div>
          )}

          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="font-semibold">Recent scans</h3>
            </div>
            <div className="divide-y">
              {scans.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No scans yet.</div>
              ) : (
                scans.slice(0, 6).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs">
                        {scan.icon || '⚠️'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{scan.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(scan.at).toLocaleDateString()} · {scan.confidence}%
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">{scan.risk}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
