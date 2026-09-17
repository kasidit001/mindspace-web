// Guards SYSTEM_ADMIN-only pages (e.g. /admin). Client-side only for now —
// same caveat as the rest of useAuth: there's no server session to check,
// so this is a UI convenience, not real access control. Once the API
// issues sessions/JWTs with a role claim, re-check this server-side too.
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.client) return
  const { user, isAdmin } = useAuth()
  if (!user.value || !isAdmin.value) {
    return navigateTo('/')
  }
})
