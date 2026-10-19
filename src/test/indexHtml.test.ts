/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync('index.html', 'utf8')
const meta = (attr: string, name: string) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`))?.[1]
const SITE = 'https://seba-cascardo.github.io/TypeLight/'

describe('index.html', () => {
  it('describes the app for a link preview (WhatsApp, Telegram, search) with an absolute image that exists', () => {
    expect(meta('name', 'description')).toMatch(/mecanografía/i)
    expect(meta('property', 'og:title')).toBe('TypeLight')
    expect(meta('property', 'og:description')).toBeTruthy()
    expect(meta('property', 'og:url')).toBe(SITE)
    expect(meta('property', 'og:locale')).toBe('es_ES')
    const image = meta('property', 'og:image')!
    expect(image.startsWith(SITE)).toBe(true)
    expect(existsSync(`public/${image.slice(SITE.length)}`)).toBe(true)
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
    expect(html).toMatch(/<link rel="apple-touch-icon" href="\/apple-touch-icon.png"/)
    expect(existsSync('public/apple-touch-icon.png')).toBe(true)
  })
})
