import type { KeyDef, Layout } from './types'
import { FINGER_BY_CODE, HOME_CODES } from './fingers'

type Spec = Omit<KeyDef, 'finger' | 'home'>

function k(spec: Spec): KeyDef {
  const finger = FINGER_BY_CODE[spec.code]
  if (!finger) throw new Error(`No finger for ${spec.code}`)
  return { ...spec, finger, home: HOME_CODES.has(spec.code) || undefined }
}

const letters = (codes: string) =>
  codes.split(' ').map((c) => k({ code: `Key${c}`, base: c.toLowerCase(), shift: c }))

const TAB = k({ code: 'Tab', base: '', label: 'Tab', width: 1.5 })
const CAPS = k({ code: 'CapsLock', base: '', label: 'Mayús', width: 1.75 })
const BACKSPACE = k({ code: 'Backspace', base: '', label: '⌫', width: 2 })
const ENTER_ANSI = k({ code: 'Enter', base: '', label: 'Enter', width: 2.25 })
const ENTER_ISO = k({ code: 'Enter', base: '', label: 'Enter', width: 1.25 })
const SHIFT_L_ANSI = k({ code: 'ShiftLeft', base: '', label: 'Shift', width: 2.25 })
const SHIFT_L_ISO = k({ code: 'ShiftLeft', base: '', label: 'Shift', width: 1.25 })
const SHIFT_R = k({ code: 'ShiftRight', base: '', label: 'Shift', width: 2.75 })
const SPACE = k({ code: 'Space', base: ' ', label: 'espacio', width: 6.25 })

export const US: Layout = {
  id: 'us',
  name: 'Inglés (US)',
  hint: 'A la derecha de la L hay un punto y coma (;)',
  rows: [
    [
      k({ code: 'Backquote', base: '`', shift: '~' }),
      k({ code: 'Digit1', base: '1', shift: '!' }),
      k({ code: 'Digit2', base: '2', shift: '@' }),
      k({ code: 'Digit3', base: '3', shift: '#' }),
      k({ code: 'Digit4', base: '4', shift: '$' }),
      k({ code: 'Digit5', base: '5', shift: '%' }),
      k({ code: 'Digit6', base: '6', shift: '^' }),
      k({ code: 'Digit7', base: '7', shift: '&' }),
      k({ code: 'Digit8', base: '8', shift: '*' }),
      k({ code: 'Digit9', base: '9', shift: '(' }),
      k({ code: 'Digit0', base: '0', shift: ')' }),
      k({ code: 'Minus', base: '-', shift: '_' }),
      k({ code: 'Equal', base: '=', shift: '+' }),
      BACKSPACE,
    ],
    [
      TAB,
      ...letters('Q W E R T Y U I O P'),
      k({ code: 'BracketLeft', base: '[', shift: '{' }),
      k({ code: 'BracketRight', base: ']', shift: '}' }),
      k({ code: 'Backslash', base: '\\', shift: '|', width: 1.5 }),
    ],
    [
      CAPS,
      ...letters('A S D F G H J K L'),
      k({ code: 'Semicolon', base: ';', shift: ':' }),
      k({ code: 'Quote', base: "'", shift: '"' }),
      ENTER_ANSI,
    ],
    [
      SHIFT_L_ANSI,
      ...letters('Z X C V B N M'),
      k({ code: 'Comma', base: ',', shift: '<' }),
      k({ code: 'Period', base: '.', shift: '>' }),
      k({ code: 'Slash', base: '/', shift: '?' }),
      SHIFT_R,
    ],
    [SPACE],
  ],
}

