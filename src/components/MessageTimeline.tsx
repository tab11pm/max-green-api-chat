import type { IncomingMessage } from '../domain/notifications'
import { formatTime } from '../domain/time'
import Icon from './Icon'

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
              <div className={`message-bubble ${message.direction === 'incoming' ? 'bubble-in' : 'bubble-out'}`}>
                <span className="message-kind visually-hidden">{message.direction === 'incoming' ? 'Входящее сообщение' : 'Исходящее сообщение'}</span>
                <p>{message.text}</p>
                <span className="meta">
                  {message.direction === 'incoming' ? <Icon name="clock" size={16} /> : null}
                  {formatTime(message.timestamp)}
                  {message.direction === 'outgoing' ? <Icon name="check-check" size={16} /> : null}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
