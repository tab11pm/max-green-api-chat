import { useState, type FormEvent } from 'react'
import type { ConnectionCredentials } from '../api/greenApiClient'

interface Props {
  onConnect: (credentials: ConnectionCredentials) => void
}

export default function ConnectionScreen({ onConnect }: Props): React.JSX.Element {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const idError = submitted && !idInstance.trim()
  const tokenError = submitted && !apiTokenInstance.trim()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (!idInstance.trim() || !apiTokenInstance.trim()) return
    onConnect({ idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() })
  }

  return (
    <main className="app-shell connection-shell">
      <section className="connection-panel" aria-labelledby="connection-title">
        <p className="eyebrow">WhatsApp чат</p>
        <h1 id="connection-title">Подключение к GREEN-API</h1>
        <p className="intro">Подключите экземпляр, чтобы начать переписку.</p>
        <form className="connection-form" onSubmit={submit} noValidate>
          <label htmlFor="instance-id">ID экземпляра</label>
          <input id="instance-id" autoComplete="off" value={idInstance} onChange={(event) => setIdInstance(event.target.value)} aria-invalid={idError} aria-describedby={idError ? 'id-error' : undefined} />
          {idError && <p className="field-error" id="id-error">Введите ID экземпляра</p>}
          <label htmlFor="api-token">Токен API</label>
          <input id="api-token" type="password" autoComplete="off" value={apiTokenInstance} onChange={(event) => setApiTokenInstance(event.target.value)} aria-invalid={tokenError} aria-describedby={tokenError ? 'token-error' : undefined} />
          {tokenError && <p className="field-error" id="token-error">Введите токен API</p>}
          <button className="primary-button" type="submit">Продолжить</button>
        </form>
      </section>
    </main>
  )
}
