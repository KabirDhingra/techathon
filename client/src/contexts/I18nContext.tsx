import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getLang, setLang, t as translate, LANGUAGES } from '@/lib/i18n'

interface I18nContextValue {
  lang: string
  setLanguage: (code: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  languages: typeof LANGUAGES
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getLang())

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLanguage(code: string) {
    setLang(code)
    setLangState(code)
  }

  function t(key: string, vars?: Record<string, string | number>) {
    return translate(key, vars, lang)
  }

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
