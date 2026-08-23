import type { LessonDetail } from '~/types/course'

/** Fetches a single lesson (with its parent course) from GET /api/lessons/:id. */
export function useLesson(lessonId: MaybeRefOrGetter<string>) {
  const config = useRuntimeConfig()

  return useFetch<LessonDetail>(
    () => `/api/lessons/${toValue(lessonId)}`,
    {
      baseURL: config.public.apiBase,
      key: () => `lesson-${toValue(lessonId)}`,
      watch: [() => toValue(lessonId)]
    }
  )
}
