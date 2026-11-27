import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Metric {
  workers: number
  incidents: number
  sosAlerts: number
  kgRecovered: number
  scans: number
  checklists: number
  lessons: number
}
interface DayCount { label: string; count: number }
interface HazardMix { label: string; count: number }
interface MaterialTotal { material: string; kg: number }
interface Zone { zone: string; level: string; count: number }
interface RecentIncident { id: string; type: string; severity: string; worker: string; status: string }
interface DirectoryWorker { name: string; wid: string; work: string; area: string; points: number }

export default function MunicipalPage() {
  const [metrics, setMetrics] = useState<Metric | null>(null)
  const [weekly, setWeekly] = useState<DayCount[]>([])
  const [hazardMix, setHazardMix] = useState<HazardMix[]>([])
  const [materialTotals, setMaterialTotals] = useState<MaterialTotal[]>([])
  const [zoneRisk, setZoneRisk] = useState<Zone[]>([])
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([])
  const [directory, setDirectory] = useState<DirectoryWorker[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/admin/overview')) as any
        setMetrics(data.metrics || {})
        setWeekly(data.weeklyIncidents || [])
        setHazardMix(data.hazardMix || [])
        setMaterialTotals(data.materialTotals || [])
        setZoneRisk(data.zoneRisk || [])
        setRecentIncidents(data.recentIncidents || [])
        setDirectory(data.directory || [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const maxWeek = Math.max(1, ...weekly.map((d) => d.count))
  const maxHazard = Math.max(1, ...hazardMix.map((h) => h.count))
  const maxMaterial = Math.max(1, ...materialTotals.map((m) => m.kg))

  const statList: [keyof Metric, string][] = [
    ['workers', 'Registered workers'],
    ['incidents', 'Total incidents'],
    ['sosAlerts', 'SOS alerts'],
    ['kgRecovered', 'Material recovered (kg)'],
    ['scans', 'Hazard scans'],
    ['checklists', 'Safety checks'],
    ['lessons', 'Lessons completed'],
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Admin · Municipal</div>
        <h1 className="text-2xl font-bold tracking-tight">MCD Command Centre</h1>
        <p className="text-sm text-muted-foreground">Operational picture across worker safety, recovery and incidents.</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {statList.map(([key, label]) => (
            <div key={key} className="rounded-2xl border bg-card p-3 shadow-sm">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-bold">{metrics[key] ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Incidents this week</h3>
          <div className="flex items-end justify-between gap-1" style={{ height: 120 }}>
            {weekly.map((day, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <b className="text-xs">{day.count}</b>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${(day.count / maxWeek) * 100}%`, minHeight: 2 }}
                />
                <span className="text-[10px] text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Hazard mix</h3>
          {hazardMix.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hazard data yet.</div>
          ) : (
            <div className="space-y-2">
              {hazardMix.map((h, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs">
                    <span>{h.label}</span>
                    <b>{h.count}</b>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(h.count / maxHazard) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Recovery by material</h3>
          {materialTotals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No collection data yet.</div>
          ) : (
            <div className="space-y-2">
              {materialTotals.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs">
                    <span>{m.material}</span>
                    <b>{m.kg} kg</b>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(m.kg / maxMaterial) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Zone risk snapshot</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {zoneRisk.map((z, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-center text-xs font-bold ${
                  z.level === 'high'
                    ? 'bg-red-100 text-red-700'
                    : z.level === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {z.zone}
                <br />
                <span className="text-[9px] opacity-80">
                  {z.level} · {z.count}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Risk score is derived from report descriptions and worker areas — use it to prioritise field visits, not as an official rating.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Recent incidents</h3>
          </div>
          <div className="overflow-x-auto">
            {recentIncidents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No incidents reported.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Worker</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{inc.id}</td>
                      <td className="px-3 py-2">
                        {inc.type} <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold">{inc.severity}</span>
                      </td>
                      <td className="px-3 py-2">{inc.worker}</td>
                      <td className="px-3 py-2">
                        <select
                          defaultValue={inc.status}
                          onChange={async (e) => {
                            try {
                              await api(`/admin/incidents/${encodeURIComponent(inc.id)}/status`, {
                                method: 'PATCH',
                                body: { status: e.target.value },
                              })
                              alert('Incident status updated.')
                            } catch (err: any) {
                              alert(err?.message || 'Update failed.')
                            }
                          }}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          {['reported', 'received', 'reviewing', 'resolved'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Worker directory</h3>
          </div>
          <div className="overflow-x-auto">
            {directory.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No workers registered.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">WID</th>
                    <th className="px-3 py-2 text-left">Area</th>
                    <th className="px-3 py-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {directory.map((w, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        {w.name}
                        <br />
                        <span className="text-xs text-muted-foreground">{w.work}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{w.wid}</td>
                      <td className="px-3 py-2">{w.area}</td>
                      <td className="px-3 py-2 text-right font-bold">{w.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
