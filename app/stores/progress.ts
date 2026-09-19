import { defineStore } from 'pinia'

const STORAGE_KEY = 'mindspace:completed-lessons'
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Tracks which lessons the learner has viewed/completed, persisted to
 * localStorage. There's no backend support for progress yet, so this is
 * purely client-side (per-browser). Each entry also records the ISO
 * timestamp of completion (or '' for entries migrated from the older
 * array-only format, which never recorded one) so a real streak — not a
 * fabricated one — can be computed from genuine completion events. Compare
 * to mindspace-api's getDashboard.usecase.ts, which does the same
 * distinct-day bucketing once progress is server-side.
 */
export const useProgressStore = defineStore('progress', {
  state: () => ({
    completed: {} as Record<string, string>
  }),
  getters: {
    isCompleted: (state) => (lessonId: string) => lessonId in state.completed,
    /** Consecutive-day count ending today or yesterday, from real completion
     * timestamps only — entries with no known date (pre-migration) don't count. */
    streakDays: (state): number => {
      const days = Object.values(state.completed)
        .filter(Boolean)
        .map((iso) => Math.floor(new Date(iso).getTime() / DAY_MS))
        .filter((day) => !Number.isNaN(day))
      if (!days.length) return 0

      const uniqueDays = Array.from(new Set(days)).sort((a, b) => b - a)
      const today = Math.floor(Date.now() / DAY_MS)
      const mostRecent = uniqueDays[0]!
      if (mostRecent !== today && mostRecent !== today - 1) return 0

      let streak = 0
      let expected = mostRecent
      for (const day of uniqueDays) {
        if (day === expected) {
          streak++
          expected--
        } else if (day < expected) {
          break
        }
      }
      return streak
    }
  },
  actions: {
    load() {
      if (!import.meta.client) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) {
          this.completed = {}
          return
        }
        const parsed = JSON.parse(raw)
        // Migrate the old `string[]` shape (no timestamps) to the record
        // shape, so existing progress isn't lost — just undated.
        this.completed = Array.isArray(parsed)
          ? Object.fromEntries(parsed.map((id: string) => [id, '']))
          : parsed
      } catch {
        this.completed = {}
      }
    },
    markCompleted(lessonId: string) {
      if (lessonId in this.completed) return
      this.completed = { ...this.completed, [lessonId]: new Date().toISOString() }
      this.persist()
    },
    reset() {
      this.completed = {}
      this.persist()
    },
    persist() {
      if (!import.meta.client) return
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.completed))
      } catch {
        // localStorage unavailable (private mode, etc.) — progress just won't persist.
      }
    }
  }
})
