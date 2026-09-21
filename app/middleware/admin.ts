// Guards SYSTEM_ADMIN-only pages (e.g. /admin). This is a UI convenience, NOT
// access control: the role comes from a client-held session, so anyone could
// tamper with it in devtools. Real protection has to live in the API — every
// admin endpoint must check the caller's role server-side — before /admin
// lists real data.
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return
  const { user, isAdmin, hydrate } = useAuth()
  // Route middleware runs before app.vue's onMounted restores the session, so
  // restore it here (synchronously, from the local cache) or a direct visit
  // to /admin would always look logged out.
  hydrate()
  if (!user.value || !isAdmin.value) {
    return navigateTo('/')
  }
})
