import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../App'

const accountSuccess = () => new Response(JSON.stringify({ exist: true, chatId: 'max-chat-42' }), { status: 200 })

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
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
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
    expect.stringContaining('/checkAccount/'),
    expect.objectContaining({ body: JSON.stringify({ phoneNumber: 79991234567 }) }),
  )
  expect(screen.getByRole('heading', { name: '+7 (999) 123-45-67' })).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('keeps the dialog open when a number has no MAX account', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ exist: false, chatId: '' }), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  connect()
  openDialog()
  fireEvent.change(screen.getByRole('textbox', { name: 'Номер получателя' }), { target: { value: '+7 999 123 45 67' } })
  fireEvent.click(screen.getByRole('button', { name: 'Открыть чат' }))

  expect(await screen.findByText('Этот номер не зарегистрирован в MAX. Проверьте номер и попробуйте снова.')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('does not send whitespace and shows outgoing text only after API success', async () => {
  let resolveSend!: (response: Response) => void
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkAccount/')) return Promise.resolve(accountSuccess())
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
    expect.objectContaining({ body: JSON.stringify({ chatId: 'max-chat-42', message: 'Привет' }) }),
  )
})

it('keeps confirmed messages after a failed send and hides server details', async () => {
  let sends = 0
  const fetchMock = vi.fn((url: string) => {
    if (url.includes('/checkAccount/')) return Promise.resolve(accountSuccess())
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
    if (url.includes('/checkAccount/')) return Promise.resolve(accountSuccess())
    if (url.includes('/receiveNotification/')) return Promise.resolve(new Response(JSON.stringify({
      receiptId: 9,
      body: {
        typeWebhook: 'incomingMessageReceived',
        senderData: { chatId: 'max-chat-42' },
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
