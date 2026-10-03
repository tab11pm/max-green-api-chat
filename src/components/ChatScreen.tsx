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
  chats: Array<ActiveChat & { messages: TimelineMessage[] }>
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onMessagesChange: (chatId: string, messages: TimelineMessage[]) => void
  onOpenChat: (chat: ActiveChat) => void
  onCloseChat: () => void
  onDisconnect: () => void
}

export default function ChatScreen({ client, chats, activeChatId, onSelectChat, onMessagesChange, onOpenChat, onCloseChat, onDisconnect }: Props): React.JSX.Element {
  const activeChat = chats.find((chat) => chat.chatId === activeChatId) ?? null
  const [dialogOpen, setDialogOpen] = useState(false)
  const newChatButton = useRef<HTMLButtonElement>(null)
  const [messages, setMessages] = useState<TimelineMessage[]>(activeChat?.messages ?? [])
  const messagesRef = useRef(messages)
  const nextMessageId = useRef(chats.reduce((max, chat) => chat.messages.reduce((chatMax, message) => {
    const id = Number(message.id)
    return Number.isSafeInteger(id) && id >= 0 ? Math.max(chatMax, id) : chatMax
  }, max), 0))
  const appendMessage = useCallback((message: Omit<TimelineMessage, 'id'>) => {
    const id = String(++nextMessageId.current)
    const next = [...messagesRef.current, { ...message, id }]
    messagesRef.current = next
    if (activeChat) onMessagesChange(activeChat.chatId, next)
    setMessages(next)
  }, [activeChat, onMessagesChange])
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
        {chats.length ? (
          <nav className="chat-list" aria-label="Сохранённые чаты">
            {chats.map((chat) => (
              <button key={chat.chatId} className="chat-preview" type="button" aria-label={chat.phone} aria-current={chat.chatId === activeChatId ? 'page' : undefined} onClick={() => onSelectChat(chat.chatId)}>
                <span className="avatar" aria-hidden="true"><Icon name="chat" /></span>
                <span className="chat-preview-copy"><strong>{chat.phone}</strong><small aria-hidden="true">{chat.chatId === activeChatId ? 'Текущий чат' : 'Сохранённый чат'}</small></span>
              </button>
            ))}
          </nav>
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
