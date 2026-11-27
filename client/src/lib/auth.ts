// Session handling. Token + user are stored in localStorage (and mirrored to
// IndexedDB meta store by the caller) exactly as the vanilla app did it.

import { idbPut, idbDelete } from './db/offline'

const TOKEN_KEY = 'ss_token'
const USER_KEY = 'ss_user'
const PROFILE_COMPLETE_KEY = 'ss_profile_complete'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  work: string
  area: string
  emergencyContact: string
  wid: string
  role: string
  verified: boolean
  lang: string
  photo: string
  issuedAt: number | null
  createdAt: number
  idCreated: boolean
  privacy: Record<string, boolean>
  phoneVerified: boolean
  progress?: unknown
}

export interface SessionResponse {
  token: string
  user: User
  profileComplete: boolean
  progress?: unknown
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    void idbPut('meta', { key: 'token', value: token })
  } else {
    localStorage.removeItem(TOKEN_KEY)
    void idbDelete('meta', 'token')
  }
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function setUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function getProfileComplete(): boolean {
  return localStorage.getItem(PROFILE_COMPLETE_KEY) !== 'false'
}

export function setProfileComplete(value: boolean): void {
  localStorage.setItem(PROFILE_COMPLETE_KEY, String(value))
}

export function saveSession(data: Partial<SessionResponse>): void {
  if (data.token) setToken(data.token)
  if (data.user) setUser(data.user as User)
  if (data.profileComplete !== undefined) setProfileComplete(Boolean(data.profileComplete))
}

export function clearSession(): void {
  setToken('')
  setUser(null)
  localStorage.removeItem(PROFILE_COMPLETE_KEY)
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
