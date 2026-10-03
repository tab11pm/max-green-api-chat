export default function App(): React.JSX.Element {
  return (
    <main className="app-shell">
      <section className="connection-panel" aria-labelledby="connection-title">
        <p className="eyebrow">MAX чат</p>
        <h1 id="connection-title">Подключение к GREEN-API</h1>
        <p className="intro">Подключите экземпляр, чтобы начать переписку.</p>
      </section>
    </main>
  )
}
