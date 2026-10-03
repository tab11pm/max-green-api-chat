import { useRef, useState, type FormEvent } from 'react'

interface Props {
  onSend: (text: string) => Promise<void>
}

export default function Composer({ onSend }: Props): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const editVersion = useRef(0)

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

  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="message-draft">Сообщение</label>
      <div className="composer-row">
        <textarea id="message-draft" rows={2} value={draft} onChange={(event) => {
          editVersion.current += 1
          setDraft(event.target.value)
          setError('')
        }} placeholder="Напишите сообщение" />
        <button className="primary-button" type="submit" disabled={!draft.trim() || sending}>Отправить</button>
      </div>
      {sending && <p className="send-status" role="status">Отправка…</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}
