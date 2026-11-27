import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const CHECK_ITEMS = [
  { id: 'gloves', label: 'Thick gloves' },
  { id: 'mask', label: 'Mask or cloth over nose' },
  { id: 'boots', label: 'Closed shoes / boots' },
  { id: 'tongs', label: 'Tongs or grabber' },
  { id: 'bags', label: 'Labelled waste bags' },
  { id: 'water', label: 'Water and ORS' },
  { id: 'phone', label: 'Charged phone + emergency number' },
]

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [doneToday, setDoneToday] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/checklists')) as { doneToday: boolean }
        setDoneToday(Boolean(data.doneToday))
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const count = Object.values(checked).filter(Boolean).length

  async function submit() {
    if (count === 0) {
      setMessage('Mark at least one checklist item.')
      return
    }
    setSubmitting(true)
    setMessage('')
    const items = CHECK_ITEMS.map((c) => Boolean(checked[c.id]))
    try {
      await api('/checklists', {
        method: 'POST',
        queue: true,
        body: { items, total: CHECK_ITEMS.length },
      })
      setDoneToday(true)
      setMessage('Safety check saved. +20 points.')
    } catch (err: any) {
      if (err?.offline) {
        setDoneToday(true)
        setMessage('Saved offline. Will sync when you reconnect.')
      } else {
        setMessage(err?.message || 'Could not save checklist.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (doneToday) {
    return (
      <div className="space-y-6">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Checklist</div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Safety Checklist</h1>
        </div>
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="text-5xl">✅</div>
          <h2 className="mt-3 text-xl font-bold">Today's safety check is complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You completed {count || CHECK_ITEMS.length} of {CHECK_ITEMS.length} items. Come back tomorrow.
          </p>
          <Button className="mt-4" onClick={() => { setDoneToday(false); setChecked({}) }}>
            Redo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Checklist</div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Safety Checklist</h1>
        <p className="text-sm text-muted-foreground">7 items · about 1 minute. Earn +20 points.</p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="divide-y">
          {CHECK_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-muted/40"
            >
              <input
                type="checkbox"
                checked={Boolean(checked[item.id])}
                onChange={(e) => setChecked((c) => ({ ...c, [item.id]: e.target.checked }))}
                className="h-5 w-5 rounded border-muted-foreground/40"
              />
              <span className="text-sm font-medium">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="border-t p-4">
          <div className="mb-3 text-sm text-muted-foreground">
            {count} of {CHECK_ITEMS.length} items checked
          </div>
          {message && (
            <div className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}
          <Button onClick={submit} disabled={submitting || count === 0} className="w-full">
            {submitting ? 'Saving…' : 'Save safety check'}
          </Button>
        </div>
      </div>
    </div>
  )
}
