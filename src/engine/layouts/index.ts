import type { DeadKind, Finger, KeyDef, KeyPress, Layout, LayoutId } from './types'
import { ES, LATAM, LAYOUTS, LAYOUT_LIST, US } from './data'

export * from './types'
export { ES, LATAM, LAYOUTS, LAYOUT_LIST, US }

/** Base letter + dead key → composed character. */
const COMPOSE: Record<DeadKind, Record<string, string>> = {
  acute: { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' },
  grave: { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù' },
  diaeresis: { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü' },
  circumflex: { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', A: 'Â', E: 'Ê', I: 'Î', O: 'Ô', U: 'Û' },
  tilde: { n: 'ñ', N: 'Ñ', a: 'ã', o: 'õ' },
}

interface Resolved {
  direct: Map<string, KeyPress>
  dead: Map<DeadKind, KeyPress>
  byCode: Map<string, KeyDef>
}

const cache = new Map<LayoutId, Resolved>()

function press(key: KeyDef, shift: boolean, altGr: boolean, produces: string): KeyPress {
  return { code: key.code, finger: key.finger, shift, altGr, produces }
}

function build(layout: Layout): Resolved {
  const direct = new Map<string, KeyPress>()
  const dead = new Map<DeadKind, KeyPress>()
  const byCode = new Map<string, KeyDef>()
  for (const row of layout.rows) {
    for (const key of row) {
      byCode.set(key.code, key)
      if (key.base && !direct.has(key.base)) direct.set(key.base, press(key, false, false, key.base))
      if (key.shift && !direct.has(key.shift)) direct.set(key.shift, press(key, true, false, key.shift))
      if (key.altGr && !direct.has(key.altGr)) direct.set(key.altGr, press(key, false, true, key.altGr))
      if (key.dead && !dead.has(key.dead)) dead.set(key.dead, press(key, false, false, ''))
      if (key.shiftDead && !dead.has(key.shiftDead)) dead.set(key.shiftDead, press(key, true, false, ''))
    }
  }
  return { direct, dead, byCode }
}

function resolved(layout: Layout): Resolved {
  let r = cache.get(layout.id)
  if (!r) {
    r = build(layout)
    cache.set(layout.id, r)
  }
  return r
}

/**
 * Physical key presses needed to type `ch` on `layout`, or null if the
 * character cannot be produced. Composed characters (á, ü, …) become a
 * two-step sequence: dead key, then base letter.
 */
export function resolveChar(layout: Layout, ch: string): KeyPress[] | null {
  const r = resolved(layout)
  const d = r.direct.get(ch)
  if (d) return [d]
  for (const [kind, table] of Object.entries(COMPOSE) as [DeadKind, Record<string, string>][]) {
    const deadPress = r.dead.get(kind)
    if (!deadPress) continue
    for (const [base, composed] of Object.entries(table)) {
      if (composed !== ch) continue
      const basePress = r.direct.get(base)
      if (basePress) return [deadPress, basePress]
    }
  }
  return null
}

export function canType(layout: Layout, ch: string): boolean {
  return resolveChar(layout, ch) !== null
}

export function keyByCode(layout: Layout, code: string): KeyDef | undefined {
  return resolved(layout).byCode.get(code)
}

/** The finger that types `ch`, considering only the final (non-dead) press. */
export function fingerFor(layout: Layout, ch: string): Finger | null {
  const seq = resolveChar(layout, ch)
  return seq ? seq[seq.length - 1].finger : null
}

/** Which shift key to press for a given finger: always the opposite hand's pinky. */
export function shiftCodeFor(finger: Finger): 'ShiftLeft' | 'ShiftRight' {
  return finger.startsWith('L') ? 'ShiftRight' : 'ShiftLeft'
}

/** Char printed on the key without modifiers, or the shifted char if base is empty. */
export function keyLegend(key: KeyDef): string {
  if (key.label) return key.label
  return key.base
}

export function getLayout(id: LayoutId): Layout {
  return LAYOUTS[id]
}

/** Row of the key that types `ch` (final press): 0 = numbers, 1 = top, 2 = home, 3 = bottom, 4 = space row; null if untypeable. */
export function rowFor(layout: Layout, ch: string): number | null {
  const seq = resolveChar(layout, ch)
  if (!seq) return null
  const code = seq[seq.length - 1].code
  const i = layout.rows.findIndex((row) => row.some((k) => k.code === code))
  return i === -1 ? null : i
}
