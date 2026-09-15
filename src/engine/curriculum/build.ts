import { canType, keyByCode, type Layout } from '../layouts'
import { explainChar } from './explain'
import { TIP_ACCENTS, TIP_BREAK, TIP_IDEAS, TIP_INTRO, TIP_NUMBERS, TIP_POSTURE, TIP_SHIFT, TIP_SPEED, type Tip } from './tips'
import type { Curriculum, ExerciseSpec, IntroCard, Lesson, LessonKind, Unit, UnitAccent } from './types'

const LOWER = 'abcdefghijklmnopqrstuvwxyzñ'

interface Builder {
  units: Unit[]
  lessons: Lesson[]
  pool: string[]
  index: number
}

function label(chars: string[]): string {
  const names = chars.map((c) => (c === ' ' ? 'espacio' : c))
  if (names.length === 1) return names[0]
  return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1]
}

/** Second exercise of a "Teclas" lesson: mix the new keys with everything learned. */
function reviewSpec(newChars: string[], pool: string[], tokens: number): ExerciseSpec {
  if (newChars.every((c) => /[0-9]/.test(c))) {
    const digits = pool.filter((c) => /[0-9]/.test(c))
    return { kind: 'numbers', pool, digits, tokens }
  }
  if (newChars.every((c) => !/[a-zñáéíóúü]/i.test(c))) return { kind: 'symbols', pool, symbols: newChars, tokens }
  return { kind: 'review', newChars, pool, tokens }
}

function unit(b: Builder, id: string, title: string, blurb: string, goalWpm: number, accent: UnitAccent): Unit {
  const u: Unit = { id, title, blurb, goalWpm, accent, lessons: [] }
  b.units.push(u)
  return u
}

function add(
  b: Builder,
  u: Unit,
  slug: string,
  title: string,
  kind: LessonKind,
  newChars: string[],
  intro: IntroCard[],
  exercises: ExerciseSpec[],
): Lesson {
  const lesson: Lesson = {
    id: `${u.id}-${slug}`,
    unitId: u.id,
    index: b.index++,
    title,
    kind,
    newChars,
    pool: [...b.pool],
    intro,
    exercises,
    goalWpm: u.goalWpm,
  }
  u.lessons.push(lesson)
  b.lessons.push(lesson)
  return lesson
}

function tip(b: Builder, u: Unit, t: Tip) {
  add(b, u, `tip-${t.id}`, t.title, 'tip', [], t.cards, [])
}

function slugOf(chars: string[]): string {
  return chars.map((c) => c.codePointAt(0)!.toString(16)).join('-')
}

/** The classic trio: Teclas → Repaso → Práctica. `steps: 2` skips the middle lesson. */
function keyTrio(
  b: Builder,
  layout: Layout,
  u: Unit,
  chars: string[],
  extra?: (pool: string[]) => ExerciseSpec[],
  steps: 2 | 3 = 3,
) {
  const learnable = chars.filter((c) => canType(layout, c))
  if (learnable.length === 0) return
  b.pool.push(...learnable)
  const pool = [...b.pool]
  const slug = slugOf(learnable)
  const name = label(learnable)
  const intro = learnable.map((c) => explainChar(layout, c))
  intro.push({
    title: 'A practicar',
    body: 'Tipeá el texto sin mirar el teclado. Si te equivocás, la letra se marca en rojo y esperás hasta acertar. Ojos en la pantalla, dedos en la fila guía.',
    highlight: learnable,
  })
  add(b, u, `${slug}-keys`, `Teclas ${name}`, 'keys', learnable, intro, [
    { kind: 'drill', chars: learnable },
    reviewSpec(learnable, pool, 12),
  ])
  if (steps === 3) {
    add(b, u, `${slug}-review`, `Repaso: ${name}`, 'review', [], [], [
      reviewSpec(learnable, pool, 14),
      { kind: 'words', pool, focus: learnable },
    ])
  }
  add(b, u, `${slug}-practice`, `Práctica: ${name}`, 'practice', [], [], extra ? extra(pool) : [
    { kind: 'words', pool, focus: learnable },
    { kind: 'words', pool, focus: learnable, count: 16 },
  ])
}

function unitReview(b: Builder, u: Unit, title: string, exercises: (pool: string[]) => ExerciseSpec[]) {
  add(b, u, 'unit-review', title, 'unit-review', [], [], exercises([...b.pool]))
}

const lowerPool = (pool: string[]) => pool.filter((c) => LOWER.includes(c) || 'áéíóúü'.includes(c))
const capsIn = (pool: string[]) => pool.filter((c) => c !== c.toLowerCase())

