export type BadgeMetric = 'lessonsCompleted' | 'streakDays' | 'coursesCompleted'

export interface BadgeDefinition {
  id: string
  metric: BadgeMetric
  threshold: number
}

export interface BadgeContext {
  lessonsCompleted: number
  streakDays: number
  coursesCompleted: number
}

/**
 * There's no exams/badges data model anywhere in mindspace-api — rather than
 * fabricate one, every badge here is a plain threshold on stats we already
 * compute for real from localStorage progress (or, once wired to the backend
 * in Phase B, from Progress rows). Mirrors mindspace-api's
 * src/usecases/dashboard/getDashboard.usecase.ts BADGE_CATALOG exactly —
 * keep both, and the `badges` locale namespace (titles/descriptions), in sync.
 * Display strings live in locales/*.json rather than here so they're
 * translated, not just this one metric/threshold shape.
 */
export const BADGE_CATALOG: BadgeDefinition[] = [
  { id: 'first-lesson', metric: 'lessonsCompleted', threshold: 1 },
  { id: 'getting-started', metric: 'lessonsCompleted', threshold: 5 },
  { id: 'three-day-streak', metric: 'streakDays', threshold: 3 },
  { id: 'dedicated-learner', metric: 'lessonsCompleted', threshold: 10 },
  { id: 'course-champion', metric: 'coursesCompleted', threshold: 1 },
  { id: 'week-streak', metric: 'streakDays', threshold: 7 }
]

/** The highest-tier badge earned so far (a proxy for "most recent" — there's no
 * per-badge earned-at timestamp to sort by) and the very next one, unearned. */
export function getBadges(ctx: BadgeContext): { recentBadgeId: string | null; nextBadgeId: string | null } {
  let recentBadgeId: string | null = null
  let nextBadgeId: string | null = null

  for (const def of BADGE_CATALOG) {
    if (ctx[def.metric] >= def.threshold) {
      recentBadgeId = def.id
    } else if (!nextBadgeId) {
      nextBadgeId = def.id
    }
  }

  return { recentBadgeId, nextBadgeId }
}

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGE_CATALOG.find((b) => b.id === id)
}
