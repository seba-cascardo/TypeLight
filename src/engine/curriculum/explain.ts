import { FINGER_NAMES, keyByCode, resolveChar, shiftCodeFor, type Finger, type KeyPress, type Layout } from '../layouts'
import type { IntroCard } from './types'

const HOME_OF: Partial<Record<Finger, string>> = {
  LP: 'KeyA', LR: 'KeyS', LM: 'KeyD', LI: 'KeyF', RI: 'KeyJ', RM: 'KeyK', RR: 'KeyL', RP: 'Semicolon',
}

const ROW_NAMES = ['la fila de números', 'la fila superior', 'la fila guía', 'la fila inferior', 'la barra']

function rowIndexOf(layout: Layout, code: string): number {
  return layout.rows.findIndex((row) => row.some((k) => k.code === code))
}

function colIndexOf(layout: Layout, code: string): number {
  for (const row of layout.rows) {
    let x = 0
    for (const k of row) {
      if (k.code === code) return x + (k.width ?? 1) / 2
      x += k.width ?? 1
    }
  }
  return 0
}

function keyName(ch: string): string {
  if (ch === ' ') return 'la barra espaciadora'
  return `la tecla ${ch}`
}

/** Describe how the finger travels from its resting key to `press`. */
function movement(layout: Layout, press: KeyPress): string {
  const finger = press.finger
  const home = HOME_OF[finger]
  const fingerName = FINGER_NAMES[finger]
  if (press.code === 'Space') return `Presionala con el pulgar, sin mover el resto de la mano.`
  if (!home) return `Se presiona con el ${fingerName}.`
  if (press.code === home) {
    return `Es una tecla de la fila guía: el ${fingerName} ya está apoyado ahí. Solo tenés que presionar sin mirar.`
  }
  const homeKey = keyByCode(layout, home)
  const rowFrom = rowIndexOf(layout, home)
  const rowTo = rowIndexOf(layout, press.code)
  const dx = colIndexOf(layout, press.code) - colIndexOf(layout, home)
  const dy = rowTo - rowFrom
  const homeLegend = homeKey?.base ?? ''
  const parts: string[] = []
  if (dy < 0) parts.push(dy === -1 ? 'sube una fila' : `sube ${-dy} filas hasta ${ROW_NAMES[rowTo]}`)
  if (dy > 0) parts.push('baja una fila')
  if (Math.abs(dx) >= 0.75) {
    const side = finger.startsWith('L') ? (dx > 0 ? 'hacia el centro' : 'hacia afuera') : dx < 0 ? 'hacia el centro' : 'hacia afuera'
    parts.push(dy === 0 ? `se estira ${side}` : side)
  }
  const move = parts.length ? parts.join(', ') : 'se mueve apenas'
  return `El ${fingerName} ${move} desde la ${homeLegend}, presiona y vuelve enseguida a la ${homeLegend}.`
}

/** One intro card explaining how to type `ch` on this layout. */
export function explainChar(layout: Layout, ch: string): IntroCard {
  const seq = resolveChar(layout, ch)
  if (!seq) {
    return { title: ch, body: 'Este carácter no se puede escribir en tu teclado.', highlight: [ch] }
  }
  const last = seq[seq.length - 1]
  const fingerName = FINGER_NAMES[last.finger]
  const lines: string[] = []

  if (seq.length === 2) {
    const dead = seq[0]
    const deadFinger = FINGER_NAMES[dead.finger]
    lines.push(
      `La ${ch} se escribe en dos pasos. Primero presioná la tecla de tilde${dead.shift ? ' con Shift (¨)' : ' (´)'} con el ${deadFinger}: no aparece nada todavía, es una tecla “muerta” que espera la letra.`,
    )
    lines.push(`Después presioná la ${last.produces} con el ${fingerName} y aparece la ${ch}.`)
    return { title: ch, body: lines.join(' '), highlight: [ch] }
  }

  if (last.shift) {
    const shiftSide = shiftCodeFor(last.finger) === 'ShiftLeft' ? 'izquierdo' : 'derecho'
    lines.push(
      `La ${ch} lleva Shift. Mantené apretado el Shift ${shiftSide} con el meñique ${shiftSide} (siempre la mano contraria a la que escribe la letra) y presioná la ${last.produces.toLowerCase()} con el ${fingerName}.`,
    )
    lines.push('Soltá Shift antes de la siguiente tecla.')
    return { title: ch, body: lines.join(' '), highlight: [ch] }
  }

  if (last.altGr) {
    lines.push(
      `La ${ch} está en la tercera posición de su tecla. Mantené apretado Alt Gr (a la derecha de la barra) con el pulgar derecho y presioná la tecla con el ${fingerName}.`,
    )
    return { title: ch, body: lines.join(' '), highlight: [ch] }
  }

  lines.push(`${capitalize(keyName(ch))} se presiona con el ${fingerName}.`)
  lines.push(movement(layout, last))
  return { title: ch === ' ' ? 'espacio' : ch, body: lines.join(' '), highlight: [ch] }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
