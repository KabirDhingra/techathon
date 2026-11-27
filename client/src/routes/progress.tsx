import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'

interface ProgressData {
  points: number
  level: number
  needed: number
  intoLevel: number
  progress: number
  achievements: { id: string; label: string; icon: string; earned: boolean }[]
  history: { at: number; reason: string; amount: number }[]
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const d = (await api('/progress')) as ProgressData
        setData(d)
      } catch {
        /* ignore */
      }
    })()
  }, [])

  if (!data) {
    return <div className="text-sm text-muted-foreground">Loading progress…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Work · Rewards</div>
        <h1 className="text-2xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-sm text-muted-foreground">Small safe actions add up to real recognition.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 p-5 text-white shadow-sm">
          <div className="text-xs uppercase tracking-widest text-emerald-200">Total points</div>
          <div className="mt-1 text-4xl font-black">{data.points}</div>
          <p className="mt-2 text-sm text-emerald-100">
            Level {data.level} · {data.needed} points to next level
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${data.progress}%` }} />
          </div>
          <div className="mt-1 text-xs text-emerald-200">{data.intoLevel} / 500 points in this level</div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Achievements</h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              {data.achievements.filter((a) => a.earned).length} unlocked
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{ opacity: a.earned ? 1 : 0.45 }}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    a.earned ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {a.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.earned ? 'Unlocked ✓' : 'Keep going'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold">How points work</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['+50', 'Create digital ID'],
            ['+25', 'Complete a lesson'],
            ['+20', 'Daily safety check'],
            ['+15', 'Report a hazard'],
          ].map(([pts, label]) => (
            <div key={label} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <b className="text-xl text-primary">{pts}</b>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold">Point history</h2>
        <div className="rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">When</th>
                <th className="px-4 py-2 text-left font-semibold">Reason</th>
                <th className="px-4 py-2 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    No points yet.
                  </td>
                </tr>
              ) : (
                data.history.map((h, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(h.at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{h.reason}</td>
                    <td className="px-4 py-2 text-right font-bold text-primary">+{h.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-2">
        <Link to="/id">
          <Button size="sm">View digital ID</Button>
        </Link>
      </div>
    </div>
  )
}
