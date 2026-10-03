import { describe, expect, it } from 'vitest'
import { formatTime } from './time'

describe('formatTime', () => {
  it('formats a timestamp as local HH:MM', () => {
    const date = new Date(2026, 9, 3, 9, 5)
    expect(formatTime(date.getTime() / 1000)).toBe('09:05')
  })

  it('returns a placeholder for missing or invalid timestamps', () => {
    expect(formatTime(undefined)).toBe('--:--')
    expect(formatTime(Number.NaN)).toBe('--:--')
  })
})
