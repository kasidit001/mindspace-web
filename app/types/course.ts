// Lesson title/content and Course description are stored bilingually on the
// API (title_en/title_th, content_en/content_th, description_en/description_th
// — Thai optional, English required/primary) — see ~/utils/localizedLesson
// for how the UI picks between them. Course `title` itself is still a single
// (English-only) field; the API hasn't added a per-course title translation.
export interface LessonSummary {
  id: string
  titleEn: string
  titleTh: string | null
  slug: string
  order: number
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
