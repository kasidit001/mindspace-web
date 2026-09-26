import type { LessonDetail } from '~/types/course'

/**
 * Fetches a single lesson (with its parent course) from GET /api/lessons/:id.
 * Public endpoint — the Authorization header only matters for a logged-in
 * SYSTEM_ADMIN viewing a lesson under their own draft course; every other
 * caller sees the same response either way.
 */
export function useLesson(lessonId: MaybeRefOrGetter<string>) {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  // `token` starts null and is only populated client-side, after this
  // composable's initial fetch already fired (see useAuth's hydrate/
  // syncFromStorage, run from app.vue's onMounted — later than any page's
  // own setup()). `headers` as a computed + an explicit watch on `token`
  // makes useFetch re-run once hydration lands, instead of forever missing
  // the header on a fresh/hard page load.
  return useFetch<LessonDetail>(
    () => `/api/lessons/${toValue(lessonId)}`,
    {
      baseURL: config.public.apiBase,
      key: () => `lesson-${toValue(lessonId)}`,
      headers: computed<Record<string, string>>(() => {
        const headers: Record<string, string> = {}
        if (token.value) headers.Authorization = `Bearer ${token.value}`
        return headers
      }),
      watch: [() => toValue(lessonId), token]
    }
  )
}
