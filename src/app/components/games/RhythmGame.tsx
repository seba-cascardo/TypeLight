import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng } from '@/engine/generator'
import { advance, beatMs, currentNote, pickLetters, press, rhythmWords, schedule, startRound, tally, wordStream, type Judgement, type Round } from '@/engine/games'
import { resolveChar } from '@/engine/layouts'
import { Keycap } from '../Keycap'
import { FINGER_COLOR, fingerGroup } from '../../lib/fingers'
import { chime, click, metronome, thud } from '../../lib/sound'
import { Mascot } from './Mascot'
import { hitMood, missMood, MOOD_MS, type Mood } from './moods'
import type { GameProps } from './types'

const BASE_KEY = 56
/** Left edge of the hit zone inside the field. */
const ZONE_X = 72
/** Notes travel right → left at a constant speed, px per ms. */
const SPEED = 0.16
const JUDGE_MS = 600

type Feedback = Judgement | 'wrong'

interface Floating {
  id: number
  text: Feedback
  at: number
}

const FEEDBACK_LABEL: Record<Feedback, string> = { justo: 'justo', bien: 'bien', fuera: 'fuera', wrong: 'otra tecla' }
const FEEDBACK_COLOR: Record<Feedback, string> = {
  justo: 'text-enter-edge',
  bien: 'text-sun-edge',
  fuera: 'text-esc-edge',
  wrong: 'text-esc-edge',
}
const FEEDBACK_BAR: Record<Feedback, string> = {
  justo: 'var(--color-enter)',
  bien: 'var(--color-sun)',
  fuera: 'var(--color-esc)',
  wrong: 'var(--color-ink-mute)',
}

/**
 * Al compás: a metronome at the unit's goal speed; keys slide into the hit zone and each press is
 * judged justo / bien / fuera. The round state lives in the engine; this component only draws it.
 */
