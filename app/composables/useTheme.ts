export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'mindspace:theme'

/**
 * Dark/light theme toggle. The actual first-paint decision happens in a
 * blocking inline script (see app.vue) so there's no flash-of-wrong-theme —
 * this composable just keeps a reactive mirror of that state for the UI
 * (toggle buttons, icons) and persists changes back to localStorage.
 */
export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')

  function apply(next: Theme) {
    theme.value = next
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage unavailable — theme just won't persist across visits.
    }
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  function syncFromDom() {
    if (!import.meta.client) return
    theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }

  return { theme, apply, toggle, syncFromDom }
}
