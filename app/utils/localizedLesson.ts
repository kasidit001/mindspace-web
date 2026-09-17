import type { Lang } from '~/composables/useLanguage'

/**
 * Lessons store English (required) and Thai (optional) side by side —
 * `titleEn`/`titleTh`, `contentEn`/`contentTh` — mirroring the API's
 * lessons.title_en/title_th columns (see mindspace-api's Lesson model).
 * Thai is a partial translation layered on top, so this falls back to
 * English whenever the Thai field is null/empty, same as the API's own
 * English-only search/RAG pipeline does.
 */
export function pickLocalized(en: string, th: string | null | undefined, lang: Lang): string {
  return lang === 'th' && th ? th : en
}