export function buildCurriculum(layout: Layout): Curriculum {
  const b: Builder = { units: [], lessons: [], pool: [], index: 0 }
  const isSpanish = layout.id !== 'us'
  const homePinky = keyByCode(layout, 'Semicolon')!.base // ';' or 'ñ'
  const slashKey = keyByCode(layout, 'Slash')!
  const bottomPinky = slashKey.base // '/' or '-'

  // ───────── Fila guía ─────────
  const guia = unit(b, 'guia', 'Fila guía', 'Las ocho teclas donde descansan los dedos. Todo empieza acá.', 10, 'green')
  tip(b, guia, TIP_INTRO)
  keyTrio(b, layout, guia, ['f', 'j'])
  add(b, guia, 'space', 'La barra espaciadora', 'keys', [' '], [explainChar(layout, ' ')], [
    { kind: 'drill', chars: ['f', 'j'], tokens: 16 },
  ])
  keyTrio(b, layout, guia, ['d', 'k'])
  keyTrio(b, layout, guia, ['s', 'l'])
  keyTrio(b, layout, guia, ['a', homePinky])
  tip(b, guia, TIP_POSTURE)
  keyTrio(b, layout, guia, ['g', 'h'])
  unitReview(b, guia, 'Repaso: fila guía', (pool) => [
    { kind: 'review', newChars: pool, pool, tokens: 16 },
    { kind: 'words', pool, count: 16 },
    { kind: 'words', pool, count: 16 },
  ])

  // ───────── Fila superior ─────────
  const sup = unit(b, 'superior', 'Fila superior', 'Los dedos suben una fila y vuelven. Aparecen las vocales que faltaban.', 12, 'blue')
  keyTrio(b, layout, sup, ['r', 'u'])
  keyTrio(b, layout, sup, ['e', 'i'])
  tip(b, sup, TIP_IDEAS)
  keyTrio(b, layout, sup, ['w', 'o'])
  keyTrio(b, layout, sup, ['q', 'y'])
  keyTrio(b, layout, sup, ['t', 'p'])
  unitReview(b, sup, 'Repaso: fila guía y superior', (pool) => [
    { kind: 'words', pool, count: 16 },
    { kind: 'words', pool, count: 18 },
    { kind: 'words', pool, count: 20 },
  ])

  // ───────── Fila inferior ─────────
  const inf = unit(b, 'inferior', 'Fila inferior', 'Los dedos bajan. Con esta fila completás el alfabeto.', 15, 'coral')
  keyTrio(b, layout, inf, ['v', 'm'])
  keyTrio(b, layout, inf, ['c', ','])
  keyTrio(b, layout, inf, ['x', '.'])
  keyTrio(b, layout, inf, ['z', bottomPinky])
  tip(b, inf, TIP_BREAK)
  keyTrio(b, layout, inf, ['b', 'n'])
  unitReview(b, inf, 'Repaso: todo el alfabeto', (pool) => [
    { kind: 'words', pool, count: 18 },
    { kind: 'words', pool, count: 20 },
    { kind: 'words', pool, count: 22 },
  ])

  // ───────── Patrones comunes ─────────
  const pat = unit(b, 'patrones', 'Patrones del español', 'Las combinaciones que más se repiten. Dominarlas es la mitad de la velocidad.', 18, 'mint')
  for (const pattern of ['que', 'ent', 'ado', 'con', 'est', 'ien', 'mente', 'nte', 'los', 'para']) {
    const pool = [...b.pool]
    add(b, pat, `patron-${slugOf([...pattern])}`, `Patrón: ${pattern}`, 'practice', [], [], [
      { kind: 'pattern', pool, pattern, count: 12 },
      { kind: 'pattern', pool, pattern, count: 14 },
      { kind: 'words', pool, count: 16 },
    ])
  }

  // ───────── Mayúsculas ─────────
  const may = unit(b, 'mayusculas', 'Mayúsculas', 'Shift con la mano contraria. Empiezan las frases de verdad.', 18, 'sun')
  tip(b, may, TIP_SHIFT)
  const capGroups: string[][] = [
    ['F', 'J', 'D', 'K'],
    ['S', 'L', 'A', ...(isSpanish ? ['Ñ'] : [])],
    ['G', 'H', 'T', 'Y'],
    ['R', 'U', 'E', 'I'],
    ['W', 'O', 'Q', 'P'],
    ['V', 'M', 'C', 'N'],
    ['X', 'B', 'Z'],
  ]
  for (const group of capGroups) {
    keyTrio(b, layout, may, group, (pool) => [
      { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), focus: group, count: 14 },
      { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), focus: group, count: 16 },
    ], 2)
  }
  unitReview(b, may, 'Repaso: mayúsculas', (pool) => [
    { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), count: 18 },
    { kind: 'sentences', pool, count: 2 },
    { kind: 'sentences', pool, count: 2 },
  ])

  // ───────── Acentos (solo teclados en español) ─────────
  if (isSpanish) {
    const acc = unit(b, 'acentos', 'Tildes y diéresis', 'La tecla muerta: dos toques, una letra.', 18, 'lavender')
    tip(b, acc, TIP_ACCENTS)
    keyTrio(b, layout, acc, ['á', 'é'])
    keyTrio(b, layout, acc, ['í', 'ó'])
    keyTrio(b, layout, acc, ['ú', 'ü'])
    keyTrio(b, layout, acc, ['Á', 'É', 'Í', 'Ó', 'Ú'], (pool) => [
      { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), focus: ['Á', 'É', 'Í', 'Ó', 'Ú'], count: 14 },
      { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), focus: ['Á', 'É', 'Í', 'Ó', 'Ú'], count: 16 },
    ], 2)
    unitReview(b, acc, 'Repaso: tildes', (pool) => [
      { kind: 'words', pool: lowerPool(pool), capitals: capsIn(pool), focus: ['á', 'é', 'í', 'ó', 'ú'], count: 18 },
      { kind: 'sentences', pool, count: 2 },
      { kind: 'sentences', pool, count: 2 },
    ])
  }

  // ───────── Números ─────────
  const num = unit(b, 'numeros', 'Números', 'Dos filas arriba. Cada dedo sube en diagonal a su número.', 15, 'mint')
  tip(b, num, TIP_NUMBERS)
  const digitPairs = [['4', '7'], ['3', '8'], ['2', '9'], ['1', '0'], ['5', '6']]
  const learnedDigits: string[] = []
  for (const pair of digitPairs) {
    learnedDigits.push(...pair)
    const digits = [...learnedDigits]
    keyTrio(b, layout, num, pair, (pool) => [
      { kind: 'numbers', pool, digits, tokens: 14 },
      { kind: 'numbers', pool, digits, tokens: 16 },
    ])
  }
  unitReview(b, num, 'Repaso: números', (pool) => [
    { kind: 'numbers', pool, digits: [...learnedDigits], tokens: 18 },
    { kind: 'sentences', pool, corpus: 'numbers', count: 2 },
    { kind: 'sentences', pool, corpus: 'numbers', count: 3 },
  ])

  // ───────── Signos ─────────
  const sig = unit(b, 'signos', 'Signos y símbolos', 'Puntuación, paréntesis, comillas y los símbolos que usás todos los días.', 15, 'coral')
  const symbolPairs: string[][] = isSpanish
    ? [['¿', '?'], ['¡', '!'], [':', ';'], ['"', "'"], ['(', ')'], ['_', '='], ['+', '*'], ['@', '#'], ['$', '%'], ['&', '/']]
    : [["'", '"'], ['?', '!'], ['(', ')'], ['-', '_'], ['=', '+'], ['@', '#'], ['$', '%'], ['&', '*'], ['[', ']'], ['{', '}'], ['<', '>'], ['\\', '|']]
  for (const pair of symbolPairs) {
    keyTrio(b, layout, sig, pair, (pool) => [
      { kind: 'symbols', pool, symbols: pair, tokens: 14 },
      { kind: 'symbols', pool, symbols: pair, tokens: 16 },
    ], 2)
  }
  unitReview(b, sig, 'Repaso: signos', (pool) => [
    { kind: 'symbols', pool, symbols: symbolPairs.flat(), tokens: 18 },
    { kind: 'sentences', pool, corpus: 'symbols', count: 2 },
    { kind: 'sentences', pool, corpus: 'symbols', count: 3 },
  ])

  // ───────── Velocidad ─────────
  const goals = [25, 28, 31, 34, 37, 40, 45, 50]
  const vel = unit(b, 'velocidad', 'Velocidad', 'Texto real, metas crecientes. La precisión manda.', goals[0], 'green')
  tip(b, vel, TIP_SPEED)
  goals.forEach((goal, i) => {
    const pool = [...b.pool]
    const l = add(b, vel, `texto-${i + 1}`, `Texto ${i + 1} · meta ${goal} PPM`, 'text', [], [], [
      { kind: 'sentences', pool, count: 2 },
      { kind: 'sentences', pool, count: 2, corpus: i % 3 === 1 ? 'numbers' : i % 3 === 2 ? 'symbols' : 'general' },
      { kind: 'sentences', pool, count: 3 },
    ])
    l.goalWpm = goal
  })

  const byId = new Map(b.lessons.map((l) => [l.id, l]))
  return { units: b.units, lessons: b.lessons, byId }
}
