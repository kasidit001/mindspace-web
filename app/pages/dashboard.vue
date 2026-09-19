<script setup lang="ts">
// The learner's personal "Home" — everything on it is computed from real
// data (useCourses() + the localStorage-backed progress store already used
// by layouts/course.vue and courses/index.vue), not mocked. There's no
// multi-user/"other students" data source anywhere in this app yet
// (progress isn't even server-side — see stores/progress.ts), so this
// intentionally shows the current learner's own progress rather than
// fabricating a roster of students to satisfy a "class of students" look.
//
// Framed as a welcoming Home rather than a data-dense Dashboard: a 2-column
// layout — left is the main focus ("Continue learning" plus a browsable,
// invitational course grid), right is compact gamification widgets (streak,
// points, overall progress) — no raw 4-box stat grid, no sortable table.
import { ArrowRight, BookOpenCheck, Compass, FileText, Flame, GraduationCap, Medal, PartyPopper, Play, Rocket, Sparkles, Sprout, Terminal, Trophy, Zap } from '@lucide/vue'
import type { Course, LessonContentType } from '~/types/course'
import { pickLocalized } from '~/utils/localizedLesson'
import { getBadgeDefinition, getBadges, type BadgeMetric } from '~/utils/badges'
import { getCourseTech } from '~/utils/courseTech'

definePageMeta({ layout: 'dashboard' })

const { data: courses, status } = useCourses()
const progress = useProgressStore()
const { user } = useAuth()
const { t, lang } = useLanguage()

// Same hydration-safety pattern as layouts/course.vue and courses/index.vue:
// progress is localStorage-only, unknown to the server, so checkmarks/
// percentages/streak must wait for the client mount to avoid a hydration
// mismatch.
const mounted = ref(false)
onMounted(() => { mounted.value = true })

const levelIcon = { Beginner: Sprout, Intermediate: Zap, Advanced: Rocket } as const
const levelBadgeClass = {
  Beginner: 'bg-success-50 text-success-700 dark:bg-success-400/10 dark:text-success-400',
  Intermediate: 'bg-accent-50 text-accent-700 dark:bg-accent-400/10 dark:text-accent-400',
  Advanced: 'bg-ai-50 text-ai-700 dark:bg-ai-400/10 dark:text-ai-400'
} as const

function sortedLessons(course: Course) {
  return [...course.lessons].sort((a, b) => a.order - b.order)
}

function completedCount(course: Course): number {
  if (!mounted.value) return 0
  return course.lessons.filter((l) => progress.isCompleted(l.id)).length
}

function progressPercent(course: Course): number {
  if (!course.lessons.length) return 0
  return Math.round((completedCount(course) / course.lessons.length) * 100)
}

/** First lesson the learner hasn't finished yet, or the first lesson if
 * none are done, or the last one if the course is fully complete. */
function nextLessonId(course: Course): string | null {
  const lessons = sortedLessons(course)
  const next = lessons.find((l) => !mounted.value || !progress.isCompleted(l.id))
  return (next ?? lessons[0])?.id ?? null
}

function actionLabel(course: Course): string {
  const done = completedCount(course)
  if (done === 0) return t('dashboard.start')
  if (done === course.lessons.length) return t('dashboard.review')
  return t('dashboard.continue')
}

/** Most recent completion timestamp among a course's lessons, or 0 if none —
 * used only to rank which in-progress course to feature, never displayed. */
function lastAccessedAt(course: Course): number {
  if (!mounted.value) return 0
  const timestamps = course.lessons
    .map((l) => progress.completed[l.id])
    .filter(Boolean)
    .map((iso) => new Date(iso!).getTime())
    .filter((n) => !Number.isNaN(n))
  return timestamps.length ? Math.max(...timestamps) : 0
}

const totalLessons = computed(() => (courses.value ?? []).reduce((n, c) => n + c.lessons.length, 0))
const completedLessons = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).reduce((n, c) => n + completedCount(c), 0)
})
const overallPercent = computed(() =>
  totalLessons.value ? Math.round((completedLessons.value / totalLessons.value) * 100) : 0
)
const streakDays = computed(() => (mounted.value ? progress.streakDays : 0))
const coursesCompleted = computed(() => {
  if (!mounted.value) return 0
  return (courses.value ?? []).filter((c) => c.lessons.length > 0 && completedCount(c) === c.lessons.length).length
})

