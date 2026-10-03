import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../App'

afterEach(() => vi.restoreAllMocks())

it('guides empty credentials and connects without browser storage', () => {
  const localWrite = vi.spyOn(Storage.prototype, 'setItem')
  const localRead = vi.spyOn(Storage.prototype, 'getItem')
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
  expect(localWrite).not.toHaveBeenCalled()
  expect(localRead).not.toHaveBeenCalled()
})
