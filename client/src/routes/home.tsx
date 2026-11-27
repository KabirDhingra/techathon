import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

interface Dashboard {
  user: { name: string; area: string; role: string }
  stats: { todayKg: number; incidents: number; points: number }
  progress: { points: number; level: number; intoLevel: number; progress: number; needed: number; achievements: { earned: boolean }[] }
  recent?: { collections: { material: string; kg: number; destination?: string; at: number }[] }
}

const QUICK_TILES = [
  { id: 'scanner', icon: '📷', label: 'Scan Waste', sub: 'Photo hazard check', tone: 'bg-emerald-100 text-emerald-700' },
  { id: 'sos', icon: '🚨', label: 'SOS Alert', sub: 'Emergency help', tone: 'bg-red-100 text-red-700' },
  { id: 'incident', icon: '⚠️', label: 'Report Hazard', sub: 'Alert your zone', tone: 'bg-amber-100 text-amber-700' },
  { id: 'id', icon: '🪪', label: 'My ID', sub: 'Verified QR card', tone: 'bg-blue-100 text-blue-700' },
  { id: 'offline', icon: '📡', label: 'Offline', sub: 'Saved & syncs later', tone: 'bg-teal-100 text-teal-700' },
  { id: 'benefits', icon: '🎁', label: 'Schemes', sub: 'Check eligibility', tone: 'bg-violet-100 text-violet-700' },
]

const EXPLORE_GROUPS = [
  { title: 'Safety', icon: '🛡', items: [['AI Saathi', 'ai'], ['Safety Centre', 'safety'], ['Hazard Scanner', 'scanner'], ['Daily Checklist', 'check'], ['Training', 'training'], ['Waste Guide', 'guide'], ['Report Incident', 'incident'], ['SOS Emergency', 'sos']] },
  { title: 'Work & Rewards', icon: '🏆', items: [['Collections', 'collect'], ['Nearby Centres', 'recyclers'], ['Work History', 'history'], ['Points & Levels', 'progress']] },
  { title: 'Identity', icon: '🪪', items: [['My Digital ID', 'id'], ['Verify a Worker', 'verify']] },
  { title: 'Opportunities', icon: '🎁', items: [['Benefits & Schemes', 'benefits'], ['Health Camps', 'health'], ['Community', 'community']] },
  { title: 'Account', icon: '👤', items: [['Profile & Phone', 'profile'], ['Privacy', 'privacy'], ['Offline & Sync', 'offline'], ['Help & FAQ', 'help']] },
]

export default function HomePage() {
  const { user } = useAuth()
  const [data, setData] = useState<Dashboard | null>(null)
  const [tip, setTip] = useState('Never touch unknown waste with bare hands.')

  useEffect(() => {
    void (async () => {
      try {
        const d = (await api('/user/dashboard')) as Dashboard
        setData(d)
      } catch {
        /* offline: keep empty */
      }
      try {
        const tips = (await api('/content/tips')) as { tips?: string[] }
        const list = tips.tips || []
        if (list.length) setTip(list[Math.floor(Date.now() / 86400000) % list.length])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const stats = data?.stats || { todayKg: 0, incidents: 0, points: 0 }
  const progress = data?.progress || { points: 0, level: 1, intoLevel: 0, progress: 0, needed: 500, achievements: [] }
  const recent = data?.recent?.collections || []
  const isAdmin = user?.role === 'admin'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = String(user?.name || 'worker').split(/\s+/)[0]
  const langLabel = user?.lang ? user.lang.toUpperCase() : 'EN'

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-lg">
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-200">
          SurakshaSetu · {user?.area || 'Delhi'}
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight">
          {greeting}, {firstName} — safer city, safer you.
        </h1>
        <p className="mt-2 text-sm text-emerald-100">
          A safer bridge to a cleaner city. Your safety, verified ID and opportunities in one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/scanner">
            <Button variant="secondary" size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50">
              📷 Scan waste
            </Button>
          </Link>
          <Link to="/sos">
            <Button variant="ghost" size="sm" className="border border-white/30 text-white hover:bg-white/10">
              🚨 SOS Alert
            </Button>
          </Link>
          <Link to="/id">
            <Button variant="ghost" size="sm" className="border border-white/30 text-white hover:bg-white/10">
              🪪 My ID
            </Button>
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
          <div>
            <div className="text-lg font-bold">{stats.todayKg} kg</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-200">Today</div>
          </div>
          <div>
            <div className="text-lg font-bold">{stats.incidents}</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-200">Hazard reports</div>
          </div>
          <div>
            <div className="text-lg font-bold">{progress.points || stats.points || 0}</div>
            <div className="text-[10px] uppercase tracking-widest text-emerald-200">Safety points</div>
          </div>
        </div>
      </div>

      {/* AI CTA */}
      <Link to="/ai">
        <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">🤖</div>
          <div className="flex-1">
            <div className="font-bold">Ask Suraksha AI</div>
            <div className="text-xs text-muted-foreground">Photo, hazard, PPE, schemes · {langLabel}</div>
          </div>
          <div className="text-xl">🎤</div>
        </div>
      </Link>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-base font-bold">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_TILES.map((tile) => (
            <Link key={tile.id} to={`/${tile.id === 'benefits' ? 'benefits' : tile.id}`}>
              <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition hover:shadow-md">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${tile.tone}`}>
                  {tile.icon}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{tile.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{tile.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent collections + progress */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h3 className="font-semibold">Recent collections</h3>
            <Link to="/history" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="p-2">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No collections yet. Log your first one.</div>
            ) : (
              <ul className="divide-y">
                {recent.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">📦</div>
                      <div>
                        <div className="text-sm font-semibold">
                          {item.material} · {item.kg} kg
                        </div>
                        <div className="text-xs text-muted-foreground">{item.destination || 'Collection logged'}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(item.at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Your progress</h3>
              <Link to="/progress" className="text-xs font-semibold text-primary hover:underline">
                Details
              </Link>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs">
                <b>Level {progress.level}</b>
                <span className="text-muted-foreground">{progress.intoLevel} / 500 points</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${progress.progress || 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Earn {progress.needed || 500} more points to reach the next level.{' '}
                {(progress.achievements || []).filter((a) => a.earned).length} of{' '}
                {(progress.achievements || []).length} achievements unlocked.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-l-4 border-amber-400 bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">🛡</div>
              <div>
                <div className="text-sm font-bold">Safety tip of the day</div>
                <p className="mt-1 text-xs text-muted-foreground">{tip}</p>
                <Link to="/guide" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  Read the full guide →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explore all features */}
      <div>
        <h2 className="mb-3 text-base font-bold">Explore all features</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE_GROUPS.concat(isAdmin ? [{ title: 'Administration', icon: '🏛', items: [['MCD Command Centre', 'municipal']] }] : []).map((g) => (
            <div key={g.title} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <span>{g.icon}</span> {g.title}
              </div>
              <div className="space-y-1.5">
                {g.items.map(([label, path]) => (
                  <Link key={path} to={`/${path}`}>
                    <div className="rounded-lg px-2 py-1 text-sm hover:bg-muted">{label}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
