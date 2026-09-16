import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { makeRng } from '@/engine/generator'
import {
  alive,
  balloonWords,
  COLUMNS,
  escape,
  pickColumn,
  pickWord,
  prune,
  samplesFrom,
  shouldSpawn,
  spawn,
  startBalloons,
  typeChar,
  type BalloonRound,
  type KeyEvent,
} from '@/engine/games'
import { Keycap } from '../Keycap'
import { useHiddenInput } from '../../hooks/useHiddenInput'
import { chime, click, thud } from '../../lib/sound'
import { Mascot } from './Mascot'
import { hitMood, missMood, MOOD_MS, type Mood } from './moods'
import type { GameProps } from './types'

const GROUND = 34
const BALLOON_H = 92
const POP_MS = 320

interface Pop {
  id: number
  x: number
  y: number
  at: number
}

/**
 * Globos de palabras: words drift up; the first letter typed locks the oldest balloon that starts with it,
 * the rest of the word pops it. Reaching the top costs a life. The round state lives in the engine.
 */
export function BalloonsGame({ pool, weak = [], patterns, sound = true, durationMs = 45_000, onFinish }: GameProps) {
  const rng = useRef(makeRng())
  const words = useMemo(() => balloonWords(pool, makeRng(), patterns), [pool, patterns])
  const field = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 420 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [, setFrame] = useState(0)

  const round = useRef<BalloonRound>(startBalloons())
  const startedAt = useRef(0)
  const lastKeyAt = useRef<number | null>(null)
  const events = useRef<KeyEvent[]>([])
  const pops = useRef<Pop[]>([])
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const missStreak = useRef(0)
  const shake = useRef(-1000)
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

  const scale = Math.min(1.5, Math.max(1, size.h / 420))
  const columnX = (column: number) => ((column + 0.5) / COLUMNS) * size.w
  /** Top of a balloon: it starts just above the ground and rises at its own speed. */
  const balloonY = (bornAt: number, speed: number, now: number) => size.h - GROUND - BALLOON_H * scale - ((now - bornAt) * speed * scale) / 1000
  const setMood = (m: Mood, now: number) => {
    mood.current = { mood: m, at: now }
  }

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setPhase('done')
    if (sound) chime()
    const r = round.current
    onFinish({
      gameId: 'balloons',
      score: r.score,
      hits: r.hits,
      misses: r.escaped,
      wrong: r.wrong,
      bestCombo: r.bestCombo,
      seconds: (performance.now() - startedAt.current) / 1000,
      accuracy: r.hits + r.wrong ? r.hits / (r.hits + r.wrong) : 0,
      detail: { popped: r.popped, escaped: r.escaped },
      typing: { wpm: 0, samples: samplesFrom(events.current) },
    })
  }, [onFinish, sound])

  // Main loop: spawn, detect escapes, animate.
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const loop = () => {
      const now = performance.now() - startedAt.current
      if (now >= durationMs) {
        finish()
        return
      }
      let r = round.current
      if (shouldSpawn(r, now)) {
        const word = pickWord(words, r, weak, rng.current)
        if (word) r = spawn(r, word, pickColumn(r, now, rng.current), now)
      }
      const gone = alive(r).filter((b) => balloonY(b.bornAt, b.speed, now) < -BALLOON_H * scale)
      if (gone.length) {
        r = escape(
          r,
          gone.map((b) => b.id),
          now,
        )
        missStreak.current += gone.length
        setMood(missMood(missStreak.current), now)
        shake.current = now
        if (sound) thud()
      }
      r = prune(r, now)
      round.current = r
      pops.current = pops.current.filter((p) => now - p.at < 650)
      if (mood.current.mood !== 'idle' && now - mood.current.at > MOOD_MS[mood.current.mood]) mood.current = { mood: 'idle', at: now }
      if (r.lives <= 0) {
        finish()
        return
      }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMs, words, weak, finish, sound, size.h, size.w])

  const onText = useCallback(
    (text: string) => {
      if (phase !== 'playing') return
      const now = performance.now() - startedAt.current
      for (const ch of text) {
        const before = round.current
        const out = typeChar(before, ch, now)
        const latency = lastKeyAt.current === null ? undefined : Math.min(2000, now - lastKeyAt.current)
        lastKeyAt.current = now
        if (out.expected !== null) events.current.push({ expected: out.expected, correct: out.outcome !== 'wrong', latency })
        if (out.outcome === 'wrong') {
          missStreak.current++
          setMood(missMood(missStreak.current), now)
          shake.current = now
          if (sound) thud()
        } else {
          missStreak.current = 0
          if (sound) click()
          if (out.outcome === 'pop') {
            const b = out.round.balloons.find((x) => x.how === 'popped' && x.goneAt === now)
            if (b) pops.current.push({ id: nextId.current++, x: columnX(b.column), y: balloonY(b.bornAt, b.speed, now) + (BALLOON_H * scale) / 2, at: now })
            setMood(hitMood(out.round.combo), now)
          }
        }
        round.current = out.round
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, sound, size.h, size.w],
  )
  const { inputProps, focused, focus } = useHiddenInput({ onText, autoFocus: phase === 'playing', focusKey: phase })

  const start = () => {
    round.current = startBalloons()
    rng.current = makeRng()
    events.current = []
    pops.current = []
    lastKeyAt.current = null
    mood.current = { mood: 'idle', at: 0 }
    missStreak.current = 0
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
  const remaining = phase === 'playing' ? Math.max(0, Math.ceil((durationMs - now) / 1000)) : Math.round(durationMs / 1000)
  const shaking = now - shake.current < 220

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span className="flex items-center gap-3">
          <span>
            <span className="font-display text-2xl text-ink">{r.score}</span> puntos
          </span>
          {r.combo >= 3 && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">racha ×{r.combo}</span>}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${r.lives} vidas`}>
          {Array.from({ length: 3 }, (_, i) => (
            <svg key={i} width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
              <path
                d="M10 17 L2.2 9.3 A4.4 4.4 0 0 1 8.4 3.1 L10 4.7 L11.6 3.1 A4.4 4.4 0 0 1 17.8 9.3 Z"
                fill={i < r.lives ? 'var(--color-esc)' : 'var(--color-paper-deep)'}
                stroke={i < r.lives ? 'var(--color-esc-edge)' : 'var(--color-line)'}
                strokeWidth="1.5"
              />
            </svg>
          ))}
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">0:{String(remaining).padStart(2, '0')}</span>
      </div>

      <div
        ref={field}
        className={`card game-field relative overflow-hidden ${shaking ? 'animate-shake' : ''}`}
        style={{ background: 'linear-gradient(180deg, var(--color-mod-soft), var(--color-keycap) 70%)' }}
        onMouseDown={(e) => {
          e.preventDefault()
          focus()
        }}
      >
        <input {...inputProps} />

        {r.balloons.map((b) => {
          const y = balloonY(b.bornAt, b.speed, Math.min(now, b.goneAt ?? now))
          const active = r.active === b.id
          const escaping = b.goneAt === null && y < 70
          const popped = b.how === 'popped'
          const live = b.goneAt === null
          return (
            <div
              key={b.id}
              className="absolute flex flex-col items-center"
              style={{
                left: columnX(b.column),
                top: y,
                transform: `translateX(-50%) scale(${popped ? scale * 1.5 : scale * (active ? 1.12 : 1)})`,
                transformOrigin: 'top center',
                opacity: !live ? 0 : escaping ? 0.55 : 1,
                transition: !live ? `opacity ${POP_MS}ms ease-out, transform ${POP_MS}ms ease-out` : 'transform 120ms ease-out',
              }}
              data-balloon={live ? '1' : undefined}
              data-word={live ? b.word : undefined}
              data-typed={live ? b.typed : undefined}
              data-active={active && live ? '1' : undefined}
            >
              <span
                className={`relative rounded-full border bg-keycap px-3.5 py-1.5 font-body text-lg font-bold tracking-wide whitespace-nowrap ${active ? 'border-enter shadow-[0_0_0_4px_var(--color-enter-soft)]' : escaping ? 'border-dashed border-line' : 'border-line'}`}
              >
                <span className="text-enter-edge">{b.word.slice(0, b.typed)}</span>
                <span className={active ? 'underline decoration-sun decoration-[3px] underline-offset-4' : ''}>{b.word[b.typed] ?? ''}</span>
                <span>{b.word.slice(b.typed + 1)}</span>
                <span className="absolute bottom-[-7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-line bg-keycap" />
              </span>
              <span className="mt-2 h-6 w-px bg-ink-mute opacity-60" />
              <span className="h-2 w-3.5 rounded-b-md bg-sun-edge" />
            </div>
          )
        })}

        {pops.current.map((p) => (
          <div key={p.id} className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2
              return (
                <span
                  key={i}
                  className="rain-particle"
                  style={{ ['--dx' as string]: `${Math.cos(a) * 52}px`, ['--dy' as string]: `${Math.sin(a) * 52 - 10}px`, background: 'var(--color-enter)' }}
                />
              )
            })}
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 bg-paper-deep" style={{ height: GROUND }} />
        <div className="absolute right-4" style={{ bottom: GROUND + 8 }}>
          <Mascot mood={mood.current.mood} combo={r.combo} size={Math.round(64 * scale)} />
        </div>

        {phase === 'playing' && !focused && (
          <button type="button" onClick={focus} className="absolute inset-0 grid place-items-center bg-paper/70 font-bold text-ink-soft backdrop-blur-[2px]">
            Hacé clic acá y seguí escribiendo
          </button>
        )}

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <h2 className="text-3xl">Globos de palabras</h2>
              <p className="mt-2 text-ink-soft">
                Suben globos con palabras. Tipeá la primera letra para elegir uno y seguí hasta el final: explota. Si llega al techo, perdés una vida. Tres vidas, {Math.round(durationMs / 1000)} segundos.
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
