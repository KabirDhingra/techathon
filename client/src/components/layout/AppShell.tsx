import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { useState, useEffect } from 'react'
import { getQueue } from '@/lib/db/offline'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/home' },
  { id: 'safety', label: 'Safety', path: '/safety' },
  { id: 'collect', label: 'Work', path: '/collect' },
  { id: 'id', label: 'ID', path: '/id' },
  { id: 'benefits', label: 'Benefits', path: '/benefits' },
  { id: 'health', label: 'Health', path: '/health' },
  { id: 'community', label: 'Community', path: '/community' },
  { id: 'profile', label: 'Account', path: '/profile' },
  { id: 'offline', label: 'Offline', path: '/offline' },
  { id: 'municipal', label: 'MCD Centre', path: '/municipal', admin: true },
]

const BOTTOM_NAV = [
  { id: 'home', label: 'Home', path: '/home', icon: '🏠' },
  { id: 'safety', label: 'Safety', path: '/safety', icon: '🛡' },
  { id: 'collect', label: 'Work', path: '/collect', icon: '♻' },
  { id: 'id', label: 'ID', path: '/id', icon: '🪪' },
  { id: 'profile', label: 'Account', path: '/profile', icon: '👤' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navItems = NAV_ITEMS.filter((item) => !item.admin || user?.role === 'admin')
  const { lang, setLanguage, languages } = useI18n()
  const location = useLocation()
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [queueCount, setQueueCount] = useState(getQueue().length)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const interval = setInterval(() => setQueueCount(getQueue().length), 2000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(interval)
    }
  }, [])

  function cycleLang() {
    const codes = languages.map((l) => l.code)
    const idx = codes.indexOf(lang)
    const next = codes[(idx + 1) % codes.length]
    setLanguage(next)
  }

  function toggleTheme() {
    const root = document.documentElement
    const isDark = root.classList.toggle('dark')
    try {
      const raw = localStorage.getItem('ss_prefs')
      const prefs = raw ? JSON.parse(raw) : {}
      prefs.theme = isDark ? 'dark' : 'light'
      localStorage.setItem('ss_prefs', JSON.stringify(prefs))
    } catch {
      /* ignore */
    }
  }

  const initials = String(user?.name || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            SS
          </div>
          <div>
            <div className="font-bold">SurakshaSetu</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Safety · ID · Opportunity
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{item.label}</span>
                {item.id === 'offline' && queueCount > 0 && (
                  <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {queueCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground">
          Logged in as <b className="text-foreground">{user?.name || 'Worker'}</b>
          <br />
          {user?.wid} · {user?.area}
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/95 px-4 py-2 backdrop-blur">
          <button
            className="rounded p-1 md:hidden"
            onClick={() => document.body.classList.toggle('nav-open')}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              SS
            </div>
            <div className="text-sm font-bold">SurakshaSetu</div>
          </div>
          <div className="hidden flex-1 md:block">
            <div className="text-sm font-semibold">{location.pathname.replace('/', '') || 'home'}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold sm:inline-flex ${
                online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {online ? 'Offline ready' : 'Offline'}
            </span>
            <button
              className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-muted"
              onClick={cycleLang}
              title="Change language"
            >
              🌐 {languages.find((l) => l.code === lang)?.label}
            </button>
            <button
              className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
              onClick={toggleTheme}
              title="Toggle dark mode"
            >
              🌓
            </button>
            <div className="flex items-center gap-2 rounded-lg border px-2 py-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="hidden text-xs sm:block">
                <div className="font-semibold">{user?.name || 'Worker'}</div>
                <div className="text-muted-foreground">{user?.wid}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t bg-card/95 backdrop-blur md:hidden">
          {BOTTOM_NAV.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
