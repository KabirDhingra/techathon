// 12-language UI dictionary. Data is loaded from i18n-data.json, which is an
// exact export of the vanilla app's public/js/i18n.js (keys + parallel arrays).

import data from './i18n-data.json'

export const LANGUAGES: { code: string; label: string }[] = [
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

const KEYS = data.keys as string[]
const TABLES = data.data as Record<string, Record<string, string>>

// Rebuild parallel-array data into key->value maps (defensive, in case the
// JSON ships arrays in the future).
const tables: Record<string, Record<string, string>> = {}
for (const code of Object.keys(TABLES)) {
  const entry = TABLES[code] as unknown
  if (Array.isArray(entry)) {
    const map: Record<string, string> = {}
    KEYS.forEach((key, i) => {
      map[key] = (entry as string[])[i]
    })
    tables[code] = map
  } else {
    tables[code] = entry as Record<string, string>
  }
}

function ensureLanguage(code: string): string {
  return LANGUAGES.some((l) => l.code === code) ? code : 'en'
}

export function getLang(): string {
  try {
    const raw = localStorage.getItem('ss_prefs')
    if (raw) {
      const parsed = JSON.parse(raw) as { lang?: string }
      if (parsed.lang) return parsed.lang
    }
  } catch {
    /* ignore */
  }
  return 'en'
}

export function setLang(code: string): void {
  try {
    const raw = localStorage.getItem('ss_prefs')
    const prefs = raw ? JSON.parse(raw) : {}
    prefs.lang = code
    localStorage.setItem('ss_prefs', JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function t(key: string, vars?: Record<string, string | number>, lang?: string): string {
  const code = ensureLanguage(lang || getLang())
  const table = tables[code] || tables.en
  let text = (table && table[key]) || (tables.en && tables.en[key]) || key
  if (vars) {
    for (const name of Object.keys(vars)) {
      text = String(text).split(`{${name}}`).join(String(vars[name]))
    }
  }
  return text
}
