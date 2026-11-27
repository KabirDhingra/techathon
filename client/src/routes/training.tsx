import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

interface Lesson {
  id: string
  title: string
  duration?: string
  icon?: string
  completed?: boolean
  steps?: string[]
}

export default function TrainingPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = (await api('/content/lessons')) as { lessons: Lesson[] }
      setLessons(data.lessons || [])
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function complete(id: string) {
    try {
      const result = (await api(`/lessons/${encodeURIComponent(id)}/complete`, { method: 'POST' })) as {
        progress?: unknown
        message?: string
        awarded?: number
      }
      if (result.progress) {
        try {
          localStorage.setItem('ss_progress', JSON.stringify(result.progress))
        } catch {
          /* ignore */
        }
      }
      alert(result.message || 'Lesson complete!')
      await load()
    } catch (err: any) {
      alert(err?.message || 'Could not complete lesson.')
    }
  }

  const done = lessons.filter((l) => l.completed).length

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Safety · Training</div>
        <h1 className="text-2xl font-bold tracking-tight">Safety Training</h1>
        <p className="text-sm text-muted-foreground">Read each lesson, then mark it complete to earn points.</p>
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-bold">Your progress</div>
            <div className="text-xs text-muted-foreground">
              {done} of {lessons.length} lessons complete · {done * 25} points earned
            </div>
          </div>
          <div className="w-56">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${lessons.length ? (done / lessons.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading lessons…</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-lg">
                {lesson.icon || '🎓'}
              </div>
              {lesson.completed ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  Completed ✓
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  Lesson {index + 1}
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-semibold">{lesson.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">⏱ {lesson.duration}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {(lesson.steps || []).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <Button
              size="sm"
              className="mt-3 w-full"
              disabled={Boolean(lesson.completed)}
              onClick={() => void complete(lesson.id)}
            >
              {lesson.completed ? 'Already completed' : 'Mark complete · +25'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
