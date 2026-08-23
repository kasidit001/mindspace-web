import { defineStore } from 'pinia'

const STORAGE_KEY = 'mindspace:completed-lessons'

/**
 * Tracks which lessons the learner has viewed/completed, persisted to
 * localStorage. There's no backend support for progress yet, so this is
 * purely client-side (per-browser).
 */
export const useProgressStore = defineStore('progress', {
  state: () => ({
    completed: [] as string[]
  }),
  getters: {
    isCompleted: (state) => (lessonId: string) => state.completed.includes(lessonId)
  },
  actions: {
    load() {
      if (!import.meta.client) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        this.completed = raw ? JSON.parse(raw) : []
      } catch {
        this.completed = []
      }
    },
    markCompleted(lessonId: string) {
      if (this.completed.includes(lessonId)) return
      this.completed = [...this.completed, lessonId]
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
