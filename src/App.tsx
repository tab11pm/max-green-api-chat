import { useMemo, useRef, useState } from 'react'
import { createGreenApiClient, type ConnectionCredentials } from './api/greenApiClient'
import ChatScreen, { type ActiveChat } from './components/ChatScreen'
import ConnectionScreen from './components/ConnectionScreen'
import type { TimelineMessage } from './components/MessageTimeline'

const SESSION_KEY = 'green-api-chat-session'

export interface SavedChat extends ActiveChat {
  messages: TimelineMessage[]
}

interface ChatSession {
  credentials: ConnectionCredentials
  chats: SavedChat[]
  activeChatId: string | null
}

function readSession(): ChatSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const session: unknown = JSON.parse(stored)
    if (
      typeof session === 'object' && session !== null &&
      'credentials' in session && typeof session.credentials === 'object' && session.credentials !== null &&
      'idInstance' in session.credentials && typeof session.credentials.idInstance === 'string' &&
      'apiTokenInstance' in session.credentials && typeof session.credentials.apiTokenInstance === 'string'
    ) {
      if ('chats' in session && Array.isArray(session.chats)) {
        return {
          credentials: session.credentials as ConnectionCredentials,
          chats: session.chats as SavedChat[],
          activeChatId: 'activeChatId' in session && typeof session.activeChatId === 'string' ? session.activeChatId : null,
        }
      }
      if ('activeChat' in session) {
        const activeChat = session.activeChat as ActiveChat | null
        return {
          credentials: session.credentials as ConnectionCredentials,
          chats: activeChat ? [{ ...activeChat, messages: 'messages' in session && Array.isArray(session.messages) ? session.messages as TimelineMessage[] : [] }] : [],
          activeChatId: activeChat?.chatId ?? null,
        }
      }
    }
  } catch {
    // A malformed session is discarded instead of blocking the connection screen.
  }
  sessionStorage.removeItem(SESSION_KEY)
  return null
}

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<ChatSession | null>(readSession)
  const sessionEpoch = useRef(0)
  const renderedEpoch = sessionEpoch.current
  const client = useMemo(() => session ? createGreenApiClient(session.credentials) : null, [session])

  function saveSession(nextSession: ChatSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  if (!session || !client) return <ConnectionScreen onConnect={(credentials) => {
    sessionEpoch.current += 1
    saveSession({ credentials, chats: [], activeChatId: null })
  }} />
  const activeSession = session
  const selectedChat = activeSession.chats.find((chat) => chat.chatId === activeSession.activeChatId) ?? null

  return <ChatScreen key={selectedChat?.chatId ?? 'empty'} client={client} chats={activeSession.chats} activeChatId={activeSession.activeChatId} onSelectChat={(chatId) => saveSession({ ...activeSession, activeChatId: chatId })} onMessageAdded={(chatId, message) => {
    if (renderedEpoch !== sessionEpoch.current) return
    const latestSession = readSession()
    if (!latestSession || latestSession.credentials.idInstance !== activeSession.credentials.idInstance || latestSession.credentials.apiTokenInstance !== activeSession.credentials.apiTokenInstance) return
    if (!latestSession.chats.some((chat) => chat.chatId === chatId)) return
    const highestId = latestSession.chats.reduce((max, chat) => chat.messages.reduce((chatMax, savedMessage) => {
      const id = Number(savedMessage.id)
      return Number.isSafeInteger(id) && id >= 0 ? Math.max(chatMax, id) : chatMax
    }, max), 0)
    const nextMessage = { ...message, id: String(highestId + 1) }
    saveSession({ ...latestSession, chats: latestSession.chats.map((chat) => chat.chatId === chatId ? { ...chat, messages: [...chat.messages, nextMessage] } : chat) })
  }} onOpenChat={(activeChat) => saveSession({
    ...activeSession,
    chats: activeSession.chats.some((chat) => chat.chatId === activeChat.chatId) ? activeSession.chats : [...activeSession.chats, { ...activeChat, messages: [] }],
    activeChatId: activeChat.chatId,
  })} onCloseChat={() => saveSession({ ...activeSession, activeChatId: null })} onDisconnect={() => {
    sessionEpoch.current += 1
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }} />
}
