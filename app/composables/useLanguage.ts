import en from '../../locales/en.json'
import th from '../../locales/th.json'

export type Lang = 'en' | 'th'

// Maps every leaf string value in a dictionary to the generic `string` type,
// so `th.json` (different literal strings) can be checked against the same
// shape as `en.json` (whose values TS would otherwise narrow to literals).
type DeepStringify<T> = T extends string
  ? string
  : { [K in keyof T]: DeepStringify<T[K]> }

export type Dictionary = DeepStringify<typeof en>

const dictionaries: Record<Lang, Dictionary> = { en, th }

const COOKIE_KEY = 'mindspace-lang'

function getPath(dict: Dictionary, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, dict)
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match))
}

/**
 * App-wide language state (English / Thai). Stored in a cookie rather than
 * localStorage — unlike theme, translated text renders differently server-
 * side too, so it needs to be readable during SSR to avoid a hydration
 * flash/mismatch.
 */
export function useLanguage() {
  const lang = useCookie<Lang>(COOKIE_KEY, {
    default: () => 'en',
    watch: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  function setLang(next: Lang) {
    lang.value = next
  }

  function toggle() {
    setLang(lang.value === 'en' ? 'th' : 'en')
  }

  function t(path: string, params?: Record<string, string | number>): string {
    const dict = dictionaries[lang.value] ?? dictionaries.en
    const value = getPath(dict, path) ?? getPath(dictionaries.en, path)
    if (typeof value !== 'string') {
      if (import.meta.dev) console.warn(`[i18n] Missing translation key: "${path}"`)
      return path
    }
    return interpolate(value, params)
  }

  return { lang, setLang, toggle, t }
}
