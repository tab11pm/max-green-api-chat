import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Icon, { type IconName } from './Icon'

const names: IconName[] = ['plus', 'chat', 'logout', 'sun', 'moon', 'plug', 'shield', 'id-card', 'lock', 'phone', 'send', 'arrow-right', 'check-check', 'clock', 'more', 'close', 'search']

describe('Icon', () => {
  it('renders an aria-hidden svg at the default size', () => {
    const { container } = render(<Icon name="plus" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('width', '20')
    expect(svg).toHaveClass('icon')
  })

  it('renders every icon name with at least one path or shape', () => {
    for (const name of names) {
      const { container, unmount } = render(<Icon name={name} />)
      expect(container.querySelector('path, circle, rect, line, polyline')).not.toBeNull()
      unmount()
    }
  })

  it('applies the size modifier and merges className', () => {
    const { container } = render(<Icon name="send" size={24} className="extra" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('icon', 'icon-lg', 'extra')
    expect(svg).toHaveAttribute('width', '24')
  })
})
