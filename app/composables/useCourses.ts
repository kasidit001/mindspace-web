import type { Course } from '~/types/course'

/** Fetches all courses (with their lesson list) from GET /api/courses. */
export function useCourses() {
  const config = useRuntimeConfig()

  return useFetch<Course[]>('/api/courses', {
    baseURL: config.public.apiBase,
    key: 'courses',
    default: () => []
  })
}
