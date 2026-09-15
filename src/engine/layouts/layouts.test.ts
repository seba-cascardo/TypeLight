import { describe, expect, it } from 'vitest'
import { ES, LATAM, US, canType, fingerFor, keyByCode, resolveChar, shiftCodeFor } from './index'

describe('layouts', () => {
  it('resolves plain letters to the right key and finger', () => {
    expect(resolveChar(US, 'f')).toEqual([{ code: 'KeyF', finger: 'LI', shift: false, altGr: false, produces: 'f' }])
    expect(resolveChar(LATAM, 'j')?.[0].finger).toBe('RI')
    expect(fingerFor(ES, 'a')).toBe('LP')
    expect(fingerFor(ES, 'ñ')).toBe('RP')
  })

  it('resolves shifted characters', () => {
    expect(resolveChar(US, 'F')).toEqual([{ code: 'KeyF', finger: 'LI', shift: true, altGr: false, produces: 'F' }])
    expect(resolveChar(US, ':')).toMatchObject([{ code: 'Semicolon', shift: true }])
    expect(resolveChar(LATAM, '?')).toMatchObject([{ code: 'Minus', shift: true }])
    expect(resolveChar(ES, '¿')).toMatchObject([{ code: 'Equal', shift: true }])
    expect(resolveChar(LATAM, '¿')).toMatchObject([{ code: 'Equal', shift: false }])
  })

  it('resolves AltGr characters', () => {
    expect(resolveChar(LATAM, '@')).toMatchObject([{ code: 'KeyQ', altGr: true }])
    expect(resolveChar(ES, '@')).toMatchObject([{ code: 'Digit2', altGr: true }])
    expect(resolveChar(ES, '€')).toMatchObject([{ code: 'KeyE', altGr: true }])
  })

  it('resolves accented letters as dead key + base on Spanish layouts', () => {
    const seq = resolveChar(LATAM, 'á')
    expect(seq).toHaveLength(2)
    expect(seq?.[0]).toMatchObject({ code: 'BracketLeft', shift: false, produces: '' })
    expect(seq?.[1]).toMatchObject({ code: 'KeyA', shift: false, produces: 'a' })

    expect(resolveChar(ES, 'é')?.[0]).toMatchObject({ code: 'Quote', shift: false })
    expect(resolveChar(ES, 'Ú')).toMatchObject([{ code: 'Quote' }, { code: 'KeyU', shift: true }])
    expect(resolveChar(LATAM, 'ü')).toMatchObject([{ code: 'BracketLeft', shift: true }, { code: 'KeyU' }])
  })

  it('reports untypable characters on the US layout', () => {
    expect(canType(US, 'ñ')).toBe(false)
    expect(canType(US, 'á')).toBe(false)
    expect(canType(US, 'a')).toBe(true)
    expect(canType(LATAM, 'ñ')).toBe(true)
  })

  it('exposes keys by code and home-row flags', () => {
    expect(keyByCode(US, 'KeyF')?.home).toBe(true)
    expect(keyByCode(ES, 'Semicolon')?.base).toBe('ñ')
    expect(keyByCode(US, 'KeyG')?.home).toBeUndefined()
  })

  it('uses the opposite pinky for shift', () => {
    expect(shiftCodeFor('LI')).toBe('ShiftRight')
    expect(shiftCodeFor('RP')).toBe('ShiftLeft')
  })

  it('has every key code mapped to a finger in all layouts', () => {
    for (const layout of [US, ES, LATAM]) {
      for (const row of layout.rows) for (const key of row) expect(key.finger).toBeTruthy()
    }
  })
})
