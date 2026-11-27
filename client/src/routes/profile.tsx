import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { isConfigured, sendCode, confirmCode, friendlyError, getProviders } from '@/lib/firebase-phone'

const WORK_OPTIONS = ['Waste Collector', 'Waste Sorter', 'Scrap Collector', 'Recycler', 'Sanitation Worker', 'Other']
const LANGS = [
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

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    area: user?.area || '',
    work: user?.work || 'Waste Collector',
    emergencyContact: user?.emergencyContact || '',
    lang: user?.lang || 'en',
  })
  const [photo, setPhoto] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // phone verification
  const [phone, setPhone] = useState(user?.phone || '')
  const [smsMode, setSmsMode] = useState<'demo' | 'firebase'>('demo')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  const [phoneHint, setPhoneHint] = useState('')
  const [phoneMsg, setPhoneMsg] = useState('')

  useEffect(() => {
    void (async () => {
      const configured = await isConfigured()
      setSmsMode(configured ? 'firebase' : 'demo')
    })()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const body: any = { ...form }
      if (photo) body.photo = photo
      const result = (await api('/user/profile', { method: 'PATCH', body })) as { user: any; message?: string }
      updateUser(result.user)
      setMessage(result.message || 'Profile saved.')
    } catch (err: any) {
      setMessage(err?.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  async function sendPhoneCode() {
    const digits = phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setPhoneMsg('Enter a valid 10-digit mobile number.')
      return
    }
    setSending(true)
    setPhoneMsg('')
    try {
      if (smsMode === 'firebase') {
        await sendCode(digits)
        setShowVerify(true)
        setPhoneHint('Code sent by SMS. Enter the 6-digit code below.')
      } else {
        const result = (await api('/user/phone/send', { method: 'POST', body: { phone: digits } })) as {
          phone: string
          devCode?: string
        }
        setPhone(result.phone)
        setShowVerify(true)
        setPhoneHint(result.devCode ? `Demo code: ${result.devCode}` : 'Code sent by SMS.')
      }
    } catch (err: any) {
      setPhoneMsg(smsMode === 'firebase' ? friendlyError(err) : err?.message || 'Could not send code.')
    } finally {
      setSending(false)
    }
  }

  async function verifyPhone() {
    if (!code.trim()) {
      setPhoneMsg('Enter the verification code.')
      return
    }
    setVerifying(true)
    setPhoneMsg('')
    try {
      let result: any
      if (smsMode === 'firebase') {
        const idToken = await confirmCode(code)
        result = await api('/user/phone/firebase', { method: 'POST', body: { idToken } })
      } else {
        result = await api('/user/phone/verify', { method: 'POST', body: { phone, code } })
      }
      if (result.user) updateUser(result.user)
      setPhoneMsg('Mobile verified! +10 points.')
      setShowVerify(false)
      setCode('')
    } catch (err: any) {
      setPhoneMsg(smsMode === 'firebase' ? friendlyError(err) : err?.message || 'Verification failed.')
    } finally {
      setVerifying(false)
    }
  }

  const providers = getProviders()

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Account · Profile</div>
        <h1 className="text-2xl font-bold tracking-tight">Profile &amp; Phone</h1>
        <p className="text-sm text-muted-foreground">Manage your details, language and mobile verification.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Profile form */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="mb-3 font-semibold">Profile</h3>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Area</label>
              <input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Work category</label>
              <select
                value={form.work}
                onChange={(e) => setForm({ ...form, work: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {WORK_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Emergency contact</label>
              <input
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Language</label>
              <select
                value={form.lang}
                onChange={(e) => setForm({ ...form, lang: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Profile photo</label>
              <input type="file" accept="image/*" onChange={onPhoto} className="mt-1 w-full text-sm" />
            </div>
            {message && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            )}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </div>

        {/* Mobile verification */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="mb-2 font-semibold">Mobile verification</h3>
            <p className="text-xs text-muted-foreground">
              {user?.phoneVerified && user?.phone
                ? `Verified mobile: ${user.phone}`
                : 'Verify your mobile so your emergency contacts can find you.'}
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <Button size="sm" onClick={sendPhoneCode} disabled={sending}>
                {sending ? 'Sending…' : 'Send code'}
              </Button>
            </div>
            {showVerify && (
              <div className="mt-3 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={smsMode === 'firebase' ? '6-digit code' : '4-digit code'}
                  inputMode="numeric"
                  maxLength={smsMode === 'firebase' ? 6 : 4}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={verifyPhone} disabled={verifying}>
                  {verifying ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
            )}
            {phoneHint && <div className="mt-2 text-xs text-muted-foreground">{phoneHint}</div>}
            {phoneMsg && (
              <div className="mt-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {phoneMsg}
              </div>
            )}
            <div className="mt-3 text-[10px] text-muted-foreground">
              Mode: {smsMode === 'firebase' ? 'Firebase SMS' : 'Demo OTP'} (providers: {JSON.stringify((providers as any)?.sms)})
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="mb-2 font-semibold">Quick links</h3>
            <div className="space-y-2">
              <Link to="/id">
                <Button variant="outline" size="sm" className="w-full justify-start">🪪 View digital ID</Button>
              </Link>
              <Link to="/privacy">
                <Button variant="outline" size="sm" className="w-full justify-start">🔒 Privacy settings</Button>
              </Link>
              <Link to="/progress">
                <Button variant="outline" size="sm" className="w-full justify-start">🏆 Points and rewards</Button>
              </Link>
              <Link to="/offline">
                <Button variant="outline" size="sm" className="w-full justify-start">📡 Offline queue</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
