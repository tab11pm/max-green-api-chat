import { StrictMode } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App'

const accountSuccess = () => new Response(JSON.stringify({ existsWhatsapp: true, chatId: 'whatsapp-chat-42' }), { status: 200 })

function connect() {
  render(<App />)
  fireEvent.change(screen.getByRole('textbox', { name: 'ID экземпляра' }), { target: { value: '123' } })
  fireEvent.change(screen.getByLabelText('Токен API'), { target: { value: 'test-token' } })
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
}

function openDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }))
}

async function openChat(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock)
  connect()
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), {
    target: { value: '+7 (999) 123-45-67' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))
  await screen.findByRole('heading', { name: '+7 (999) 123-45-67' })
}

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

beforeEach(() => sessionStorage.clear())

it('exposes an icon-only close control with an accessible name', async () => {
  await openChat(vi.fn().mockResolvedValue(accountSuccess()))
  const close = screen.getByRole('button', { name: 'Закрыть чат' })
  expect(close).toHaveClass('icon-button')
  expect(close.querySelector('svg')).not.toBeNull()
})

it('renders a theme toggle in the sidebar', async () => {
  await openChat(vi.fn().mockResolvedValue(accountSuccess()))
  expect(screen.getByRole('button', { name: 'Переключить тему' })).toBeInTheDocument()
})

it('lists saved chats and restores the selected chat history', () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'test-token' },
    chats: [
      { chatId: 'chat-one', phone: '+7 (999) 123-45-67', messages: [{ id: '7', direction: 'outgoing', text: 'Сообщение первого чата', timestamp: 1_791_000_000 }] },
      { chatId: 'chat-two', phone: '+7 (999) 765-43-21', messages: [{ id: '8', direction: 'incoming', text: 'Сообщение второго чата', timestamp: 1_791_000_001 }] },
    ],
    activeChatId: 'chat-two',
  }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('null', { status: 200 })))
  render(<App />)

  const first = screen.getByRole('button', { name: '+7 (999) 123-45-67' })
  const second = screen.getByRole('button', { name: '+7 (999) 765-43-21' })
  expect(first).not.toHaveAttribute('aria-current')
  expect(second).toHaveAttribute('aria-current', 'page')
  expect(screen.getByText('Сообщение второго чата')).toBeInTheDocument()

  fireEvent.click(first)
  expect(screen.getByRole('button', { name: '+7 (999) 123-45-67' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', { name: '+7 (999) 765-43-21' })).not.toHaveAttribute('aria-current')
  expect(screen.getByText('Сообщение первого чата')).toBeInTheDocument()
  expect(screen.queryByText('Сообщение второго чата')).not.toBeInTheDocument()
})

it('assigns a new message ID above saved numeric IDs', async () => {
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'test-token' },
    chats: [
      { chatId: 'chat-one', phone: '+7 (999) 123-45-67', messages: [{ id: '42', direction: 'incoming', text: 'Сохранённое', timestamp: 1_791_000_000 }] },
      { chatId: 'chat-two', phone: '+7 (999) 765-43-21', messages: [] },
    ],
    activeChatId: 'chat-two',
  }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  render(<App />)

  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Новое' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  await screen.findByText('Новое')

  const saved = JSON.parse(sessionStorage.getItem('green-api-chat-session')!)
  expect(saved.chats[0].messages).toEqual([{ id: '42', direction: 'incoming', text: 'Сохранённое', timestamp: 1_791_000_000 }])
  expect(saved.chats[1].messages[0]).toMatchObject({ id: '43', text: 'Новое' })
})

it('keeps a sent message when its send completes after switching chats', async () => {
  let resolveSend!: (response: Response) => void
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'test-token' },
    chats: [
      { chatId: 'chat-one', phone: '+7 (999) 123-45-67', messages: [] },
      { chatId: 'chat-two', phone: '+7 (999) 765-43-21', messages: [] },
    ],
    activeChatId: 'chat-one',
  }))
  vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('/sendMessage/')
    ? new Promise<Response>((resolve) => { resolveSend = resolve })
    : Promise.resolve(new Response('null', { status: 200 }))))
  render(<App />)

  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Отложенная отправка' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  fireEvent.click(screen.getByRole('button', { name: '+7 (999) 765-43-21' }))
  await act(async () => { resolveSend(new Response('{}', { status: 200 })) })
  expect(screen.getByRole('button', { name: '+7 (999) 765-43-21' })).toHaveAttribute('aria-current', 'page')
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session')!).activeChatId).toBe('chat-two')
  fireEvent.click(screen.getByRole('button', { name: '+7 (999) 123-45-67' }))

  expect(screen.getByText('Отложенная отправка')).toBeInTheDocument()
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session')!).activeChatId).toBe('chat-one')
})

