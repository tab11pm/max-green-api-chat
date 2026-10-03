export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'kaitoma-theme'

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function resolveInitialTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage may be unavailable; the in-memory attribute still applies the theme.
  }
}

export function toggleTheme(): Theme {
  const next: Theme = resolveInitialTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
