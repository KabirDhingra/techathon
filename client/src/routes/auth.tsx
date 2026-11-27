import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'

type Mode = 'login' | 'signup' | 'otp'

export default function AuthPage() {
  const { login, establishSession } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // signup
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLang, setSignupLang] = useState('en')

  // otp
  const [otpKey, setOtpKey] = useState('')
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('signup')
  const [otpCode, setOtpCode] = useState('')
  const [devCode, setDevCode] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(loginEmail.trim(), loginPassword)
      navigate('/home')
    } catch (err: any) {
      if (err?.needsVerification) {
        setOtpKey(loginEmail.trim().toLowerCase())
        setOtpPurpose('login')
        setDevCode(err.devCode || '')
        setMode('otp')
      } else {
        setError(err?.message || 'Sign in failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = (await api('/auth/signup', {
        method: 'POST',
        auth: false,
        body: { name: signupName, email: signupEmail, password: signupPassword, lang: signupLang },
      })) as { devCode?: string; key?: string }
      setOtpKey(signupEmail.trim().toLowerCase())
      setOtpPurpose('signup')
      setDevCode(data.devCode || '')
      setMode('otp')
    } catch (err: any) {
      setError(err?.message || 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = (await api('/auth/verify', {
        method: 'POST',
        auth: false,
        body: { key: otpKey, purpose: otpPurpose, code: otpCode },
      })) as { token: string; user: any; profileComplete: boolean }
      establishSession({ token: data.token, user: data.user, profileComplete: data.profileComplete })
      navigate('/home')
    } catch (err: any) {
      setError(err?.message || 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    try {
      const data = (await api('/auth/resend', {
        method: 'POST',
        auth: false,
        body: { key: otpKey, purpose: otpPurpose },
      })) as { devCode?: string }
      setDevCode(data.devCode || '')
    } catch (err: any) {
      setError(err?.message || 'Could not resend code.')
    }
  }

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'mr', label: 'मराठी' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'or', label: 'ଓଡ଼ିଆ' },
    { code: 'as', label: 'অসমীয়া' },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
            SS
          </div>
          <h1 className="text-xl font-bold">SurakshaSetu</h1>
          <p className="text-sm text-muted-foreground">Safety · Identity · Opportunity</p>
        </div>

        {mode !== 'otp' && (
          <div className="mb-4 flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
                mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold ${
                mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Your password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo: worker@demo.in / Demo@123 · admin@surakshasetu.in / Admin@123
            </p>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full name</label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Language</label>
              <select
                value={signupLang}
                onChange={(e) => setSignupLang(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleVerify} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the verification code sent to <b>{otpKey}</b>.
            </p>
            {devCode && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                Demo code: <b>{devCode}</b>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Verification code</label>
              <input
                type="text"
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="6-digit code"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
            <button
              type="button"
              onClick={resend}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-xs text-muted-foreground hover:underline"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
