import type { Course } from '~/types/course'

export type TechId = 'ts' | 'js' | 'python' | 'node' | 'go' | 'docker' | 'react' | 'vue' | 'nuxt' | 'claude'

// Full names for tooltips/aria-labels. The logos themselves live in
// ~/utils/techLogos (official artwork, not a hand-drawn approximation).
export const TECH_LABELS: Record<TechId, string> = {
  ts: 'TypeScript',
  js: 'JavaScript',
  python: 'Python',
  node: 'Node.js',
  go: 'Go',
  docker: 'Docker',
  react: 'React',
  vue: 'Vue',
  nuxt: 'Nuxt',
  claude: 'Claude'
}

// Order matters: 'nuxt' is checked before the plain 'vue' pattern so a Nuxt
// course gets its own logo/category instead of falling into 'vue'.
const TECH_HINTS: Array<{ id: TechId; pattern: RegExp }> = [
  { id: 'ts', pattern: /\btypescript\b/i },
  { id: 'js', pattern: /\bjavascript\b/i },
  { id: 'python', pattern: /\bpython\b/i },
  { id: 'go', pattern: /\bgo(lang)?\b/i },
  { id: 'docker', pattern: /\bdocker\b/i },
  { id: 'react', pattern: /\breact\b/i },
  { id: 'nuxt', pattern: /\bnuxt\b/i },
  { id: 'vue', pattern: /\bvue\b/i },
  { id: 'node', pattern: /\bnode(\.js)?\b/i },
  { id: 'claude', pattern: /\b(claude|agent skills?|ai agents?)\b/i }
]

/**
 * Every real course today is TypeScript — the platform hasn't authored other
 * tracks yet — so this stays a real, disclosed keyword heuristic over
 * title/description (exactly like ~/utils/courseLevel.ts) rather than a
 * fabricated per-course tag. It's automatically correct once non-TypeScript
 * courses ship; until then it honestly falls back to 'ts'.
 */
export function getCourseTech(course: Pick<Course, 'title' | 'descriptionEn'>): TechId {
  const text = `${course.title} ${course.descriptionEn ?? ''}`
  for (const hint of TECH_HINTS) {
    if (hint.pattern.test(text)) return hint.id
  }
  return 'ts'
}

export type CourseCategory = 'frontend' | 'backend' | 'devops' | 'languages' | 'ai'

// Derived from the course's technology, so it shares getCourseTech's disclosed
// keyword heuristic — there's no `category` field on the API yet.
const TECH_CATEGORY: Record<TechId, CourseCategory> = {
  react: 'frontend',
  vue: 'frontend',
  nuxt: 'frontend',
  node: 'backend',
  go: 'backend',
  docker: 'devops',
  ts: 'languages',
  js: 'languages',
  python: 'languages',
  claude: 'ai'
}

export function getCourseCategory(course: Pick<Course, 'title' | 'descriptionEn'>): CourseCategory {
  return TECH_CATEGORY[getCourseTech(course)]
}
