import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

afterEach(() => {
  vi.doUnmock('./migrate')
})

describe('guarded storage', () => {
  it('a saved state that cannot be parsed is never overwritten, and a copy is kept aside', async () => {
    localStorage.setItem('typelight.v1', '{nope')
    const { useStore } = await import('./index')
    const { isWriteBlocked, RESCUE_KEY } = await import('./storage')
    expect(isWriteBlocked()).toBe(true)
    useStore.getState().setSettings({ name: 'Otra' })
    expect(localStorage.getItem('typelight.v1')).toBe('{nope')
    expect(localStorage.getItem(RESCUE_KEY)).toBe('{nope')
  })

  it('a migration that throws also blocks the writes', async () => {
    vi.doMock('./migrate', () => ({
      migrateState: () => {
        throw new Error('boom')
      },
    }))
    const raw = JSON.stringify({ state: { settings: { name: 'Seba' } }, version: 7 })
    localStorage.setItem('typelight.v1', raw)
    const { useStore } = await import('./index')
    const { isWriteBlocked } = await import('./storage')
    expect(isWriteBlocked()).toBe(true)
    useStore.getState().setSettings({ name: 'Otra' })
    expect(localStorage.getItem('typelight.v1')).toBe(raw)
  })

  it('unblocking lets the next change through', async () => {
    localStorage.setItem('typelight.v1', '{nope')
    const { useStore } = await import('./index')
    const { unblockWrites, isWriteBlocked } = await import('./storage')
    unblockWrites()
    expect(isWriteBlocked()).toBe(false)
    useStore.getState().setSettings({ name: 'Nueva' })
    expect(JSON.parse(localStorage.getItem('typelight.v1')!).state.settings.name).toBe('Nueva')
  })

  it('a migration keeps the text it is about to rewrite', async () => {
    const raw = JSON.stringify({ state: { settings: { name: 'Seba', layoutId: 'latam', onboarded: true } }, version: 7 })
    localStorage.setItem('typelight.v1', raw)
    await import('./index')
    const { PRE_MIGRATION_KEY, isWriteBlocked } = await import('./storage')
    expect(isWriteBlocked()).toBe(false)
    expect(localStorage.getItem(PRE_MIGRATION_KEY)).toBe(raw)
    expect(JSON.parse(localStorage.getItem('typelight.v1')!).version).toBe(8)
  })

  it('an empty browser loads without blocking anything', async () => {
    await import('./index')
    const { isWriteBlocked } = await import('./storage')
    expect(isWriteBlocked()).toBe(false)
  })
})
