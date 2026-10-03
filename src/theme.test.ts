import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, getStoredTheme, resolveInitialTheme, toggleTheme, THEME_STORAGE_KEY } from './theme'

beforeEach(() => localStorage.clear())

describe('theme', () => {
  it('returns null for a missing or corrupted stored value', () => {
    expect(getStoredTheme()).toBeNull()
    localStorage.setItem(THEME_STORAGE_KEY, 'purple')
    expect(getStoredTheme()).toBeNull()
  })

  it('applies and persists a theme', () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('toggles from the resolved theme', () => {
    applyTheme('dark')
    expect(toggleTheme()).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('falls back to the system preference when nothing is stored', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    expect(resolveInitialTheme()).toBe('dark')
  })
})