// There's no backend "points"/XP concept (or multi-user leaderboard data) to
// pull from — this is a disclosed, deterministic score derived from real
// completed-lesson counts, not a fabricated number, so it can't drift from
// what the learner actually did.
const POINTS_PER_LESSON = 10
const totalPoints = computed(() => completedLessons.value * POINTS_PER_LESSON)

// Mirrors mindspace-api's getDashboard.usecase.ts BADGE_CATALOG — see
// app/utils/badges.ts for why this stays client-side/threshold-based rather
// than fabricating an exams/badges data model. Titles/descriptions/hints are
// localized (see the `badges` and `dashboard.badgeHint*` locale keys) rather
// than hardcoded in the util, so this stays bilingual like the rest of the app.
const badgeIds = computed(() => getBadges({
  lessonsCompleted: completedLessons.value,
  streakDays: streakDays.value,
  coursesCompleted: coursesCompleted.value
}))

function badgeCurrentValue(metric: BadgeMetric): number {
  if (metric === 'streakDays') return streakDays.value
  if (metric === 'coursesCompleted') return coursesCompleted.value
  return completedLessons.value
}

function badgeHint(id: string): string {
  const def = getBadgeDefinition(id)
  if (!def) return ''
  if (def.metric === 'streakDays') return t('dashboard.badgeHintStreak', { days: def.threshold })
  const remaining = Math.max(def.threshold - badgeCurrentValue(def.metric), 1)
  const noun = def.metric === 'coursesCompleted'
    ? t(remaining === 1 ? 'common.course' : 'common.courses')
    : t(remaining === 1 ? 'common.lesson' : 'common.lessons')
  return t('dashboard.badgeHintCount', { count: remaining, noun })
}

const recentBadge = computed(() => {
  const id = badgeIds.value.recentBadgeId
  if (!id) return null
  return { id, title: t(`badges.${id}.title`), description: t(`badges.${id}.description`) }
})
const nextBadge = computed(() => {
  const id = badgeIds.value.nextBadgeId
  if (!id) return null
  return { id, title: t(`badges.${id}.title`), hint: badgeHint(id) }
})

const BADGE_ICONS: Record<string, typeof Sparkles> = {
  'first-lesson': Sparkles,
  'getting-started': BookOpenCheck,
  'three-day-streak': Flame,
  'dedicated-learner': Medal,
  'course-champion': Trophy,
  'week-streak': Zap
}

// Content Type Indicator: 'article' is the only value any lesson has today
// (see types/course.ts) — the mapping covers the rest so the icon is already
// correct once a video/lab reader experience ships and starts setting them.
const CONTENT_TYPE_ICONS: Record<LessonContentType, typeof Play> = {
  article: FileText,
  video: Play,
  advlab: Terminal,
  ctf: Terminal
}

function continueLessonContentType(course: Course): LessonContentType {
  const lesson = sortedLessons(course).find((l) => l.id === nextLessonId(course))
  return lesson?.contentType ?? 'article'
}

/** The single course to feature in the "Continue learning" hero: the
 * in-progress course studied most recently, or — if nothing's in progress
 * yet — the first course not yet started, so there's always an inviting
 * next step rather than an empty box. */
const continueCourse = computed<Course | null>(() => {
  if (!mounted.value) return null
  const list = courses.value ?? []
  const inProgress = list.filter((c) => {
    const done = completedCount(c)
    return c.lessons.length > 0 && done > 0 && done < c.lessons.length
  })
  if (inProgress.length) {
    return [...inProgress].sort((a, b) => lastAccessedAt(b) - lastAccessedAt(a))[0] ?? null
  }
  return list.find((c) => c.lessons.length > 0 && completedCount(c) === 0) ?? null
})

const allCaughtUp = computed(() =>
  mounted.value &&
  (courses.value?.length ?? 0) > 0 &&
  !continueCourse.value &&
  (courses.value ?? []).every((c) => completedCount(c) === c.lessons.length)
)

function continueLessonTitle(course: Course): string {
  const lesson = sortedLessons(course).find((l) => l.id === nextLessonId(course))
  return lesson ? pickLocalized(lesson.titleEn, lesson.titleTh, lang.value) : ''
}

