import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

interface Tip { text: string; at: number }

export default function CommunityPage() {
  const [tips, setTips] = useState<string[]>([])
  const [myTips, setMyTips] = useState<Tip[]>([])
  const [stats, setStats] = useState({ workers: 0, collectedKg: 0, hazardsFound: 0, incidents: 0 })
  const [text, setText] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/community')) as { tips: string[]; stats: any }
        setTips(data.tips || [])
        setStats(data.stats || stats)
      } catch {
        /* ignore */
      }
      try {
        const raw = localStorage.getItem('ss_my_tips')
        if (raw) setMyTips(JSON.parse(raw))
      } catch {
        /* ignore */
      }
    })()
  }, [])

  function submitTip(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const next = [{ text: t, at: Date.now() }, ...myTips].slice(0, 20)
    setMyTips(next)
    try {
      localStorage.setItem('ss_my_tips', JSON.stringify(next))
    } catch {
      /* ignore */
    }
    setText('')
    alert('Tip submitted for review. Thank you!')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Opportunities · Community</div>
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-sm text-muted-foreground">Learn from other workers and see what we achieve together.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Active workers</div>
          <div className="mt-1 text-2xl font-bold">{stats.workers}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Material recovered</div>
          <div className="mt-1 text-2xl font-bold">{stats.collectedKg} <span className="text-sm text-muted-foreground">kg</span></div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Hazards flagged</div>
          <div className="mt-1 text-2xl font-bold">{stats.hazardsFound}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Incidents reported</div>
          <div className="mt-1 text-2xl font-bold">{stats.incidents}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Safety tips from the community</h3>
          </div>
          <div className="divide-y">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{i + 1}</span>
                <span className="text-sm">{tip}</span>
              </div>
            ))}
            {myTips.length > 0 && (
              <>
                <div className="px-4 pt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Your submitted tips</div>
                {myTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">Pending review</span>
                    <span className="text-sm">{tip.text}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Share a tip</h3>
            <p className="mt-1 text-xs text-muted-foreground">Tips are reviewed before they appear for everyone. Be practical and respectful.</p>
            <form onSubmit={submitTip} className="mt-3 space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={300}
                required
                placeholder="e.g. Keep a wet cloth over your nose while sorting dry paper…"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={4}
              />
              <Button type="submit" className="w-full">Submit tip for review</Button>
            </form>
          </div>

          <div className="rounded-2xl border-l-4 border-primary bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Together we are safer</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Every hazard report removes a danger for the next worker. Every collection logged helps the city plan better routes and centres.
            </p>
            <Link to="/incident">
              <Button size="sm" className="mt-2">Report a hazard</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
