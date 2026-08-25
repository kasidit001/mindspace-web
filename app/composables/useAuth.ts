export interface AuthUser {
  name: string
  email: string
}

const STORAGE_KEY = 'mindspace:auth'

/**
 * UI-only auth: no backend, no server. This is a local demo session —
 * `login`/`signup` never receive or persist a password, only {name, email}
 * mirrored to localStorage, purely so the Log In / Sign Up flow and the
 * nav's logged-in state can be demoed end-to-end. Real accounts (password
 * hashing, a server-side store) are a separate, deliberately deferred piece
 * of work — see the PR description.
 */
export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)

  function login(email: string, name?: string) {
    const trimmedEmail = email.trim()
    const resolvedName = name?.trim() || trimmedEmail.split('@')[0] || trimmedEmail
    const next: AuthUser = { name: resolvedName, email: trimmedEmail }
    user.value = next
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage unavailable — session just won't persist across visits.
    }
  }

  function logout() {
    user.value = null
    if (!import.meta.client) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore — nothing to clean up if storage was never writable.
    }
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
        user.value = parsed
      }
    } catch {
      // Corrupt/unavailable storage — just stay logged out.
    }
  }

  return { user, login, logout, syncFromStorage }
}
