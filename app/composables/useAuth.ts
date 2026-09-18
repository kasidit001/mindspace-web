// Mirrors the roles the API's User table is adding: every account is
// `USER` unless the backend elevates it to `SYSTEM_ADMIN`. Keep this union
// in sync with the API's role enum.
export type Role = 'SYSTEM_ADMIN' | 'USER'

const ROLES: Role[] = ['SYSTEM_ADMIN', 'USER']

export interface AuthUser {
  name: string
  email: string
  role: Role
}

const STORAGE_KEY = 'mindspace:auth'

/**
 * UI-only auth: no backend, no server. This is a local demo session —
 * `login`/`signup` never receive or persist a password, only
 * {name, email, role} mirrored to localStorage, purely so the Log In /
 * Sign Up flow and the nav's logged-in state can be demoed end-to-end.
 * Real accounts (password hashing, a server-side store, and the actual
 * role on the User row) are a separate, deliberately deferred piece of
 * work — see the PR description.
 *
 * `role` defaults to `USER`, matching what self-serve signup will get from
 * the real API; `setRole` is a demo-only stand-in for previewing
 * `SYSTEM_ADMIN`-gated UI until the backend can actually grant it.
 */
export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const isAdmin = computed(() => user.value?.role === 'SYSTEM_ADMIN')

  function persist(next: AuthUser | null) {
    if (!import.meta.client) return
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage unavailable — session just won't persist across visits.
    }
  }

  function login(email: string, name?: string, role: Role = 'USER') {
    const trimmedEmail = email.trim()
    const resolvedName = name?.trim() || trimmedEmail.split('@')[0] || trimmedEmail
    const next: AuthUser = { name: resolvedName, email: trimmedEmail, role }
    user.value = next
    persist(next)
  }

  function logout() {
    user.value = null
    persist(null)
  }

  // Demo-only: flips the current session's role locally so admin-gated UI
  // can be previewed before the API can actually assign SYSTEM_ADMIN.
  function setRole(role: Role) {
    if (!user.value) return
    const next: AuthUser = { ...user.value, role }
    user.value = next
    persist(next)
  }

  // Avoid a hydration mismatch: the server never knows localStorage auth
  // state, so this is only called client-side after mount (see app.vue).
  function syncFromStorage() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.email === 'string' && typeof parsed.name === 'string') {
        // Sessions saved before roles existed won't have one — default them
        // to USER rather than dropping the session.
        const role: Role = ROLES.includes(parsed.role) ? parsed.role : 'USER'
        user.value = { name: parsed.name, email: parsed.email, role }
      }
    } catch {
      // Corrupt/unavailable storage — just stay logged out.
    }
  }

  return { user, isAdmin, login, logout, setRole, syncFromStorage }
}
