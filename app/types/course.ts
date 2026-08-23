export interface LessonSummary {
  id: string
  title: string
  slug: string
  order: number
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  lessons: LessonSummary[]
}

export interface LessonDetail {
  id: string
  courseId: string
  title: string
  slug: string
  content: string
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
