import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import ThemeToggle from './ThemeToggle'

it('toggles the document theme and persists it', () => {
  render(<ThemeToggle />)
  fireEvent.click(screen.getByRole('button', { name: 'Переключить тему' }))
  expect(['light', 'dark']).toContain(document.documentElement.dataset.theme)
  expect(localStorage.getItem('kaitoma-theme')).toBe(document.documentElement.dataset.theme)
})
