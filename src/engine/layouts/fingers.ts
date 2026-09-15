import type { Finger } from './types'

/** Finger assignment by physical key code. Shared by every QWERTY-family layout. */
export const FINGER_BY_CODE: Record<string, Finger> = {
  Backquote: 'LP', Digit1: 'LP', KeyQ: 'LP', KeyA: 'LP', KeyZ: 'LP', IntlBackslash: 'LP',
  Tab: 'LP', CapsLock: 'LP', ShiftLeft: 'LP',
  Digit2: 'LR', KeyW: 'LR', KeyS: 'LR', KeyX: 'LR',
  Digit3: 'LM', KeyE: 'LM', KeyD: 'LM', KeyC: 'LM',
  Digit4: 'LI', Digit5: 'LI', KeyR: 'LI', KeyT: 'LI', KeyF: 'LI', KeyG: 'LI', KeyV: 'LI', KeyB: 'LI',
  Digit6: 'RI', Digit7: 'RI', KeyY: 'RI', KeyU: 'RI', KeyH: 'RI', KeyJ: 'RI', KeyN: 'RI', KeyM: 'RI',
  Digit8: 'RM', KeyI: 'RM', KeyK: 'RM', Comma: 'RM',
  Digit9: 'RR', KeyO: 'RR', KeyL: 'RR', Period: 'RR',
  Digit0: 'RP', Minus: 'RP', Equal: 'RP', Backspace: 'RP', KeyP: 'RP', BracketLeft: 'RP',
  BracketRight: 'RP', Backslash: 'RP', Semicolon: 'RP', Quote: 'RP', Enter: 'RP', Slash: 'RP',
  ShiftRight: 'RP',
  Space: 'RT',
}

export const HOME_CODES = new Set(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'])
