import { useMemo, useState } from 'react'
import { createGreenApiClient, type ConnectionCredentials } from './api/greenApiClient'
import ChatScreen, { type ActiveChat } from './components/ChatScreen'
import ConnectionScreen from './components/ConnectionScreen'

const SESSION_KEY = 'green-api-chat-session'

interface ChatSession {
  credentials: ConnectionCredentials
  activeChat: ActiveChat | null
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
      return session as ChatSession
    }
  } catch {
    // A malformed session is discarded instead of blocking the connection screen.
  }
  sessionStorage.removeItem(SESSION_KEY)
  return null
}

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<ChatSession | null>(readSession)
  const client = useMemo(() => session ? createGreenApiClient(session.credentials) : null, [session])

  function saveSession(nextSession: ChatSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  if (!session || !client) return <ConnectionScreen onConnect={(credentials) => saveSession({ credentials, activeChat: null })} />
  const activeSession = session

  return <ChatScreen key={activeSession.activeChat?.chatId ?? 'empty'} client={client} activeChat={activeSession.activeChat} onOpenChat={(activeChat) => saveSession({ ...activeSession, activeChat })} onCloseChat={() => saveSession({ ...activeSession, activeChat: null })} onDisconnect={() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }} />
}
