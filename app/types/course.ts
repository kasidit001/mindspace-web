// Lesson title/content and Course description are stored bilingually on the
// API (title_en/title_th, content_en/content_th, description_en/description_th
// — Thai optional, English required/primary) — see ~/utils/localizedLesson
// for how the UI picks between them. Course `title` itself is still a single
// (English-only) field; the API hasn't added a per-course title translation.
// Mirrors mindspace-api's Lesson model — every lesson is 'article' today (the
// same Markdown reader renders all of them); 'video'/'advlab'/'ctf' are real,
// DB-enforced values a lesson could be tagged with once those reader
// experiences exist, but nothing sets them yet.
export type LessonContentType = 'article' | 'video' | 'advlab' | 'ctf'

export interface LessonSummary {
  id: string
  titleEn: string
  titleTh: string | null
  slug: string
  order: number
  contentType: LessonContentType
  readingMinutes: number
}

/** A real, curated label attached to a course (mindspace-api's Tag model) —
 *  distinct from ~/utils/courseTech's title-regex tech-detection heuristic,
 *  which is a display-only guess, not queryable data from the API. */
export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Course {
  id: string
  title: string
  slug: string
  descriptionEn: string | null
  descriptionTh: string | null
  lessons: LessonSummary[]
  tags: Tag[]
}

/** One Code Lab exercise (see ~/components/CodeLab.vue). A lesson can carry
 *  several — `instructions` renders in the left panel, `hint` (if set)
 *  costs real points to reveal (see ~/stores/progress.ts). */
export interface LessonLab {
  id: string
  title: string
  instructions: string
  starterCode: string
  testCode: string
  hint: string | null
}

export interface LessonDetail {
  id: string
  courseId: string
  titleEn: string
  titleTh: string | null
  slug: string
  contentEn: string
  contentTh: string | null
  order: number
  /** Code Lab exercises (see ~/components/CodeLab.vue) — null/empty on
   *  the overwhelming majority of lessons that don't have any yet. */
  labs: LessonLab[] | null
  course: {
    id: string
    title: string
    slug: string
  }
}

export interface ChatReference {
  lessonId: string
  lessonTitle: string
  lessonSlug: string
  courseTitle: string
}

export interface ChatAskResult {
  answer: string
  references: ChatReference[]
}

export interface ChatExchange {
  id: string
  question: string
  answer: string
  references: ChatReference[]
  pending: boolean
  error: string | null
}
