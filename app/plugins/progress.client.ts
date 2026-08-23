export default defineNuxtPlugin(() => {
  // Hydrate lesson-completion state from localStorage on app start (client-only).
  useProgressStore().load()
})