export function RhythmGame({ layout, pool, goalWpm, weak = [], sound = true, durationMs = 45_000, maxWpm, words = false, onFinish }: GameProps) {
  const floorMs = maxWpm ? beatMs(maxWpm) : undefined
  const letters = useMemo(() => pickLetters(layout, pool), [layout, pool])
  // With words, the notes are real words letter by letter (only when the pool has enough of them).
  const wordList = useMemo(() => (words ? rhythmWords(layout, pool) : []), [words, layout, pool])
  const stream = useRef<(() => string) | undefined>(undefined)
  const colorOf = useMemo(() => {
    const map: Record<string, string> = { ' ': FINGER_COLOR.thumb }
    for (const ch of letters) map[ch] = FINGER_COLOR[fingerGroup(resolveChar(layout, ch)![0].finger)]
    return map
  }, [layout, letters])
  const field = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 420 })
  const width = size.w
  // Keys grow with the field so a tall screen gets big targets; the track sits at its middle.
  const KEY = Math.round(Math.min(84, Math.max(BASE_KEY, size.h / 7)))
  const TRACK_TOP = Math.round((size.h - KEY - 24) / 2)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [, setFrame] = useState(0)

  const round = useRef<Round>(startRound(beatMs(goalWpm), floorMs))
  const rng = useRef(makeRng())
  const startedAt = useRef(0)
  const nextTickAt = useRef(0)
  const beatCount = useRef(0)
  const floating = useRef<Floating[]>([])
  const recent = useRef<Feedback[]>([])
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const missStreak = useRef(0)
  const nextId = useRef(1)
  const finished = useRef(false)

  useEffect(() => {
    const el = field.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const lookahead = (width - ZONE_X) / SPEED
  const noteX = (at: number, now: number) => ZONE_X + (at - now) * SPEED
  const setMood = (m: Mood, now: number) => {
    mood.current = { mood: m, at: now }
  }
  const feedback = (text: Feedback, now: number) => {
    floating.current.push({ id: nextId.current++, text, at: now })
    recent.current.push(text)
    if (recent.current.length > 20) recent.current = recent.current.slice(-20)
  }

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setPhase('done')
    if (sound) chime()
    const r = round.current
    const t = tally(r)
    onFinish({
      gameId: 'rhythm',
      score: r.score,
      hits: t.hits,
      misses: t.misses,
      wrong: r.wrong,
      bestCombo: r.bestCombo,
      seconds: (performance.now() - startedAt.current) / 1000,
      accuracy: t.hits + r.wrong ? t.hits / (t.hits + r.wrong) : 0,
      detail: { onTime: t.onTime, justo: t.justo, bien: t.bien, fuera: t.fuera, maxTempo: Math.round(60000 / r.minBeat) },
    })
  }, [onFinish, sound])

  // Main loop: schedule notes, expire the ones that ran out, tick the metronome, redraw.
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const loop = () => {
      const now = performance.now() - startedAt.current
      if (now >= durationMs) {
        finish()
        return
      }
      let r = schedule(round.current, now, lookahead, letters, weak, rng.current, stream.current)
      const step = advance(r, now)
      r = step.round
      for (let i = 0; i < step.expired.length; i++) {
        feedback('fuera', now)
        missStreak.current++
        setMood(missMood(missStreak.current), now)
        if (sound) thud()
      }
      if (now >= nextTickAt.current) {
        beatCount.current++
        nextTickAt.current = now - nextTickAt.current > r.beat ? now + r.beat : nextTickAt.current + r.beat
        if (sound) metronome()
      }
      round.current = r
      floating.current = floating.current.filter((f) => now - f.at < JUDGE_MS)
      if (mood.current.mood !== 'idle' && now - mood.current.at > MOOD_MS[mood.current.mood]) mood.current = { mood: 'idle', at: now }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMs, lookahead, letters, weak, finish, sound])

  // Keyboard input.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      const now = performance.now() - startedAt.current
      const out = press(round.current, e.key, now)
      round.current = out.round
      feedback(out.judgement, now)
      if (out.judgement === 'wrong' || out.judgement === 'fuera') {
        missStreak.current++
        setMood(missMood(missStreak.current), now)
        if (sound) thud()
      } else {
        missStreak.current = 0
        setMood(hitMood(out.round.combo), now)
        if (sound) click()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sound])

  const start = () => {
    round.current = startRound(beatMs(goalWpm), floorMs)
    rng.current = makeRng()
    stream.current = wordList.length ? wordStream(wordList, rng.current) : undefined
    floating.current = []
    recent.current = []
    mood.current = { mood: 'idle', at: 0 }
    missStreak.current = 0
    beatCount.current = 0
    nextTickAt.current = 0
    finished.current = false
    startedAt.current = performance.now()
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'ready') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const now = phase === 'playing' ? performance.now() - startedAt.current : 0
  const r = round.current
  const t = tally(r)
  const current = currentNote(r)
  const remaining = phase === 'playing' ? Math.max(0, Math.ceil((durationMs - now) / 1000)) : Math.round(durationMs / 1000)
  const perMinute = Math.round(60000 / r.beat)
  const visible = r.notes.filter((n) => n.result === null && noteX(n.at, now) < width + KEY)

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span className="flex items-center gap-4">
          <span>
            <span className="font-display text-2xl text-ink tabular-nums">{Math.round(t.onTime * 100)} %</span> a tiempo
          </span>
          {r.combo >= 5 && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">racha ×{r.combo}</span>}
          <span>
            <span className="font-display text-xl text-ink tabular-nums">{r.wrong}</span> errores
          </span>
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">0:{String(remaining).padStart(2, '0')}</span>
      </div>

      <div ref={field} className="card game-field relative overflow-hidden" style={{ background: 'linear-gradient(var(--color-keycap), var(--color-paper))' }}>
        {/* beat indicator and tempo */}
        <div className="absolute top-5 left-5 flex items-center gap-2.5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`block h-3 w-3 rounded-full transition-all ${phase === 'playing' && beatCount.current % 4 === i ? 'bg-mod shadow-[0_0_0_5px_var(--color-mod-soft)]' : 'bg-line'}`}
            />
          ))}
          <span className="ml-2 text-sm font-bold text-ink-soft">tac · tac · tac · tac</span>
        </div>
        <div className="absolute top-4 right-5 text-right text-xs font-bold text-ink-mute">
          pulso
          <span className="block font-display text-2xl font-extrabold text-ink tabular-nums">{perMinute} / min</span>
          {Math.round(perMinute / 5)} PPM{r.beat === beatMs(goalWpm) ? ', tu meta' : ''}
        </div>

        {/* track and hit zone */}
        <div className="absolute inset-x-0 border-y-2 border-line bg-paper-deep" style={{ top: TRACK_TOP, height: KEY + 24 }} />
        <div
          className="absolute rounded-2xl border-[3px] border-dashed border-mod bg-mod-soft/80"
          style={{ left: ZONE_X - 10, top: TRACK_TOP - 12, width: KEY + 20, height: KEY + 48 }}
          aria-hidden="true"
        />

        {/* notes */}
        {visible.map((n) => {
          const x = noteX(n.at, now)
          const isCurrent = current?.id === n.id
          return (
            <div
              key={n.id}
              className={`kb-key absolute items-center justify-center font-extrabold text-ink ${isCurrent ? 'ring-4 ring-mod/40' : ''}`}
              style={{ left: x, top: TRACK_TOP + 12, width: KEY, height: KEY, fontSize: KEY * 0.45, background: colorOf[n.ch], padding: 0, opacity: x > width - KEY ? 0.4 : 1 }}
              data-current={isCurrent ? '1' : undefined}
              data-ch={isCurrent ? n.ch : undefined}
              data-offset={isCurrent ? Math.round(n.at - now) : undefined}
            >
              {n.ch === ' ' ? '␣' : n.ch}
            </div>
          )
        })}

        {/* judgements float up from the zone */}
        {floating.current.map((f) => (
          <span
            key={f.id}
            className={`animate-rise pointer-events-none absolute font-display text-lg font-extrabold ${FEEDBACK_COLOR[f.text]}`}
            style={{ left: ZONE_X + KEY / 2, top: TRACK_TOP - 40, transform: 'translateX(-50%)' }}
          >
            {FEEDBACK_LABEL[f.text]}
          </span>
        ))}

        {/* last 20 presses */}
        <div className="absolute right-5 bottom-6 left-5">
          <div className="eyebrow mb-1.5">Tus últimos 20 toques</div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-paper-deep">
            {Array.from({ length: 20 }, (_, i) => {
              const f = recent.current[i]
              return <span key={i} className="block h-full flex-1 border-r border-keycap/60 last:border-r-0" style={{ background: f ? FEEDBACK_BAR[f] : undefined }} />
            })}
          </div>
        </div>

        <div className="absolute right-4 bottom-14">
          <Mascot mood={mood.current.mood} combo={r.combo} size={Math.round(KEY * 1.15)} />
        </div>

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <h2 className="text-3xl">Al compás</h2>
              <p className="mt-2 text-ink-soft">
                Un metrónomo marca el pulso a tu meta ({goalWpm} PPM). {wordList.length ? 'Llegan palabras, letra por letra, y el espacio entre ellas: tocá cada una justo cuando entra.' : 'Las teclas llegan a la zona: tocá cada una justo cuando entra.'} Si venís bien, el pulso se acelera. {Math.round(durationMs / 1000)} segundos.
              </p>
              <Keycap variant="primary" size="lg" className="mt-5" onClick={start} autoFocus>
                Empezar (Enter) →
              </Keycap>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
