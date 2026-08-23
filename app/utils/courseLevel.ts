import type { Course } from '~/types/course'

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'

const BEGINNER_HINTS = ['intro', 'introduction', 'getting started', 'for js programmers', 'basics', 'essentials', 'fundamentals']
const ADVANCED_HINTS = ['advanced', 'tooling', 'internals', 'patterns', 'performance', 'architecture']

/**
 * There's no `level` field on the backend Course model yet, so this derives
 * a rough Beginner/Intermediate/Advanced badge from the title + description
 * as a lightweight, purely-cosmetic heuristic. Swap for a real field
 * (`course.level`) once the API supports one.
 */
export function getCourseLevel(course: Pick<Course, 'title' | 'description'>): CourseLevel {
  const text = `${course.title} ${course.description ?? ''}`.toLowerCase()
  if (ADVANCED_HINTS.some((hint) => text.includes(hint))) return 'Advanced'
  if (BEGINNER_HINTS.some((hint) => text.includes(hint))) return 'Beginner'
  return 'Intermediate'
}
