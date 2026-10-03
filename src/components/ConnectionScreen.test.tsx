import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App'

beforeEach(() => sessionStorage.clear())
afterEach(() => vi.restoreAllMocks())

it('guides empty credentials and stores a session-only connection', () => {
  const localWrite = vi.spyOn(localStorage, 'setItem')
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
  expect(screen.getByText('Введите ID экземпляра')).toBeInTheDocument()
  expect(screen.getByText('Введите токен API')).toBeInTheDocument()

  fireEvent.change(screen.getByRole('textbox', { name: 'ID экземпляра' }), {
    target: { value: '123456' },
  })
  fireEvent.change(screen.getByLabelText('Токен API'), {
    target: { value: 'test-token' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

  expect(screen.getByRole('heading', { name: 'Чаты' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Новый чат' })).toBeInTheDocument()
  expect(sessionStorage.getItem('green-api-chat-session')).toContain('test-token')
  expect(localWrite).not.toHaveBeenCalled()
})

it('shows the Kaitoma brand and MAX transport label', () => {
  render(<App />)

  expect(screen.getByText('Кайтома')).toBeInTheDocument()
  expect(screen.getByText(/GREEN-API · MAX/)).toBeInTheDocument()
})

it('gives each credential field a leading icon', () => {
  const { container } = render(<App />)

  expect(container.querySelectorAll('.field-control svg')).toHaveLength(2)
})
