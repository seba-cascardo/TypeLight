import { canType, keyByCode, type Layout } from '../layouts'
import { explainChar } from './explain'
import type { CodeLang } from '../corpus/code'
import { TIP_ACCENTS, TIP_BREAK, TIP_CODE, TIP_IDEAS, TIP_INTRO, TIP_NUMBERS, TIP_NUMPAD, TIP_POSTURE, TIP_SHIFT, TIP_SPEED, type Tip } from './tips'
import type { Curriculum, ExerciseSpec, GameId, IntroCard, Lesson, LessonKind, Unit, UnitAccent } from './types'

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

/** A playable break with everything learned so far. */
function game(b: Builder, u: Unit, slug: string, title: string, id: GameId = 'rain'): Lesson {
  const l = add(b, u, `juego-${slug}`, title, 'game', [], [], [])
  l.game = id
  return l
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
  // The very first keys come before the space bar, so their drills are continuous runs.
  b.pool.push('f', 'j')
  add(b, guia, `${slugOf(['f', 'j'])}-keys`, 'Teclas f y j', 'keys', ['f', 'j'], [
    explainChar(layout, 'f'),
    explainChar(layout, 'j'),
    {
      title: 'A practicar',
      body: 'Tipeá las letras sin mirar el teclado. Todavía no hay espacios: solo f y j, seguidas. Si te equivocás, la letra se marca en rojo y esperás hasta acertar.',
      highlight: ['f', 'j'],
    },
  ], [
    { kind: 'drill', chars: ['f', 'j'], tokens: 8, joined: true },
    { kind: 'drill', chars: ['f', 'j'], tokens: 9, joined: true },
  ])
  b.pool.push(' ')
  add(b, guia, 'space', 'La barra espaciadora', 'keys', [' '], [
    explainChar(layout, ' '),
    {
      title: 'Ahora sí, con espacios',
      body: 'Cada grupo de letras termina con un espacio. Tocá la barra con el pulgar derecho sin mover el resto de la mano, y seguí con la siguiente letra.',
      highlight: [' '],
    },
  ], [
    { kind: 'drill', chars: ['f', 'j'], tokens: 12 },
    { kind: 'drill', chars: ['f', 'j'], tokens: 16 },
  ])
  add(b, guia, `${slugOf(['f', 'j'])}-review`, 'Repaso: f y j', 'review', [], [], [
    { kind: 'review', newChars: ['f', 'j'], pool: [...b.pool] },
    { kind: 'words', pool: [...b.pool], focus: ['f', 'j'] },
  ])
  add(b, guia, `${slugOf(['f', 'j'])}-practice`, 'Práctica: f y j', 'practice', [], [], [
    { kind: 'words', pool: [...b.pool], focus: ['f', 'j'] },
    { kind: 'words', pool: [...b.pool], focus: ['f', 'j'], count: 16 },
  ])
  keyTrio(b, layout, guia, ['d', 'k'])
  keyTrio(b, layout, guia, ['s', 'l'])
  keyTrio(b, layout, guia, ['a', homePinky])
  game(b, guia, 'primeras-8', 'Juego: las primeras 8')
  tip(b, guia, TIP_POSTURE)
  keyTrio(b, layout, guia, ['g', 'h'])
  unitReview(b, guia, 'Repaso: fila guía', (pool) => [
    { kind: 'review', newChars: pool, pool, tokens: 16 },
    { kind: 'words', pool, count: 16 },
    { kind: 'words', pool, count: 16 },
  ])
  game(b, guia, 'fila-guia', 'Juego: al compás', 'rhythm')

  // ───────── Fila superior ─────────
  const sup = unit(b, 'superior', 'Fila superior', 'Los dedos suben una fila y vuelven. Aparecen las vocales que faltaban.', 12, 'blue')
  keyTrio(b, layout, sup, ['r', 'u'])
  keyTrio(b, layout, sup, ['e', 'i'])
  game(b, sup, 'ruei', 'Juego: r u e i')
  tip(b, sup, TIP_IDEAS)
  keyTrio(b, layout, sup, ['w', 'o'])
  keyTrio(b, layout, sup, ['q', 'y'])
  keyTrio(b, layout, sup, ['t', 'p'])
  unitReview(b, sup, 'Repaso: fila guía y superior', (pool) => [
    { kind: 'words', pool, count: 16 },
    { kind: 'words', pool, count: 18 },
    { kind: 'words', pool, count: 20 },
  ])
  game(b, sup, 'fila-superior', 'Juego: globos de palabras', 'balloons')

  // ───────── Fila inferior ─────────
  const inf = unit(b, 'inferior', 'Fila inferior', 'Los dedos bajan. Con esta fila completás el alfabeto.', 15, 'coral')
  keyTrio(b, layout, inf, ['v', 'm'])
  keyTrio(b, layout, inf, ['c', ','])
  keyTrio(b, layout, inf, ['x', '.'])
  game(b, inf, 'vmcx', 'Juego: al compás', 'rhythm')
  keyTrio(b, layout, inf, ['z', bottomPinky])
  tip(b, inf, TIP_BREAK)
  keyTrio(b, layout, inf, ['b', 'n'])
  unitReview(b, inf, 'Repaso: todo el alfabeto', (pool) => [
    { kind: 'words', pool, count: 18 },
    { kind: 'words', pool, count: 20 },
    { kind: 'words', pool, count: 22 },
  ])
  game(b, inf, 'alfabeto', 'Juego: globos de palabras', 'balloons')

  // ───────── Patrones comunes ─────────
  const pat = unit(b, 'patrones', 'Patrones del español', 'Las combinaciones que más se repiten. Dominarlas es la mitad de la velocidad.', 18, 'mint')
  const patterns = ['que', 'ent', 'ado', 'con', 'est', 'ien', 'mente', 'nte', 'los', 'para']
  patterns.forEach((pattern, i) => {
    const pool = [...b.pool]
    add(b, pat, `patron-${slugOf([...pattern])}`, `Patrón: ${pattern}`, 'practice', [], [], [
      { kind: 'pattern', pool, pattern, count: 12 },
      { kind: 'pattern', pool, pattern, count: 14 },
      { kind: 'words', pool, count: 16 },
    ])
    if (pattern === 'mente') {
      const l = game(b, pat, 'patrones', 'Juego: globos con patrones', 'balloons')
      l.patterns = patterns.slice(0, i + 1)
    }
  })

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
  game(b, may, 'mayusculas', 'Juego: carrera contra tu fantasma', 'race')

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
  game(b, num, 'numeros', 'Juego: al compás con números', 'rhythm')

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
  game(b, sig, 'signos', 'Juego: signos')

  // ───────── Velocidad ─────────
  const goals = [25, 28, 31, 34, 37, 40, 45, 50]
  const vel = unit(b, 'velocidad', 'Velocidad', 'Texto real, metas crecientes. La precisión manda.', goals[0], 'green')
  tip(b, vel, TIP_SPEED)
  const velPool = [...b.pool]
  add(b, vel, 'bigramas', 'Bigramas del español', 'practice', [], [], [
    { kind: 'ngram', pool: velPool, n: 2, tokens: 15 },
    { kind: 'ngram', pool: velPool, n: 2, tokens: 15 },
    { kind: 'words', pool: velPool, count: 16 },
  ])
  add(b, vel, 'trigramas', 'Trigramas del español', 'practice', [], [], [
    { kind: 'ngram', pool: velPool, n: 3, tokens: 15 },
    { kind: 'ngram', pool: velPool, n: 3, tokens: 15 },
    { kind: 'words', pool: velPool, count: 16 },
  ])
  goals.forEach((goal, i) => {
    const pool = [...b.pool]
    const l = add(b, vel, `texto-${i + 1}`, `Texto ${i + 1} · meta ${goal} PPM`, 'text', [], [], [
      { kind: 'sentences', pool, count: 2 },
      { kind: 'sentences', pool, count: 2, corpus: i % 3 === 1 ? 'numbers' : i % 3 === 2 ? 'symbols' : 'general' },
      { kind: 'sentences', pool, count: 3 },
    ])
    l.goalWpm = goal
    if (i === 3 || i === 7) {
      const race = game(b, vel, `carrera-${i === 3 ? 1 : 2}`, `Juego: carrera a ${goal} PPM`, 'race')
      race.goalWpm = goal
    }
  })

  optionalUnits(b, layout)

  const byId = new Map(b.lessons.map((l) => [l.id, l]))
  return { units: b.units, lessons: b.lessons, byId }
}

