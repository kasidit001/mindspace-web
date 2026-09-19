import type { Course } from '~/types/course'

export type TechId = 'ts' | 'js' | 'python' | 'node' | 'go' | 'docker' | 'react' | 'vue'

export interface TechBadge {
  bg: string
  mark: string
  label: string
}

// Same brand palette as HeroGameMap.vue's TECH_ICONS, extracted here so both
// components stay visually consistent instead of drifting apart over time.
export const TECH_BADGES: Record<TechId, TechBadge> = {
  ts: { bg: '#3178C6', mark: '#FFFFFF', label: 'TS' },
  js: { bg: '#F0DB4F', mark: '#1B1B1B', label: 'JS' },
  python: { bg: '#3776AB', mark: '#FFE873', label: 'Py' },
  node: { bg: '#3C873A', mark: '#FFFFFF', label: 'Node' },
  go: { bg: '#00ADD8', mark: '#FFFFFF', label: 'Go' },
  docker: { bg: '#2496ED', mark: '#FFFFFF', label: 'Docker' },
  react: { bg: '#20232A', mark: '#61DAFB', label: 'React' },
  vue: { bg: '#41B883', mark: '#FFFFFF', label: 'Vue' }
}

const TECH_HINTS: Array<{ id: TechId; pattern: RegExp }> = [
  { id: 'ts', pattern: /\btypescript\b/i },
  { id: 'js', pattern: /\bjavascript\b/i },
  { id: 'python', pattern: /\bpython\b/i },
  { id: 'go', pattern: /\bgo(lang)?\b/i },
  { id: 'docker', pattern: /\bdocker\b/i },
  { id: 'react', pattern: /\breact\b/i },
  { id: 'vue', pattern: /\b(vue|nuxt)\b/i },
  { id: 'node', pattern: /\bnode(\.js)?\b/i }
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
