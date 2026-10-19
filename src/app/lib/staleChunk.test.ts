import { describe, expect, it } from 'vitest'
import { isStaleChunkError, shouldReload } from './staleChunk'

describe('stale chunks after a deploy', () => {
  it('recognises a failed dynamic import in Chrome, Firefox and Safari, and nothing else', () => {
    expect(isStaleChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/Path-abc.js'))).toBe(true)
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module: https://x/assets/Path-abc.js'))).toBe(true)
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isStaleChunkError(new Error('Unable to preload CSS for /assets/Stats-abc.css'))).toBe(true)
    expect(isStaleChunkError(new TypeError("Cannot read properties of undefined (reading 'rows')"))).toBe(false)
    expect(isStaleChunkError(undefined)).toBe(false)
  })

  it('reloads once, not again within a minute: a real outage must not loop', () => {
    expect(shouldReload(null, 1_000_000)).toBe(true)
    expect(shouldReload(1_000_000, 1_030_000)).toBe(false)
    expect(shouldReload(1_000_000, 1_061_000)).toBe(true)
    expect(shouldReload(Number.NaN, 1_000_000)).toBe(true)
  })
})