const PAD_STEPS: { slug: string; title: string; keys: string[]; card: IntroCard }[] = [
  {
    slug: 'n456',
    title: 'Numérico: 4, 5 y 6',
    keys: ['4', '5', '6'],
    card: {
      title: 'La fila guía del numérico',
      body: 'El 5 tiene una marca, como la F y la J. Apoyá ahí el dedo medio de la mano derecha: el índice queda en el 4 y el anular en el 6. El meñique descansa junto al + y el pulgar sobre el 0.',
      highlight: ['4', '5', '6'],
    },
  },
  {
    slug: 'n789',
    title: 'Numérico: 7, 8 y 9',
    keys: ['7', '8', '9'],
    card: { title: 'Una fila arriba', body: 'El índice sube al 7, el medio al 8 y el anular al 9. Después de cada número, los dedos vuelven al 4, 5 y 6.', highlight: ['7', '8', '9'] },
  },
  {
    slug: 'n123',
    title: 'Numérico: 1, 2 y 3',
    keys: ['1', '2', '3'],
    card: { title: 'Una fila abajo', body: 'El índice baja al 1, el medio al 2 y el anular al 3. La marca del 5 te dice adónde volver sin mirar.', highlight: ['1', '2', '3'] },
  },
  {
    slug: 'n0',
    title: 'Numérico: el 0',
    keys: ['0'],
    card: { title: 'El 0, con el pulgar', body: 'El 0 es la tecla ancha de abajo y la toca el pulgar derecho, sin mover el resto de la mano.', highlight: ['0'] },
  },
  {
    slug: 'operadores',
    title: 'Numérico: + − * /',
    keys: ['+', '-', '*', '/'],
    card: {
      title: 'Los operadores',
      body: 'El meñique toma el − de arriba y el + de la tecla alta. El medio sube a la / y el anular al *. Son las teclas de las cuentas.',
      highlight: ['+', '-', '*', '/'],
    },
  },
]

