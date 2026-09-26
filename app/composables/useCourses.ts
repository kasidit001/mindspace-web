import type { Course } from '~/types/course'

/**
 * Fetches all courses (with their lesson list) from GET /api/courses. Public
 * endpoint — the Authorization header is only ever present for a logged-in
 * SYSTEM_ADMIN, and only changes what comes back for them (their own draft
 * courses); every other caller gets the same public catalog either way.
 */
export function useCourses() {
  const config = useRuntimeConfig()
  const { token } = useAuth()

  // `token` starts null and is only populated client-side (see useAuth's
  // hydrate/syncFromStorage) — app.vue forces a refreshNuxtData() once that
  // lands, so this computed + watch just needs to be correct for that
  // explicit re-run, not for useFetch's own (unreliable, for a plain
  // `headers` option) reactivity.
  return useFetch<Course[]>('/api/courses', {
    baseURL: config.public.apiBase,
    key: 'courses',
    headers: computed<Record<string, string>>(() => {
      const headers: Record<string, string> = {}
      if (token.value) headers.Authorization = `Bearer ${token.value}`
      return headers
    }),
    watch: [token],
    default: () => []
  })
}
