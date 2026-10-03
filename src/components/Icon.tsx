export type IconName =
  | 'plus'
  | 'chat'
  | 'logout'
  | 'sun'
  | 'moon'
  | 'plug'
  | 'shield'
  | 'id-card'
  | 'lock'
  | 'phone'
  | 'send'
  | 'arrow-right'
  | 'check-check'
  | 'clock'
  | 'more'
  | 'close'
  | 'search'

interface IconProps {
  name: IconName
  size?: 16 | 20 | 24
  className?: string
}

const registry: Record<IconName, React.ReactNode> = {
  plus: <path d="M5 12h14M12 5v14" />,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  plug: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  'id-card': <><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M6 15h6M14 9h4M14 13h4" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />,
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />,
  'arrow-right': <path d="M5 12h14M12 5l7 7-7 7" />,
  'check-check': <path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  more: <><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></>,
}

export default function Icon({ name, size = 20, className }: IconProps): React.JSX.Element {
  const sizeClass = size === 16 ? 'icon-sm' : size === 24 ? 'icon-lg' : ''
  return (
    <svg
      className={['icon', sizeClass, className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {registry[name]}
    </svg>
  )
}
