import { useEffect, useRef, useState, type FormEvent } from 'react'
import { normalizePhone } from '../domain/phone'
import type { GreenApiClient } from '../hooks/useNotifications'
import type { ActiveChat } from './ChatScreen'

interface Props {
  client: GreenApiClient
  onClose: () => void
  onOpenChat: (chat: ActiveChat) => void
}

export default function NewChatDialog({ client, onClose, onOpenChat }: Props): React.JSX.Element {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const cancelled = useRef(false)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => () => { cancelled.current = true }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checking) return
    const normalized = normalizePhone(phone)
    if (!normalized) {
      setError('Введите номер в международном формате: +7 или +375 и остальные цифры.')
      return
    }
    setError('')
    setChecking(true)
    try {
      const chatId = await client.checkAccount(normalized)
      if (cancelled.current) return
      if (chatId) onOpenChat({ chatId, phone: phone.trim() })
      else setError('Этот номер не зарегистрирован в MAX. Проверьте номер и попробуйте снова.')
    } catch {
      if (!cancelled.current) setError('Не удалось проверить номер. Проверьте подключение и попробуйте снова.')
    } finally {
      if (!cancelled.current) setChecking(false)
    }
  }

  function close() {
    cancelled.current = true
    onClose()
  }

  return (
    <div className="dialog-backdrop">
      <section ref={dialog} className="new-chat-dialog" role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onKeyDown={(event) => {
        if (event.key === 'Escape') close()
        if (event.key === 'Tab') {
          const controls = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
          if (!controls?.length) return
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }}>
        <button className="dialog-close" type="button" aria-label="Закрыть окно" onClick={close}>×</button>
        <h2 id="new-chat-title">Новый чат</h2>
        <p>Введите номер человека, с которым хотите переписываться в MAX.</p>
        <form onSubmit={submit} noValidate>
          <label htmlFor="recipient-phone">Номер получателя</label>
          <input id="recipient-phone" type="tel" inputMode="tel" autoComplete="off" autoFocus placeholder="+7 999 123-45-67" value={phone} onChange={(event) => {
            setPhone(event.target.value)
            setError('')
          }} aria-invalid={Boolean(error)} aria-describedby={error ? 'phone-error' : 'phone-hint'} />
          <p className="field-hint" id="phone-hint">Подойдут номера России и Беларуси.</p>
          {error && <p className="field-error" id="phone-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={close}>Отмена</button>
            <button className="primary-button" type="submit" disabled={checking}>{checking ? 'Проверка…' : 'Открыть чат'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