const PAD_PRACTICE: IntroCard = {
  title: 'A practicar',
  body: 'Bloq Num encendido y la mano derecha en 4 5 6. El espacio entre números lo da el pulgar izquierdo. Los números del teclado principal no cuentan acá.',
  highlight: ['4', '5', '6'],
}

/**
 * The optional units, after Velocidad and outside the main path: the code symbols this layout's Signos unit
 * left out, with real lines of code, and the number pad. `learned`, the counters and `nextLesson` ignore them.
 */
function optionalUnits(b: Builder, layout: Layout) {
  const cod = unit(b, 'codigo', 'Símbolos de código', 'Llaves, corchetes, barras, operadores y líneas de código real. Después de Signos, cuando quieras.', 20, 'lavender')
  tip(b, cod, TIP_CODE)
  const codePairs = [['[', ']'], ['{', '}'], ['<', '>'], ['\\', '|'], ['`', '~'], ['^']]
  for (const pair of codePairs) {
    const fresh = pair.filter((c) => canType(layout, c) && !b.pool.includes(c))
    if (!fresh.length) continue
    keyTrio(b, layout, cod, fresh, (pool) => [
      { kind: 'code', pool, focus: fresh, count: 3 },
      { kind: 'code', pool, focus: fresh, count: 4 },
    ], 2)
  }
  const operators = ['=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|'].filter((c) => b.pool.includes(c))
  add(b, cod, 'operadores', 'Código: operadores', 'practice', [], [], [
    { kind: 'symbols', pool: [...b.pool], symbols: operators, tokens: 14 },
    { kind: 'code', pool: [...b.pool], focus: operators, count: 4 },
    { kind: 'code', pool: [...b.pool], focus: operators, count: 4 },
  ])
  const byLanguage: [string, string, CodeLang[]][] = [
    ['javascript', 'Código: JavaScript', ['js']],
    ['python', 'Código: Python', ['py']],
    ['terminal', 'Código: terminal y SQL', ['sh', 'sql']],
    ['web', 'Código: HTML y CSS', ['web']],
  ]
  for (const [slug, title, langs] of byLanguage) {
    add(b, cod, slug, title, 'practice', [], [], [
      { kind: 'code', pool: [...b.pool], langs, count: 4 },
      { kind: 'code', pool: [...b.pool], langs, count: 4 },
      { kind: 'code', pool: [...b.pool], langs, count: 5 },
    ])
  }
  unitReview(b, cod, 'Repaso: código', (pool) => [
    { kind: 'code', pool, count: 4 },
    { kind: 'code', pool, count: 5 },
    { kind: 'code', pool, count: 5 },
  ])

  const pad = unit(b, 'numpad', 'Teclado numérico', 'La mano derecha sola, con el 5 como fila guía. Para cargar números rápido; si tu teclado no tiene numérico, salteala.', 20, 'mint')
  tip(b, pad, TIP_NUMPAD)
  const padLearned: string[] = []
  for (const step of PAD_STEPS) {
    padLearned.push(...step.keys)
    const first = [...new Set([...step.keys, '4', '5', '6'])]
    add(b, pad, `${step.slug}-keys`, step.title, 'keys', step.keys, [step.card, { ...PAD_PRACTICE, highlight: step.keys }], [
      { kind: 'numpad', chars: first, tokens: 12 },
      { kind: 'numpad', chars: [...padLearned], tokens: 14 },
    ])
  }
  const digits = padLearned.filter((c) => /[0-9]/.test(c))
  add(b, pad, 'montos', 'Práctica: montos', 'practice', [], [], [
    { kind: 'numpad', chars: digits, tokens: 16 },
    { kind: 'numpad', chars: digits, tokens: 18 },
  ])
  add(b, pad, 'cuentas', 'Práctica: cuentas', 'practice', [], [], [
    { kind: 'numpad', chars: [...padLearned], tokens: 14 },
    { kind: 'numpad', chars: [...padLearned], tokens: 16 },
  ])
  add(b, pad, 'unit-review', 'Repaso: teclado numérico', 'unit-review', [], [], [
    { kind: 'numpad', chars: digits, tokens: 18 },
    { kind: 'numpad', chars: [...padLearned], tokens: 16 },
    { kind: 'numpad', chars: [...padLearned], tokens: 18 },
  ])
  for (const l of pad.lessons) l.numpad = true

  for (const u of [cod, pad]) {
    u.optional = true
    for (const l of u.lessons) l.optional = true
  }
}
