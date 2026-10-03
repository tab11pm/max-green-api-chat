import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

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

test('restores saved chats and their messages after a page reload', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChat: {
      chatId: 'whatsapp-chat-42',
      phone: '+7 999 123-45-67',
    },
    messages: [{ id: '1', direction: 'incoming', text: 'Сохранённый ответ', timestamp: 1_791_000_000 }],
  }))

  render(<App />)

  expect(screen.getByText('Сохранённый ответ', { selector: '.message-bubble p' })).toBeInTheDocument()
})

test('restores selected chat history and keeps every saved chat when closing', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChatId: 'chat-two',
    chats: [
      { chatId: 'chat-one', phone: '+7 999 111-11-11', messages: [] },
      { chatId: 'chat-two', phone: '+7 999 222-22-22', messages: [{ id: '2', direction: 'incoming', text: 'Второй чат', timestamp: 2 }] },
    ],
  }))

  render(<App />)

  expect(screen.getByRole('heading', { name: '+7 999 222-22-22' })).toBeInTheDocument()
  expect(screen.getByText('Второй чат', { selector: '.message-bubble p' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть чат' }))
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session') ?? '{}')).toMatchObject({
    activeChatId: null,
    chats: [
      { chatId: 'chat-one', phone: '+7 999 111-11-11', messages: [] },
      { chatId: 'chat-two', phone: '+7 999 222-22-22', messages: [{ text: 'Второй чат' }] },
    ],
  })
})

test('migrates a legacy chat with its messages when the session changes', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChat: { chatId: 'legacy', phone: '+7 999 123-45-67' },
    messages: [{ id: '1', direction: 'incoming', text: 'Старый ответ', timestamp: 1 }],
  }))

  render(<App />)
  expect(screen.getByText('Старый ответ', { selector: '.message-bubble p' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Закрыть чат' }))

  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session') ?? '{}')).toMatchObject({
    activeChatId: null,
    chats: [{ chatId: 'legacy', phone: '+7 999 123-45-67', messages: [{ text: 'Старый ответ' }] }],
  })
})

test('reopening a saved chat selects its existing history without duplicating it', async () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'token' },
    activeChatId: null,
    chats: [{ chatId: 'saved', phone: '+7 999 123-45-67', messages: [{ id: '1', direction: 'incoming', text: 'Сохранено', timestamp: 1 }] }],
  }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ existsWhatsapp: true, chatId: 'saved' }), { status: 200 })))

  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 999 123-45-67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  await screen.findByRole('heading', { name: '+7 999 123-45-67' })
  expect(screen.getByText('Сохранено', { selector: '.message-bubble p' })).toBeInTheDocument()
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session') ?? '{}')).toMatchObject({
    activeChatId: 'saved',
    chats: [{ chatId: 'saved', messages: [{ text: 'Сохранено' }] }],
  })
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