export const ES: Layout = {
  id: 'es',
  name: 'Español (España)',
  hint: 'A la derecha de la L está la ñ, y más a la derecha la ç',
  rows: [
    [
      k({ code: 'Backquote', base: 'º', shift: 'ª', altGr: '\\' }),
      k({ code: 'Digit1', base: '1', shift: '!', altGr: '|' }),
      k({ code: 'Digit2', base: '2', shift: '"', altGr: '@' }),
      k({ code: 'Digit3', base: '3', shift: '·', altGr: '#' }),
      k({ code: 'Digit4', base: '4', shift: '$', altGr: '~' }),
      k({ code: 'Digit5', base: '5', shift: '%' }),
      k({ code: 'Digit6', base: '6', shift: '&', altGr: '¬' }),
      k({ code: 'Digit7', base: '7', shift: '/' }),
      k({ code: 'Digit8', base: '8', shift: '(' }),
      k({ code: 'Digit9', base: '9', shift: ')' }),
      k({ code: 'Digit0', base: '0', shift: '=' }),
      k({ code: 'Minus', base: "'", shift: '?' }),
      k({ code: 'Equal', base: '¡', shift: '¿' }),
      BACKSPACE,
    ],
    [
      TAB,
      ...letters('Q W'),
      k({ code: 'KeyE', base: 'e', shift: 'E', altGr: '€' }),
      ...letters('R T Y U I O P'),
      k({ code: 'BracketLeft', base: '', dead: 'grave', shiftDead: 'circumflex', altGr: '[', label: '`^' }),
      k({ code: 'BracketRight', base: '+', shift: '*', altGr: ']' }),
      ENTER_ISO,
    ],
    [
      CAPS,
      ...letters('A S D F G H J K L'),
      k({ code: 'Semicolon', base: 'ñ', shift: 'Ñ' }),
      k({ code: 'Quote', base: '', dead: 'acute', shiftDead: 'diaeresis', altGr: '{', label: '´¨' }),
      k({ code: 'Backslash', base: 'ç', shift: 'Ç', altGr: '}' }),
    ],
    [
      SHIFT_L_ISO,
      k({ code: 'IntlBackslash', base: '<', shift: '>' }),
      ...letters('Z X C V B N M'),
      k({ code: 'Comma', base: ',', shift: ';' }),
      k({ code: 'Period', base: '.', shift: ':' }),
      k({ code: 'Slash', base: '-', shift: '_' }),
      SHIFT_R,
    ],
    [SPACE],
  ],
}

export const LATAM: Layout = {
  id: 'latam',
  name: 'Español (Latinoamérica)',
  hint: 'A la derecha de la L está la ñ, y más a la derecha la llave {',
  rows: [
    [
      k({ code: 'Backquote', base: '|', shift: '°', altGr: '¬' }),
      k({ code: 'Digit1', base: '1', shift: '!' }),
      k({ code: 'Digit2', base: '2', shift: '"' }),
      k({ code: 'Digit3', base: '3', shift: '#' }),
      k({ code: 'Digit4', base: '4', shift: '$' }),
      k({ code: 'Digit5', base: '5', shift: '%' }),
      k({ code: 'Digit6', base: '6', shift: '&' }),
      k({ code: 'Digit7', base: '7', shift: '/' }),
      k({ code: 'Digit8', base: '8', shift: '(' }),
      k({ code: 'Digit9', base: '9', shift: ')' }),
      k({ code: 'Digit0', base: '0', shift: '=' }),
      k({ code: 'Minus', base: "'", shift: '?', altGr: '\\' }),
      k({ code: 'Equal', base: '¿', shift: '¡' }),
      BACKSPACE,
    ],
    [
      TAB,
      k({ code: 'KeyQ', base: 'q', shift: 'Q', altGr: '@' }),
      ...letters('W E R T Y U I O P'),
      k({ code: 'BracketLeft', base: '', dead: 'acute', shiftDead: 'diaeresis', label: '´¨' }),
      k({ code: 'BracketRight', base: '+', shift: '*', altGr: '~' }),
      ENTER_ISO,
    ],
    [
      CAPS,
      ...letters('A S D F G H J K L'),
      k({ code: 'Semicolon', base: 'ñ', shift: 'Ñ' }),
      k({ code: 'Quote', base: '{', shift: '[', altGr: '^' }),
      k({ code: 'Backslash', base: '}', shift: ']', altGr: '`' }),
    ],
    [
      SHIFT_L_ISO,
      k({ code: 'IntlBackslash', base: '<', shift: '>' }),
      ...letters('Z X C V B N M'),
      k({ code: 'Comma', base: ',', shift: ';' }),
      k({ code: 'Period', base: '.', shift: ':' }),
      k({ code: 'Slash', base: '-', shift: '_' }),
      SHIFT_R,
    ],
    [SPACE],
  ],
}

export const LAYOUTS: Record<Layout['id'], Layout> = { us: US, es: ES, latam: LATAM }
export const LAYOUT_LIST: Layout[] = [LATAM, ES, US]
