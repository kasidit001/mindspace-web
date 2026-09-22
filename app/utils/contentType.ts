import { FileText, Play, Terminal } from '@lucide/vue'
import type { LessonContentType } from '~/types/course'

// 'article' is the only value any lesson has today (see types/course.ts) —
// the mapping covers the rest so the icon is already correct once a
// video/lab reader experience ships and starts setting them. Shared by the
// dashboard's "Continue learning" card and the lesson sidebar.
export const CONTENT_TYPE_ICONS: Record<LessonContentType, typeof Play> = {
  article: FileText,
  video: Play,
  advlab: Terminal,
  ctf: Terminal
}
