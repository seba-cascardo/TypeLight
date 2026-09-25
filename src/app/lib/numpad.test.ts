import { describe, expect, it } from 'vitest'
import { NUMPAD, numpadVerdict, padCode, padFinger } from './numpad'

describe('number pad', () => {
  it('lets pad keys through and refuses the same characters from the main keyboard', () => {
    expect(numpadVerdict({ key: '4', code: 'Numpad4' })).toBe('ok')
    expect(numpadVerdict({ key: '+', code: 'NumpadAdd' })).toBe('ok')
    expect(numpadVerdict({ key: '4', code: 'Digit4' })).toBe('use-pad')
    expect(numpadVerdict({ key: '-', code: 'Slash' })).toBe('use-pad')
    expect(numpadVerdict({ key: '*', code: 'BracketRight' })).toBe('use-pad')
  })

  it('spots Num Lock off: the pad sends navigation keys instead of digits', () => {
    expect(numpadVerdict({ key: 'ArrowLeft', code: 'Numpad4' })).toBe('numlock')
    expect(numpadVerdict({ key: 'End', code: 'Numpad1' })).toBe('numlock')
    expect(numpadVerdict({ key: 'Clear', code: 'Numpad5' })).toBe('numlock')
  })

  it('leaves every other key alone: the space, Escape, letters', () => {
    expect(numpadVerdict({ key: ' ', code: 'Space' })).toBe('ok')
    expect(numpadVerdict({ key: 'Escape', code: 'Escape' })).toBe('ok')
    expect(numpadVerdict({ key: 'Enter', code: 'NumpadEnter' })).toBe('ok')
    expect(numpadVerdict({ key: 'a', code: 'KeyA' })).toBe('ok')
  })

  it('maps characters to pad keys and fingers of the right hand', () => {
    expect(padCode('0')).toBe('Numpad0')
    expect(padCode('/')).toBe('NumpadDivide')
    expect(padCode('a')).toBeUndefined()
    expect(['7', '4', '1'].map(padFinger)).toEqual(['RI', 'RI', 'RI'])
    expect(['/', '8', '5', '2'].map(padFinger)).toEqual(['RM', 'RM', 'RM', 'RM'])
    expect(['*', '9', '6', '3'].map(padFinger)).toEqual(['RR', 'RR', 'RR', 'RR'])
    expect(['-', '+'].map(padFinger)).toEqual(['RP', 'RP'])
    expect(padFinger('0')).toBe('RT')
    expect(NUMPAD.find((k) => k.code === 'Numpad5')?.home).toBe(true)
  })
})
