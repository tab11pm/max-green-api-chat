import { useMemo, useState } from 'react'
import { createGreenApiClient, type ConnectionCredentials } from './api/greenApiClient'
import ChatScreen, { type ActiveChat } from './components/ChatScreen'
import ConnectionScreen from './components/ConnectionScreen'

export default function App(): React.JSX.Element {
  const [credentials, setCredentials] = useState<ConnectionCredentials | null>(null)
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)
  const client = useMemo(() => credentials ? createGreenApiClient(credentials) : null, [credentials])

  if (!client) return <ConnectionScreen onConnect={setCredentials} />
  return <ChatScreen key={activeChat?.chatId ?? 'empty'} client={client} activeChat={activeChat} onOpenChat={setActiveChat} onCloseChat={() => setActiveChat(null)} onDisconnect={() => {
    setActiveChat(null)
    setCredentials(null)
  }} />
}
