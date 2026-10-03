/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const code = html.match(/<script>([\s\S]*?kaitoma-theme[\s\S]*?)<\/script>/)?.[1] ?? ''

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('index.html theme bootstrap', () => {
  it('extracts the bootstrap script', () => {
    expect(code).toContain('kaitoma-theme')
  })

  it('applies a valid stored theme', () => {
    localStorage.setItem('kaitoma-theme', 'dark')
    new Function(code)()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('does not force light for a corrupted stored value and lets CSS/system decide', () => {
    localStorage.setItem('kaitoma-theme', 'purple')
    new Function(code)()
    expect(document.documentElement.dataset.theme ?? '').toBe('')
  })
})
