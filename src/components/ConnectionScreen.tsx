import { useState, type FormEvent } from 'react'
import type { ConnectionCredentials } from '../api/greenApiClient'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

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
      <div className="shell-toolbar">
        <ThemeToggle />
      </div>
      <section className="connection-panel" aria-labelledby="connection-title">
        <div className="connection-head">
          <span className="brand-mark" aria-hidden="true">К</span>
          <div>
            <p className="eyebrow"><Icon name="plug" size={16} />GREEN-API · MAX</p>
            <p className="brand-wordmark">Кайтома</p>
          </div>
        </div>
        <div className="connection-body">
          <h1 id="connection-title">Подключение к GREEN-API</h1>
          <p className="intro">Подключите экземпляр, чтобы начать переписку.</p>
          <form className="connection-form" onSubmit={submit} noValidate>
            <label htmlFor="instance-id"><Icon name="id-card" size={16} />ID экземпляра</label>
            <div className="field-control">
              <Icon name="id-card" />
              <input id="instance-id" autoComplete="off" value={idInstance} onChange={(event) => setIdInstance(event.target.value)} aria-invalid={idError} aria-describedby={idError ? 'id-error' : undefined} />
            </div>
            {idError && <p className="field-error" id="id-error">Введите ID экземпляра</p>}
            <label htmlFor="api-token"><Icon name="lock" size={16} />Токен API</label>
            <div className="field-control">
              <Icon name="lock" />
              <input id="api-token" type="password" autoComplete="off" value={apiTokenInstance} onChange={(event) => setApiTokenInstance(event.target.value)} aria-invalid={tokenError} aria-describedby={tokenError ? 'token-error' : undefined} />
            </div>
            {tokenError && <p className="field-error" id="token-error">Введите токен API</p>}
            <button className="primary-button" type="submit">Продолжить<Icon name="arrow-right" /></button>
          </form>
        </div>
      </section>
    </main>
  )
}
