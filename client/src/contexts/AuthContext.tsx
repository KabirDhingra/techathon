import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getToken, getUser, clearSession, saveSession } from '@/lib/auth'
import { api } from '@/lib/api'
import type { User } from '@/lib/auth'

interface AuthContextValue {
  user: User | null
  token: string
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  establishSession: (data: { token: string; user: User; profileComplete?: boolean }) => void
  logout: () => void
  updateUser: (user: User) => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getToken())
  const [user, setUser] = useState<User | null>(getUser())

  useEffect(() => {
    if (token && !user) {
      void refreshMe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refreshMe() {
    try {
      const data = (await api('/auth/me')) as { user: User }
      saveSession({ user: data.user })
      setUser(data.user)
      setToken(getToken())
    } catch {
      clearSession()
      setUser(null)
      setToken('')
    }
  }

  function establishSession(data: { token: string; user: User; profileComplete?: boolean }) {
    saveSession({ token: data.token, user: data.user, profileComplete: data.profileComplete })
    setToken(data.token)
    setUser(data.user)
  }

  async function login(email: string, password: string) {
    const data = (await api('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    })) as { token?: string; user?: User; profileComplete?: boolean; needsVerification?: boolean; devCode?: string }
    if (data.needsVerification) {
      const err = new Error('Account not verified. Please verify to continue.')
      ;(err as any).needsVerification = true
      ;(err as any).devCode = data.devCode
      throw err
    }
    if (!data.token || !data.user) throw new Error('Sign in failed.')
    establishSession({ token: data.token, user: data.user, profileComplete: data.profileComplete })
  }

  function logout() {
    void api('/auth/logout', { method: 'POST' }).catch(() => {})
    clearSession()
    setUser(null)
    setToken('')
  }

  function updateUser(u: User) {
    saveSession({ user: u })
    setUser(u)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        establishSession,
        logout,
        updateUser,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