it('preserves newer messages when an earlier send completes after leaving and returning', async () => {
  let resolveFirstSend!: (response: Response) => void
  let sends = 0
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'test-token' },
    chats: [
      { chatId: 'chat-one', phone: '+7 (999) 123-45-67', messages: [] },
      { chatId: 'chat-two', phone: '+7 (999) 765-43-21', messages: [] },
    ],
    activeChatId: 'chat-one',
  }))
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/sendMessage/')) {
      sends += 1
      return sends === 1 ? new Promise<Response>((resolve) => { resolveFirstSend = resolve }) : Promise.resolve(new Response('{}', { status: 200 }))
    }
    return Promise.resolve(new Response('null', { status: 200 }))
  }))
  render(<App />)

  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Первое' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  fireEvent.click(screen.getByRole('button', { name: '+7 (999) 765-43-21' }))
  fireEvent.click(screen.getByRole('button', { name: '+7 (999) 123-45-67' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Второе' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  await screen.findByText('Второе')

  await act(async () => { resolveFirstSend(new Response('{}', { status: 200 })) })
  expect(screen.getByText('Первое')).toBeInTheDocument()
  expect(screen.getByText('Второе')).toBeInTheDocument()
  const messages = JSON.parse(sessionStorage.getItem('green-api-chat-session')!).chats[0].messages
  expect(messages.map((message: { text: string }) => message.text)).toEqual(['Второе', 'Первое'])
  expect(new Set(messages.map((message: { id: string }) => message.id)).size).toBe(2)
})

it('ignores a pending send from a disconnected session after reconnecting with the same credentials', async () => {
  let resolveOldSend!: (response: Response) => void
  sessionStorage.setItem('green-api-chat-session', JSON.stringify({
    credentials: { idInstance: '123', apiTokenInstance: 'test-token' },
    chats: [{ chatId: 'chat-one', phone: '+7 (999) 123-45-67', messages: [] }],
    activeChatId: 'chat-one',
  }))
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/sendMessage/')) return new Promise<Response>((resolve) => { resolveOldSend = resolve })
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(new Response(JSON.stringify({ existsWhatsapp: true, chatId: 'chat-one' }), { status: 200 }))
    return Promise.resolve(new Response('null', { status: 200 }))
  }))
  render(<App />)

  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Из старой сессии' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  fireEvent.click(screen.getByRole('button', { name: 'Отключиться' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'ID экземпляра' }), { target: { value: '123' } })
  fireEvent.change(screen.getByLabelText('Токен API'), { target: { value: 'test-token' } })
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 (999) 123-45-67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))
  await screen.findByRole('heading', { name: '+7 (999) 123-45-67' })

  await act(async () => { resolveOldSend(new Response('{}', { status: 200 })) })
  expect(screen.queryByText('Из старой сессии')).not.toBeInTheDocument()
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session')!).chats[0].messages).toEqual([])
})

it('moves the theme toggle into the sidebar header and gives disconnect its own footer row', async () => {
  await openChat(vi.fn().mockResolvedValue(accountSuccess()))
  expect(document.querySelector('.sidebar-head .theme-toggle')).not.toBeNull()
  expect(document.querySelector('.sidebar-foot')).toBeNull()
  expect(screen.getByRole('button', { name: 'Отключиться' })).toHaveClass('disconnect-button')
})

it('uses an icon send button with an accessible name', async () => {
  await openChat(vi.fn().mockResolvedValue(accountSuccess()))
  const send = screen.getByRole('button', { name: 'Отправить' })
  expect(send).toHaveClass('icon-button')
  expect(send.querySelector('svg')).not.toBeNull()
})

it('shows the outgoing timestamp and delivery icon', async () => {
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/sendMessage/')) return Promise.resolve(new Response(JSON.stringify({ idMessage: 'm1' }), { status: 200 }))
    return Promise.resolve(new Response('{}', { status: 200 }))
  })
  await openChat(fetchMock)

  fireEvent.change(screen.getByRole('textbox', { name: 'Сообщение' }), { target: { value: 'Привет' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))

  expect(await screen.findByText(/\d{2}:\d{2}/)).toBeInTheDocument()
  expect(document.querySelector('.bubble-out .meta svg')).not.toBeNull()
})

