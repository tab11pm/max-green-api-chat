import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import Icon from './Icon'

interface Props {
  onSend: (text: string) => Promise<void>
}

const MAX_TEXTAREA_HEIGHT = 160

export default function Composer({ onSend }: Props): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const editVersion = useRef(0)
  const textarea = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (draft === '' && textarea.current) textarea.current.style.height = 'auto'
  }, [draft])

  function resize(element: HTMLTextAreaElement) {
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedVersion = editVersion.current
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    try {
      await onSend(text)
      setDraft((current) => editVersion.current === submittedVersion ? '' : current)
    } catch {
      setError('Не удалось отправить сообщение. Попробуйте снова.')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <label className="visually-hidden" htmlFor="message-draft">Сообщение</label>
      <div className="composer-row">
        <div className="field-control">
          <Icon name="chat" />
          <textarea ref={textarea} id="message-draft" rows={1} value={draft} onKeyDown={handleKeyDown} onChange={(event) => {
            editVersion.current += 1
            setDraft(event.target.value)
            setError('')
            resize(event.target)
          }} placeholder="Напишите сообщение" />
        </div>
        <button className="icon-button primary-button" type="submit" aria-label="Отправить" disabled={!draft.trim() || sending}><Icon name="send" /></button>
      </div>
      {sending && <p className="send-status" role="status">Отправка…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}
