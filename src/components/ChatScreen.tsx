import { useCallback, useRef, useState } from 'react'
import type { IncomingMessage } from '../domain/notifications'
import { useNotifications, type GreenApiClient } from '../hooks/useNotifications'
import Composer from './Composer'
import Icon from './Icon'
import MessageTimeline, { type TimelineMessage } from './MessageTimeline'
import NewChatDialog from './NewChatDialog'
import ThemeToggle from './ThemeToggle'

export interface ActiveChat {
  chatId: string
  phone: string
}

interface Props {
  client: GreenApiClient
  activeChat: ActiveChat | null
  initialMessages: TimelineMessage[]
  onMessagesChange: (messages: TimelineMessage[]) => void
  onOpenChat: (chat: ActiveChat) => void
  onCloseChat: () => void
  onDisconnect: () => void
}

export default function ChatScreen({ client, activeChat, initialMessages, onMessagesChange, onOpenChat, onCloseChat, onDisconnect }: Props): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false)
  const newChatButton = useRef<HTMLButtonElement>(null)
  const [messages, setMessages] = useState<TimelineMessage[]>(initialMessages)
  const nextMessageId = useRef(0)
  const appendMessage = useCallback((message: Omit<TimelineMessage, 'id'>) => {
    const id = String(++nextMessageId.current)
    setMessages((previous) => {
      const next = [...previous, { ...message, id }]
      onMessagesChange(next)
      return next
    })
  }, [onMessagesChange])
  const onMessage = useCallback((message: IncomingMessage) => appendMessage(message), [appendMessage])
  const { status } = useNotifications({ client, chatId: activeChat?.chatId ?? null, phone: activeChat?.phone ?? null, onMessage })

  async function send(text: string) {
    if (!activeChat) return
    await client.sendText(activeChat.chatId, text)
    appendMessage({ direction: 'outgoing', text, timestamp: Date.now() / 1000 })
  }

  function closeDialog() {
    setDialogOpen(false)
    newChatButton.current?.focus()
  }

  return (
    <main className="messenger-shell">
      <aside className="chat-sidebar" aria-label="Навигация по чатам">
        <div className="sidebar-head">
          <span className="brand-mark" aria-hidden="true">К</span>
          <div>
            <p className="eyebrow">GREEN-API · MAX</p>
            <h1>Чаты</h1>
          </div>
          <ThemeToggle />
        </div>
        <button ref={newChatButton} className="primary-button new-chat-button" type="button" onClick={() => setDialogOpen(true)}><Icon name="plus" size={16} />Новый чат</button>
        {activeChat ? (
          <div className="chat-preview" aria-current="page">
            <span className="avatar" aria-hidden="true"><Icon name="chat" /></span>
            <span className="chat-preview-copy"><strong>{activeChat.phone}</strong><small>Текущий чат</small></span>
          </div>
        ) : <p className="sidebar-empty">Откройте чат по номеру телефона, чтобы начать переписку.</p>}
        <button className="disconnect-button" type="button" aria-label="Отключиться" onClick={onDisconnect}><Icon name="logout" size={16} /><span>Отключиться</span></button>
      </aside>

      <section className="chat-surface" aria-label="Переписка">
        {activeChat ? (
          <>
            <header className="chat-header">
              <span className="avatar" aria-hidden="true">{activeChat.phone.replace(/\D/g, '').slice(-2)}</span>
              <div className="chat-identity">
                <h2><Icon name="phone" size={16} />{activeChat.phone}</h2>
                <p className={`transport-status ${status === 'issue' ? 'is-issue' : ''}`} role="status">
                  {status === 'issue' ? 'Проблема с подключением. Проверяем снова…' : status === 'checking' ? 'Проверяем подключение…' : 'Подключено'}
                </p>
              </div>
              <button className="icon-button" type="button" aria-label="Закрыть чат" onClick={onCloseChat}><Icon name="close" /></button>
            </header>
            <MessageTimeline messages={messages} />
            <Composer onSend={send} />
          </>
        ) : (
          <div className="chat-empty">
            <span className="empty-icon" aria-hidden="true"><Icon name="chat" size={24} /></span>
            <h2>Выберите, с кем начать разговор</h2>
            <p>Создайте чат по номеру телефона в международном формате.</p>
          </div>
        )}
      </section>

      {dialogOpen && <NewChatDialog client={client} onClose={closeDialog} onOpenChat={(chat) => {
        onOpenChat(chat)
        setDialogOpen(false)
      }} />}
    </main>
  )
}
