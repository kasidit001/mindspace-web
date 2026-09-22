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

export interface Course {
  id: string
  title: string
  slug: string
  descriptionEn: string | null
  descriptionTh: string | null
  lessons: LessonSummary[]
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
  /** Pilot "Code Lab" exercise (see ~/components/CodeLab.vue) — null on
   *  the overwhelming majority of lessons that don't have one yet. */
  labStarterCode: string | null
  labTestCode: string | null
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