function continueLessonPosition(course: Course): number {
  const lessons = sortedLessons(course)
  const idx = lessons.findIndex((l) => l.id === nextLessonId(course))
  return idx === -1 ? lessons.length : idx + 1
}

/** Not-started courses surface first — the clearest invitation to explore —
 * then in-progress, then fully completed ones last. Mirrors the honest
 * "not started / continue" heuristic mindspace-api's dashboard usecase uses. */
const exploreCourses = computed(() => {
  const rank = (c: Course) => {
    const done = completedCount(c)
    if (done === 0) return 0
    if (done < c.lessons.length) return 1
    return 2
  }
  return [...(courses.value ?? [])].sort((a, b) => rank(a) - rank(b))
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-12">
    <!-- Signed-out state: progress lives in this browser regardless of
         login, but the personalized summary is gated behind an account
         like the rest of the app's per-user surfaces. -->
    <div v-if="!user" class="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600 dark:bg-accent-400/10 dark:text-accent-400">
        <GraduationCap :size="22" :stroke-width="1.75" />
      </span>
      <h1 class="font-display mt-4 text-xl font-bold tracking-tight">{{ t('dashboard.loginPromptTitle') }}</h1>
      <p class="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.loginPromptBody') }}</p>
      <NuxtLink to="/login" class="btn-primary mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold">
        {{ t('auth.logIn') }}
      </NuxtLink>
    </div>

    <template v-else>
      <header>
        <h1 class="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {{ t('dashboard.title', { name: user.name.split(' ')[0] ?? user.name }) }}
        </h1>
        <p class="mt-1.5 text-zinc-500 dark:text-zinc-400">{{ t('dashboard.subtitle') }}</p>
      </header>

      <!-- 2-column layout: left is the main focus (what to do right now, plus
           a browsable course grid), right is compact "gamification" widgets
           (streak, points, overall progress) — not one flat stat grid. -->
      <div class="mt-8 grid grid-cols-12 gap-6">
        <div class="col-span-12 lg:col-span-8">
          <!-- Continue learning: a deliberately dark, contrasting card (not
               the site's usual light .card) so it reads as THE thing to do,
               regardless of the page's own light/dark theme. -->
          <div v-if="status === 'pending'" class="animate-pulse rounded-2xl bg-zinc-900 p-6 shadow-card-dark sm:p-8">
            <div class="h-4 w-1/3 rounded-md bg-white/10" />
            <div class="mt-4 h-6 w-2/3 rounded-md bg-white/10" />
            <div class="mt-3 h-2 w-full rounded-full bg-white/10" />
          </div>

          <NuxtLink
            v-else-if="continueCourse"
            :to="`/courses/${nextLessonId(continueCourse)}`"
            class="group relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-zinc-900 p-6 text-white shadow-card-dark transition-transform duration-200 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <!-- Purely decorative "premium SaaS banner" dressing — a two-tone
                 mesh-gradient glow plus a dot-grid texture, both clipped by
                 the card's own overflow-hidden and faded out toward the left
                 so they never compete with the readable text there. -->
            <div class="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-accent-500/25 blur-3xl" aria-hidden="true" />
            <div class="pointer-events-none absolute -right-6 bottom-0 size-48 rounded-full bg-ai-500/15 blur-3xl" aria-hidden="true" />
            <div class="continue-card-dots pointer-events-none absolute inset-0" aria-hidden="true" />

            <div class="relative min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{{ t('dashboard.continueLearning') }}</p>
              <h2 class="mt-2 truncate font-display text-xl font-bold tracking-tight sm:text-2xl">{{ continueCourse.title }}</h2>
              <p class="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-400">
                <component
                  :is="CONTENT_TYPE_ICONS[continueLessonContentType(continueCourse)]"
                  :size="14"
                  :stroke-width="2"
                  class="shrink-0 text-zinc-500"
                  :aria-label="t(`dashboard.contentType.${continueLessonContentType(continueCourse)}`)"
                />
                <span class="min-w-0 truncate">
                  {{ t('dashboard.lessonPosition', { current: continueLessonPosition(continueCourse), total: continueCourse.lessons.length }) }}
                  &mdash; {{ continueLessonTitle(continueCourse) }}
                </span>
              </p>
              <div class="mt-4 flex items-center gap-3">
                <div class="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-accent-400 transition-all duration-500" :style="{ width: `${progressPercent(continueCourse)}%` }" />
                </div>
                <span class="shrink-0 text-xs font-medium text-zinc-400">{{ progressPercent(continueCourse) }}%</span>
              </div>
            </div>
            <div class="relative flex shrink-0 flex-row-reverse items-center gap-4 self-start sm:flex-col sm:items-end sm:self-auto">
              <TechLogo :tech="getCourseTech(continueCourse)" :size="48" />
              <span class="btn-primary inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold">
                {{ actionLabel(continueCourse) }}
                <ArrowRight :size="14" :stroke-width="2" class="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </NuxtLink>

          <div v-else-if="allCaughtUp" class="flex flex-col items-center rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-card-dark sm:p-8">
            <span class="flex size-11 items-center justify-center rounded-full bg-success-400/15 text-success-400">
              <PartyPopper :size="20" :stroke-width="1.75" />
            </span>
            <h2 class="mt-3 font-display text-lg font-bold tracking-tight">{{ t('dashboard.allCaughtUpTitle') }}</h2>
            <p class="mt-1.5 max-w-sm text-sm text-zinc-400">{{ t('dashboard.allCaughtUpBody') }}</p>
          </div>

          <div v-else class="flex flex-col items-center rounded-2xl bg-zinc-900 p-6 text-center text-white shadow-card-dark sm:p-8">
            <span class="flex size-11 items-center justify-center rounded-full bg-accent-400/15 text-accent-400">
              <Compass :size="20" :stroke-width="1.75" />
            </span>
            <h2 class="mt-3 font-display text-lg font-bold tracking-tight">{{ t('dashboard.emptyStateTitle') }}</h2>
            <p class="mt-1.5 max-w-sm text-sm text-zinc-400">{{ t('dashboard.emptyStateBody') }}</p>
            <NuxtLink to="/courses" class="btn-primary mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold">
              {{ t('dashboard.browseCourses') }}
            </NuxtLink>
          </div>

          <!-- Explore: a browsable, invitational course grid — not-started
               courses lead, so this reads as "here's what to try next", not a
               re-listing of the same stats in the right column. -->
          <section class="mt-10">
            <div class="flex items-baseline justify-between gap-4">
              <div>
                <h2 class="font-display text-lg font-bold tracking-tight">{{ t('dashboard.exploreHeading') }}</h2>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{{ t('dashboard.exploreSubtitle') }}</p>
              </div>
              <NuxtLink to="/courses" class="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent-700 hover:underline dark:text-accent-400 sm:inline-flex">
                {{ t('dashboard.browseCourses') }}
                <ArrowRight :size="14" :stroke-width="2" />
              </NuxtLink>
            </div>

            <div v-if="status === 'pending'" class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div v-for="i in 2" :key="i" class="card animate-pulse p-5">
                <div class="h-4 w-2/3 rounded-md bg-zinc-200 dark:bg-white/10" />
                <div class="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-white/[0.06]" />
              </div>
            </div>

            <div v-else class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NuxtLink
                v-for="course in exploreCourses"
                :key="course.id"
                :to="nextLessonId(course) ? `/courses/${nextLessonId(course)}` : '/courses'"
                class="card flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex min-w-0 items-center gap-3">
                    <TechLogo :tech="getCourseTech(course)" :size="40" />
                    <div class="min-w-0">
                      <h3 class="truncate font-semibold leading-snug">{{ course.title }}</h3>
                      <span
                        class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        :class="levelBadgeClass[getCourseLevel(course)]"
                      >
                        <component :is="levelIcon[getCourseLevel(course)]" :size="11" :stroke-width="2" />
                        {{ getCourseLevel(course) }}
                      </span>
                    </div>
                  </div>
                  <span class="shrink-0 text-xs font-medium text-zinc-400">{{ progressPercent(course) }}%</span>
                </div>
                <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
                  <div class="h-full rounded-full bg-accent-500" :style="{ width: `${progressPercent(course)}%` }" />
                </div>
                <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-700 dark:text-accent-400">
                  {{ actionLabel(course) }}
                  <ArrowRight :size="14" :stroke-width="2" />
                </span>
              </NuxtLink>

              <p v-if="!courses?.length" class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('courses.noCourses') }}</p>
            </div>
          </section>
        </div>

        <!-- Right column: clean white widget cards for at-a-glance stats. -->
        <div class="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <div class="card p-6">
            <h2 class="font-display text-base font-bold tracking-tight">{{ t('dashboard.myActivity') }}</h2>
            <div class="mt-4 flex items-center justify-between gap-4">
              <div class="flex min-w-0 flex-col items-start gap-2">
                <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-500 text-base font-bold text-white">
                  {{ user.name.charAt(0).toUpperCase() }}
                </span>
                <p class="max-w-[6.5rem] truncate font-semibold text-zinc-900 dark:text-white">{{ user.name }}</p>
              </div>

              <div class="flex flex-col gap-4">
                <div>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ t('dashboard.dailyStreak') }}</p>
                  <div class="mt-1 flex items-center gap-1.5">
                    <span
                      class="flex size-6 items-center justify-center rounded-full"
                      :class="streakDays > 0 ? 'bg-warning-50 text-warning-600 dark:bg-warning-400/10 dark:text-warning-400' : 'bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500'"
                    >
                      <Flame :size="13" :stroke-width="1.9" />
                    </span>
                    <span class="text-lg font-bold tracking-tight">{{ streakDays }}</span>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400">{{ t('dashboard.totalPoints') }}</p>
                  <p class="mt-1 text-lg font-bold tracking-tight">{{ totalPoints }}<span class="text-xs font-medium text-zinc-400"> XP</span></p>
                </div>
              </div>
            </div>

            <!-- Badges: the most recently earned one in full color, and the
                 next one as a grayed-out silhouette with a hint on how to
                 unlock it — both are just thresholds on real stats above
                 (see ~/utils/badges), never a fabricated achievement. -->
            <div class="mt-5 flex items-start gap-4 border-t border-divider pt-5 dark:border-divider-dark">
              <div v-if="recentBadge" class="flex min-w-0 flex-1 items-center gap-2.5" :title="recentBadge.description">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                  <component :is="BADGE_ICONS[recentBadge.id]" :size="16" :stroke-width="1.9" />
                </span>
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{{ t('dashboard.latestBadge') }}</p>
                  <p class="truncate text-xs font-semibold text-zinc-900 dark:text-white">{{ recentBadge.title }}</p>
                </div>
              </div>
              <p v-else class="flex-1 text-xs text-zinc-400">{{ t('dashboard.noBadgeYet') }}</p>

              <div v-if="nextBadge" class="flex min-w-0 flex-1 items-center gap-2.5" :title="nextBadge.hint">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 opacity-70 dark:bg-white/[0.06] dark:text-zinc-600">
                  <component :is="BADGE_ICONS[nextBadge.id]" :size="16" :stroke-width="1.9" />
                </span>
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{{ t('dashboard.nextBadge') }}</p>
                  <p class="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">{{ nextBadge.title }}</p>
                  <p class="truncate text-[10px] text-zinc-400">{{ nextBadge.hint }}</p>
                </div>
              </div>
              <p v-else class="flex-1 text-xs text-zinc-400">{{ t('dashboard.allBadgesEarned') }}</p>
            </div>
          </div>

          <div class="card p-6">
            <h2 class="font-display text-base font-bold tracking-tight">{{ t('dashboard.yourProgress') }}</h2>
            <p class="mt-3 text-2xl font-bold tracking-tight">
              {{ completedLessons }}<span class="text-sm font-normal text-zinc-400">/{{ totalLessons }}</span>
            </p>
            <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{{ t('dashboard.statLessonsCompleted') }}</p>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
              <div class="h-full rounded-full bg-accent-500 transition-all duration-500" :style="{ width: `${overallPercent}%` }" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* Faint dot-grid texture for the Continue Learning card — fades out toward
   the left (where the readable text sits) so it only shows as a subtle
   graphic on the right, never competing with content. */
.continue-card-dots {
  background-image: radial-gradient(circle, rgb(255 255 255 / 5%) 1px, transparent 1px);
  background-size: 18px 18px;
  mask-image: linear-gradient(to left, black, transparent 65%);
  -webkit-mask-image: linear-gradient(to left, black, transparent 65%);
}
</style>
