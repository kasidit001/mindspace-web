// Mirrors the roles in mindspace-api's `roles` table: every account is `USER`
// unless someone elevates it to `SYSTEM_ADMIN` directly in the database (the
// signup endpoint never grants it). Keep this union in sync with the API.
export type Role = 'SYSTEM_ADMIN' | 'USER'

const ROLES: Role[] = ['SYSTEM_ADMIN', 'USER']

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

const TOKEN_KEY = 'mindspace:auth-token'
const USER_KEY = 'mindspace:auth-user'
// The old demo session ({name, email, role} — no server, no token) lived here.
// Such a "session" can't be verified, so it's discarded rather than migrated.
const LEGACY_DEMO_KEY = 'mindspace:auth'

export type AuthErrorCode = 'invalid_credentials' | 'email_taken' | 'invalid_input' | 'network' | 'unknown'

export class AuthError extends Error {
  code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.name = 'AuthError'
    this.code = code
  }
}

/** i18n key (see `auth.error.*` in locales/) for whatever a failed auth call threw. */
export function authErrorKey(err: unknown): string {
  return `auth.error.${err instanceof AuthError ? err.code : 'unknown'}`
}

function httpStatus(err: unknown): number | undefined {
  const e = err as { status?: number; response?: { status?: number } } | null
  return e?.status ?? e?.response?.status
}

function toAuthError(err: unknown): AuthError {
  const status = httpStatus(err)
  // No status at all means the request never got a response (offline, DNS,
  // CORS, or the free-tier API still waking up).
  if (status === undefined) return new AuthError('network')
  if (status === 401) return new AuthError('invalid_credentials')
  if (status === 409) return new AuthError('email_taken')
  if (status === 400) return new AuthError('invalid_input')
  return new AuthError('unknown')
}

function normalizeUser(raw: unknown): AuthUser | null {
  const u = raw as Partial<AuthUser> | null
  if (!u || typeof u.id !== 'string' || typeof u.name !== 'string' || typeof u.email !== 'string') return null
  // A role the frontend doesn't know is treated as a plain USER, never as an elevation.
  const role: Role = ROLES.includes(u.role as Role) ? (u.role as Role) : 'USER'
  return { id: u.id, name: u.name, email: u.email, role }
}

function readStored(): { token: string; user: AuthUser } | null {
  if (!import.meta.client) return null
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (!token || !raw) return null
    const user = normalizeUser(JSON.parse(raw))
    return user ? { token, user } : null
  } catch {
    return null
  }
}

function writeStored(token: string | null, user: AuthUser | null) {
  if (!import.meta.client) return
  try {
    if (token && user) {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — the session just won't survive a reload.
  }
}

/**
 * Real accounts against mindspace-api's /api/auth/*: signup/login return a
 * signed session token, kept in localStorage alongside a cached copy of the
 * user so the UI can render logged-in instantly on reload. That cache is
 * re-verified against GET /api/auth/me in the background (`syncFromStorage`);
 * only an explicit 401 drops the session — a slow/offline API (the free-tier
 * host sleeps when idle) never logs anyone out.
 *
 * The token lives in localStorage, so it's readable by any script on the
 * page (XSS) — an accepted tradeoff here versus httpOnly cookies, which would
 * need a cross-site cookie setup between the Vercel and API domains.
 */
export function useAuth() {
  const config = useRuntimeConfig()
  const user = useState<AuthUser | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isAdmin = computed(() => user.value?.role === 'SYSTEM_ADMIN')

  function setSession(nextToken: string, nextUser: AuthUser) {
    token.value = nextToken
    user.value = nextUser
    writeStored(nextToken, nextUser)
  }

  function clearSession() {
    token.value = null
    user.value = null
    writeStored(null, null)
  }

  async function submit(path: '/api/auth/signup' | '/api/auth/login', body: Record<string, string>) {
    let res: { token: string; user: unknown }
    try {
      res = await $fetch<{ token: string; user: unknown }>(path, {
        baseURL: config.public.apiBase,
        method: 'POST',
        body
      })
    } catch (err) {
      throw toAuthError(err)
    }
    const nextUser = normalizeUser(res.user)
    if (!res.token || !nextUser) throw new AuthError('unknown')
    setSession(res.token, nextUser)
  }

  const signup = (input: { name: string; email: string; password: string }) => submit('/api/auth/signup', input)
  const login = (input: { email: string; password: string }) => submit('/api/auth/login', input)

  function logout() {
    clearSession()
  }

  /** Synchronous, no network: restores the cached session so the first paint (and route middleware) already knows who's logged in. */
  function hydrate() {
    if (user.value) return
    const stored = readStored()
    if (stored) {
      token.value = stored.token
      user.value = stored.user
    }
  }

  // The server never knows localStorage, so this only runs client-side after
  // mount (see app.vue) to avoid a hydration mismatch.
  async function syncFromStorage() {
    if (!import.meta.client) return
    try {
      localStorage.removeItem(LEGACY_DEMO_KEY)
    } catch {
      // ignore
    }
    hydrate()
    const current = token.value
    if (!current) return

    try {
      const res = await $fetch<{ user: unknown }>('/api/auth/me', {
        baseURL: config.public.apiBase,
        headers: { Authorization: `Bearer ${current}` }
      })
      const fresh = normalizeUser(res.user)
      // Only apply the result if the session wasn't logged out / replaced while this was in flight.
      if (fresh && token.value === current) setSession(current, fresh)
    } catch (err) {
      if (httpStatus(err) === 401 && token.value === current) clearSession()
    }
  }

  return { user, token, isAdmin, signup, login, logout, hydrate, syncFromStorage }
}
