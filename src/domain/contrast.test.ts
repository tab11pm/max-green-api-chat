/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8')

function block(startMarker: string, endMarker: string): string {
  const start = css.indexOf(startMarker)
  const end = css.indexOf(endMarker, start)
  return css.slice(start, end)
}

const light = block(':root {', ':root[data-theme')
const darkStart = css.search(/:root\[data-theme=["']?dark["']?\]/)
const dark = css.slice(darkStart, css.indexOf('@media', darkStart))

function token(text: string, name: string): string {
  const match = text.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`missing token ${name}`)
  return match[1]
}

function gradientStops(text: string): string[] {
  const declaration = text.match(/--k-gradient:[^;]*/)
  return declaration ? [...declaration[0].matchAll(/#[0-9a-fA-F]{6}/g)].map((match) => match[0]) : []
}

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

describe('color contrast (WCAG AA, >= 4.5:1)', () => {
  it('keeps white text readable on every light gradient stop', () => {
    const stops = gradientStops(light)
    expect(stops.length).toBeGreaterThan(0)
    for (const stop of stops) expect(contrast(stop, '#ffffff'), stop).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps white text readable on every dark gradient stop', () => {
    const stops = gradientStops(dark)
    expect(stops.length).toBeGreaterThan(0)
    for (const stop of stops) expect(contrast(stop, '#ffffff'), stop).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps accent and muted text readable on surfaces in both themes', () => {
    for (const theme of [light, dark]) {
      expect(contrast(token(theme, '--k-accent'), token(theme, '--k-surface'))).toBeGreaterThanOrEqual(4.5)
      expect(contrast(token(theme, '--k-muted'), token(theme, '--k-surface'))).toBeGreaterThanOrEqual(4.5)
    }
  })
})