it('validates a recipient before sending an account request', () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  connect()
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '12345' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  expect(screen.getByText(/Введите номер в международном формате/)).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

it('closes the new-chat dialog with Escape and returns keyboard focus', () => {
  connect()
  const trigger = screen.getByRole('button', { name: 'Новый чат' })
  fireEvent.click(trigger)
  expect(screen.getByRole('textbox', { name: 'Номер получателя' })).toHaveFocus()

  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

it('keeps Tab focus inside the new-chat dialog', () => {
  connect()
  openDialog()
  const dialog = screen.getByRole('dialog')
  const close = screen.getByRole('button', { name: 'Закрыть окно' })
  const open = screen.getByRole('button', { name: 'Открыть чат' })

  open.focus()
  fireEvent.keyDown(dialog, { key: 'Tab' })
  expect(close).toHaveFocus()

  fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
  expect(open).toHaveFocus()
})

it('normalizes a recipient number and opens the returned MAX chat', async () => {
  const fetchMock = vi.fn().mockResolvedValue(accountSuccess())
  await openChat(fetchMock)

  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/checkWhatsapp/'),
    expect.objectContaining({ body: JSON.stringify({ phoneNumber: 79991234567 }) }),
  )
  expect(screen.getByRole('heading', { name: '+7 (999) 123-45-67' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('selects an existing chat instead of adding it twice', async () => {
  const fetchMock = vi.fn().mockResolvedValue(accountSuccess())
  await openChat(fetchMock)

  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), {
    target: { value: '+7 (999) 123-45-67' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  await screen.findByRole('heading', { name: '+7 (999) 123-45-67' })
  expect(screen.getAllByRole('button', { name: /\+7 \(999\) 123-45-67/ })).toHaveLength(1)
  expect(JSON.parse(sessionStorage.getItem('green-api-chat-session')!).chats).toHaveLength(1)
})

it('keeps the dialog open when a number has no MAX account', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ existsWhatsapp: false, chatId: '' }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  connect()
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 999 123 45 67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  expect(await screen.findByText('Этот номер не зарегистрирован в MAX. Проверьте номер и попробуйте снова.')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('shows an account-check failure and restores the submit control in Strict Mode', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Forbidden', { status: 403 })))
  render(<StrictMode><App /></StrictMode>)
  fireEvent.change(screen.getByRole('textbox', { name: 'ID экземпляра' }), { target: { value: '123' } })
  fireEvent.change(screen.getByLabelText('Токен API'), { target: { value: 'test-token' } })
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 999 123 45 67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  expect(await screen.findByText('Не удалось проверить номер. Проверьте подключение и попробуйте снова.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Открыть чат' })).toBeEnabled()
})

it('does not send whitespace and shows outgoing text only after API success', async () => {
  let resolveSend!: (response: Response) => void
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/sendMessage/')) return new Promise<Response>((resolve) => { resolveSend = resolve })
    return Promise.resolve(new Response('null', { status: 200 }))
  })
  await openChat(fetchMock)

  const composer = screen.getByRole('textbox', { name: 'Сообщение' })
  const send = screen.getByRole('button', { name: 'Отправить' })
  fireEvent.change(composer, { target: { value: '   ' } })
  expect(send).toBeDisabled()
  fireEvent.change(composer, { target: { value: 'Привет' } })
  fireEvent.click(send)
  expect(screen.queryByText('Привет', { selector: '.message-bubble p' })).not.toBeInTheDocument()
  expect(screen.getByText('Отправка…')).toBeInTheDocument()

  await act(async () => { resolveSend(new Response('{}', { status: 200 })) })
  expect(screen.getByText('Привет')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/sendMessage/'),
      expect.objectContaining({ body: JSON.stringify({ chatId: 'whatsapp-chat-42', message: 'Привет' }) }),
  )
})

it('preserves text typed during an in-flight send when that send succeeds', async () => {
  let resolveSend!: (response: Response) => void
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/sendMessage/')) return new Promise<Response>((resolve) => { resolveSend = resolve })
    return Promise.resolve(new Response('null', { status: 200 }))
  })
  await openChat(fetchMock)
  const composer = screen.getByRole('textbox', { name: 'Сообщение' })
  fireEvent.change(composer, { target: { value: 'Первое' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  fireEvent.change(composer, { target: { value: 'Следующее' } })

  await act(async () => { resolveSend(new Response('{}', { status: 200 })) })

  expect(screen.getByText('Первое', { selector: '.message-bubble p' })).toBeInTheDocument()
  expect(composer).toHaveValue('Следующее')
  expect(screen.getByRole('button', { name: 'Отправить' })).toBeEnabled()
})

it('preserves a retyped draft even when it matches the submitted text', async () => {
  let resolveSend!: (response: Response) => void
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/sendMessage/')) return new Promise<Response>((resolve) => { resolveSend = resolve })
    return Promise.resolve(new Response('null', { status: 200 }))
  })
  await openChat(fetchMock)
  const composer = screen.getByRole('textbox', { name: 'Сообщение' })
  fireEvent.change(composer, { target: { value: 'Привет' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  fireEvent.change(composer, { target: { value: '' } })
  fireEvent.change(composer, { target: { value: 'Привет' } })

  await act(async () => { resolveSend(new Response('{}', { status: 200 })) })

  expect(composer).toHaveValue('Привет')
})

it('shows a neutral status before the first notification check succeeds', async () => {
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    return Promise.resolve(new Response('null', { status: 200 }))
  })
  await openChat(fetchMock)

  expect(screen.getByRole('status')).toHaveTextContent('Проверяем подключение…')
  expect(screen.queryByText('Подключено')).not.toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/receiveNotification/'), expect.anything())
})

it('keeps confirmed messages after a failed send and hides server details', async () => {
  let sends = 0
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/sendMessage/')) {
      sends += 1
      return Promise.resolve(sends === 1 ? new Response('{}', { status: 200 }) : new Response('test-token private', { status: 500 }))
    }
    return Promise.resolve(new Response('null', { status: 200 }))
  })
  await openChat(fetchMock)
  const composer = screen.getByRole('textbox', { name: 'Сообщение' })
  fireEvent.change(composer, { target: { value: 'Первое' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))
  await screen.findByText('Первое')
  fireEvent.change(composer, { target: { value: 'Второе' } })
  fireEvent.click(screen.getByRole('button', { name: 'Отправить' }))

  expect(await screen.findByText('Не удалось отправить сообщение. Попробуйте снова.')).toBeInTheDocument()
  expect(screen.getByText('Первое')).toBeInTheDocument()
  expect(screen.queryByText('Второе', { selector: '.message-bubble p' })).not.toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('Второе')
  expect(screen.queryByText(/test-token|private/)).not.toBeInTheDocument()
})

it('shows matching incoming text from polling', async () => {
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkWhatsapp/')) return Promise.resolve(accountSuccess())
    if (url.includes('/receiveNotification/')) return Promise.resolve(new Response(JSON.stringify({
      receiptId: 9,
      body: {
        typeWebhook: 'incomingMessageReceived',
        senderData: { chatId: 'whatsapp-chat-42' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ответ' } },
        timestamp: 1_791_000_000,
      },
    }), { status: 200 }))
    if (url.includes('/deleteNotification/')) return Promise.resolve(new Response(JSON.stringify({ result: true }), { status: 200 }))
    return Promise.resolve(new Response('{}', { status: 200 }))
  })
  await openChat(fetchMock)
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 2_100)) })
  expect(screen.getByText('Ответ')).toBeInTheDocument()
  expect(screen.getByText('Входящее сообщение')).toBeInTheDocument()
})

it('ignores an account check that finishes after disconnect', async () => {
  let resolveAccount!: (response: Response) => void
  const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveAccount = resolve }))
  vi.stubGlobal('fetch', fetchMock)
  connect()
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 999 123 45 67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))
  fireEvent.click(screen.getByRole('button', { name: 'Отключиться' }))

  await act(async () => { resolveAccount(accountSuccess()) })
  fireEvent.change(screen.getByRole('textbox', { name: 'ID экземпляра' }), { target: { value: '456' } })
  fireEvent.change(screen.getByLabelText('Токен API'), { target: { value: 'other-token' } })
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))
  expect(screen.getByText('Выберите, с кем начать разговор')).toBeInTheDocument()
})
