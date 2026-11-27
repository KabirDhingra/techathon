// Optional Firebase Phone Authentication (free Spark tier).
// Loads the Firebase web SDK from Google's CDN only when the server reports a
// Firebase API key. Falls back to the local OTP flow otherwise.

const SDK = 'https://www.gstatic.com/firebasejs/10.12.5'

interface Providers {
  sms: 'firebase' | 'demo'
  demoMode: boolean
  firebase: { apiKey: string; projectId: string; authDomain: string } | null
}

interface FirebaseState {
  providers: Providers | null
  auth: any
  signIn: any
  Recaptcha: any
  recaptcha: any
  confirmation: any
  loading: Promise<any> | null
}

const state: FirebaseState = {
  providers: null,
  auth: null,
  signIn: null,
  Recaptcha: null,
  recaptcha: null,
  confirmation: null,
  loading: null,
}

export async function getProviders(): Promise<Providers> {
  if (state.providers) return state.providers
  try {
    const res = await fetch('/api/auth/providers')
    state.providers = (await res.json()) as Providers
  } catch {
    state.providers = { sms: 'demo', demoMode: true, firebase: null }
  }
  return state.providers
}

async function ensureAuth(): Promise<any | null> {
  const providers = await getProviders()
  if (!providers.firebase) return null
  if (state.auth) return state.auth
  if (!state.loading) {
    state.loading = (async () => {
      const [appModule, authModule] = await Promise.all([
        import(/* @vite-ignore */ SDK + '/firebase-app.js'),
        import(/* @vite-ignore */ SDK + '/firebase-auth.js'),
      ])
      const app = appModule.initializeApp(providers.firebase)
      const auth = authModule.getAuth(app)
      auth.languageCode = 'en'
      state.auth = auth
      state.signIn = authModule.signInWithPhoneNumber
      state.Recaptcha = authModule.RecaptchaVerifier
      return auth
    })().catch((err) => {
      state.loading = null
      throw err
    })
  }
  return state.loading
}

export async function sendCode(phone: string, containerId?: string): Promise<{ mode: 'firebase' | 'demo' }> {
  const auth = await ensureAuth()
  if (!auth) return { mode: 'demo' }
  const id = containerId || 'recaptcha-container'
  let holder = document.getElementById(id)
  if (!holder) {
    holder = document.createElement('div')
    holder.id = id
    document.body.appendChild(holder)
  }
  if (state.recaptcha) {
    try {
      state.recaptcha.clear()
    } catch {
      /* already cleared */
    }
  }
  state.recaptcha = new state.Recaptcha(auth, holder, {
    size: 'invisible',
    callback: () => {
      /* solved automatically */
    },
  })
  const digits = String(phone || '').replace(/\D/g, '').slice(-10)
  state.confirmation = await state.signIn(auth, '+91' + digits, state.recaptcha)
  return { mode: 'firebase' }
}

export async function confirmCode(code: string): Promise<string> {
  if (!state.confirmation) throw new Error('Request a new code first.')
  const credential = await state.confirmation.confirm(String(code || '').trim())
  return credential.user.getIdToken()
}

export function friendlyError(error: any): string {
  const code = String((error && error.code) || '')
  const map: Record<string, string> = {
    'auth/invalid-phone-number': 'That mobile number does not look right. Check it and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/quota-exceeded': 'The SMS quota for today is used up. Please try again tomorrow.',
    'auth/captcha-check-failed': 'The security check failed. Please try again.',
    'auth/invalid-verification-code': 'That code is not correct. Please check and try again.',
    'auth/code-expired': 'That code has expired. Request a new one.',
  }
  return map[code] || (error && error.message) || 'Phone verification failed. Please try again.'
}

export async function isConfigured(): Promise<boolean> {
  const providers = await getProviders()
  return Boolean(providers.firebase)
}
