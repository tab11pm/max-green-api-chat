import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App'

afterEach(() => sessionStorage.clear())

test('shows the GREEN-API connection heading', () => {
  render(<App />)

  expect(
    screen.getByRole('heading', { name: 'Подключение к GREEN-API' }),
  ).toBeInTheDocument()
})

test('restores an in-progress chat session after a page reload', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChat: { chatId: 'whatsapp-chat-42', phone: '+7 999 123-45-67' },
  }))

  render(<App />)

  expect(screen.getByRole('heading', { name: '+7 999 123-45-67' })).toBeInTheDocument()
})

test('clears the stored session when the user disconnects', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChat: null,
  }))
  render(<App />)

  fireEvent.click(screen.getByRole('button', { name: 'Отключиться' }))

  expect(sessionStorage.getItem('green-api-chat-session')).toBeNull()
  expect(screen.getByRole('heading', { name: 'Подключение к GREEN-API' })).toBeInTheDocument()
})
