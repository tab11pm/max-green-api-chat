import type { IncomingMessage } from '../domain/notifications'

export interface TimelineMessage extends Omit<IncomingMessage, 'direction'> {
  id: string
  direction: 'incoming' | 'outgoing'
}

interface Props {
  messages: TimelineMessage[]
}

export default function MessageTimeline({ messages }: Props): React.JSX.Element {
  return (
    <div className="timeline-scroll" aria-label="История сообщений">
      {messages.length === 0 ? <p className="timeline-empty">Сообщений пока нет. Напишите первым.</p> : (
        <ol className="message-list" aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <li className={`message-item ${message.direction}`} key={message.id}>
              <div className="message-bubble">
                <span className="message-kind">{message.direction === 'incoming' ? 'Входящее сообщение' : 'Исходящее сообщение'}</span>
                <p>{message.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
