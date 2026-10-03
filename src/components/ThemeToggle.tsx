import { useState } from 'react'
import { resolveInitialTheme, toggleTheme, type Theme } from '../theme'
import Icon from './Icon'

export default function ThemeToggle(): React.JSX.Element {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)
  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      aria-label="Переключить тему"
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
      onClick={() => setTheme(toggleTheme())}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}
