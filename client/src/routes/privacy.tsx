import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

const PRIVACY_ITEMS = [
  { key: 'publicProfile', label: 'Public profile', desc: 'Allow your name and area to appear in community listings.' },
  { key: 'sharePhone', label: 'Share phone on verification', desc: 'Show your mobile number to people who verify your ID. Off by default.' },
  { key: 'sosLocation', label: 'Attach location to SOS', desc: 'Include your GPS position in an emergency alert.' },
  { key: 'hazardAlerts', label: 'Local hazard alerts', desc: 'Receive alerts about hazards reported near your area.' },
  { key: 'qrVerification', label: 'Public QR verification', desc: 'Let others confirm your ID is active using your QR or worker ID.' },
]

export default function PrivacyPage() {
  const { user } = useAuth()
  const [privacy, setPrivacy] = useState<Record<string, boolean>>(user?.privacy || {})
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const raw = localStorage.getItem('ss_prefs')
      return raw ? (JSON.parse(raw).theme || 'light') : 'light'
    } catch {
      return 'light'
    }
  })
  const [contrast, setContrast] = useState(() => {
    try {
      const raw = localStorage.getItem('ss_prefs')
      return raw ? Boolean(JSON.parse(raw).contrast) : false
    } catch {
      return false
    }
  })
  const [speakReplies, setSpeakReplies] = useState(() => {
    try {
      const raw = localStorage.getItem('ss_prefs')
      return raw ? (JSON.parse(raw).speakReplies !== false) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    void (async () => {
      try {
        const data = (await api('/user/privacy')) as { privacy: Record<string, boolean> }
        setPrivacy(data.privacy || {})
      } catch {
        /* keep defaults */
      }
    })()
  }, [])

  async function togglePrivacy(key: string) {
    const next = !privacy[key]
    setPrivacy((p) => ({ ...p, [key]: next }))
    try {
      await api('/user/privacy', { method: 'PATCH', body: { [key]: next } })
    } catch {
      setPrivacy((p) => ({ ...p, [key]: !next }))
    }
  }

  function savePref(patch: Record<string, unknown>) {
    try {
      const raw = localStorage.getItem('ss_prefs')
      const prefs = raw ? JSON.parse(raw) : {}
      Object.assign(prefs, patch)
      localStorage.setItem('ss_prefs', JSON.stringify(prefs))
      if (patch.theme) {
        document.body.classList.toggle('theme-dark', patch.theme === 'dark')
      }
      if (patch.contrast !== undefined) {
        document.body.classList.toggle('high-contrast', Boolean(patch.contrast))
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Account · Privacy</div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy &amp; Data</h1>
        <p className="text-sm text-muted-foreground">Your safety should never cost your privacy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold">Sharing controls</h3>
          </div>
          <div className="divide-y">
            {PRIVACY_ITEMS.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="max-w-[70%]">
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void togglePrivacy(item.key)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    privacy[item.key] ? 'bg-primary' : 'bg-muted'
                  }`}
                  aria-label={item.label}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      privacy[item.key] ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-3">
              <h3 className="font-semibold">Display preferences</h3>
            </div>
            <div className="divide-y">
              <ToggleRow
                label="Dark mode"
                value={theme === 'dark'}
                onChange={(v) => {
                  setTheme(v ? 'dark' : 'light')
                  savePref({ theme: v ? 'dark' : 'light' })
                }}
              />
              <ToggleRow
                label="High contrast"
                value={contrast}
                onChange={(v) => {
                  setContrast(v)
                  savePref({ contrast: v })
                }}
              />
              <ToggleRow
                label="Read replies aloud"
                value={speakReplies}
                onChange={(v) => {
                  setSpeakReplies(v)
                  savePref({ speakReplies: v })
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Your data</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Download a copy of your profile, collections, scans, reports and point history.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={async () => {
                const paths = ['/auth/me', '/collections', '/scans', '/incidents', '/history', '/progress', '/user/privacy']
                const bundle: Record<string, unknown> = {}
                for (const p of paths) {
                  try {
                    bundle[p.replace(/\W/g, '')] = await api(p)
                  } catch {
                    /* skip */
                  }
                }
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
                )
                const a = document.createElement('a')
                a.href = url
                a.download = 'surakshasetu-my-data.json'
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              Download my data
            </Button>
          </div>

          <div className="rounded-2xl border-l-4 border-primary bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground">
              <b>Storage:</b> Your session and offline queue stay in this browser. Photos are
              resized before upload and never sold or used for advertising.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-primary' : 'bg-muted'}`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            value ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
