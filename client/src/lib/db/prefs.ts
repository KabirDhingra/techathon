// Mirrors the localStorage prefs used by the vanilla app (key: ss_prefs).
// Kept byte-for-byte compatible so saved preferences survive the migration.

export interface Prefs {
  lang: string
  speakReplies: boolean
  theme: 'light' | 'dark'
  contrast: boolean
  hazardAlerts?: boolean
}

export const DEFAULT_PREFS: Prefs = {
  lang: 'en',
  speakReplies: false,
  theme: 'light',
  contrast: false,
}

const KEY = 'ss_prefs'

export function getPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<Prefs>
    return { ...DEFAULT_PREFS, ...parsed }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  const next = { ...getPrefs(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage full or blocked */
  }
  return next
}

export function resetPrefs(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
