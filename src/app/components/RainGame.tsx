import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveChar, type Layout } from '@/engine/layouts'
import { Keycap } from './Keycap'
import { FINGER_COLOR, fingerGroup } from '../lib/fingers'
import { chime, click, thud } from '../lib/sound'

export interface RainResult {
  hits: number
  misses: number
  wrong: number
  score: number
  bestCombo: number
  seconds: number
}

interface Props {
  layout: Layout
  /** Characters that may fall. Anything that needs a dead key is skipped. */
  pool: string[]
  durationMs?: number
  lives?: number
  sound?: boolean
  onFinish: (r: RainResult) => void
}

interface Drop {
  id: number
  ch: string
  lane: number
  bornAt: number
  speed: number // px per second
  poppedAt: number | null
  color: string
}

interface Effect {
  id: number
  kind: 'pop' | 'splash'
  x: number
  y: number
  color: string
  at: number
}

type Mood = 'idle' | 'happy' | 'sad'

const KEY = 56
const LANES = 8
const POP_MS = 260
const EFFECT_MS = 650
const WATER = 22

function pickLetters(layout: Layout, pool: string[]): string[] {
  return pool.filter((c) => {
    if (c === ' ') return false
    const seq = resolveChar(layout, c)
    return seq !== null && seq.length === 1
  })
}

/** A keycap with a face that cheers catches and winces at misses. */
function Mascot({ mood, combo }: { mood: Mood; combo: number }) {
  const happy = mood === 'happy'
  const sad = mood === 'sad'
  return (
    <svg
      viewBox="0 0 64 64"
      className={`h-16 w-16 ${happy ? 'animate-pop' : ''} ${sad ? 'animate-shake' : ''}`}
      aria-hidden="true"
    >
      <rect x="6" y="10" width="52" height="48" rx="12" fill="var(--color-enter-edge)" />
      <rect x="6" y="6" width="52" height="46" rx="12" fill="var(--color-enter)" />
      <rect x="10" y="8" width="44" height="2" rx="1" fill="rgb(255 255 255 / 0.35)" />
      {/* eyes */}
      {happy ? (
        <>
          <path d="M18 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M36 30 q5 -7 10 0" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="23" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx="41" cy={sad ? 30 : 28} r="4" fill="#fff" />
          <circle cx={sad ? 22 : 24} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
          <circle cx={sad ? 40 : 42} cy={sad ? 31 : 29} r="1.8" fill="#1e2124" />
        </>
      )}
      {/* mouth */}
      {happy ? (
        <path d="M22 38 q10 10 20 0" fill="#1e2124" />
      ) : sad ? (
        <path d="M24 42 q8 -6 16 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M25 39 q7 4 14 0" fill="none" stroke="#1e2124" strokeWidth="3" strokeLinecap="round" />
      )}
      {combo >= 5 && (
        <text x="32" y="62" textAnchor="middle" fontSize="9" fontWeight="900" fill="var(--color-sun-edge)" fontFamily="var(--font-body)">
          ×{combo}
        </text>
      )}
    </svg>
  )
}

/**
 * Lluvia de teclas: keycaps fall down lanes; type the letter to pop the lowest one.
 * Speed and spawn rate ramp up over the round.
 */
export function RainGame({ layout, pool, durationMs = 45_000, lives = 3, sound = true, onFinish }: Props) {
  const letters = useMemo(() => pickLetters(layout, pool), [layout, pool])
  const field = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 420 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready')
  const [, setFrame] = useState(0)

  const drops = useRef<Drop[]>([])
  const effects = useRef<Effect[]>([])
  const stats = useRef({ hits: 0, misses: 0, wrong: 0, score: 0, combo: 0, bestCombo: 0, livesLeft: lives })
  const mood = useRef<{ mood: Mood; at: number }>({ mood: 'idle', at: 0 })
  const startedAt = useRef(0)
  const lastSpawn = useRef(0)
  const nextId = useRef(1)
  const shake = useRef(0)
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

  const laneX = useCallback((lane: number) => (size.w - KEY) * (lane / (LANES - 1)), [size.w])
  const ground = size.h - KEY - WATER
  const dropY = (d: Drop, now: number) => Math.min(ground, ((now - d.bornAt) * d.speed) / 1000)

  const setMood = (m: Mood, now: number) => {
    mood.current = { mood: m, at: now }
  }

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const s = stats.current
    setPhase('done')
    if (sound) chime()
    onFinish({ hits: s.hits, misses: s.misses, wrong: s.wrong, score: s.score, bestCombo: s.bestCombo, seconds: (performance.now() - startedAt.current) / 1000 })
  }, [onFinish, sound])

  const spawn = useCallback(
    (now: number) => {
      const elapsed = (now - startedAt.current) / 1000
      const alive = drops.current.filter((d) => !d.poppedAt)
      const busy = new Set(alive.filter((d) => (now - d.bornAt) * d.speed / 1000 < KEY * 1.6).map((d) => d.lane))
      const free = Array.from({ length: LANES }, (_, i) => i).filter((l) => !busy.has(l))
      if (!free.length || alive.length >= 6) return
      const lane = free[Math.floor(Math.random() * free.length)]
      const ch = letters[Math.floor(Math.random() * letters.length)]
      const finger = resolveChar(layout, ch)![0].finger
      drops.current.push({
        id: nextId.current++,
        ch,
        lane,
        bornAt: now,
        speed: 52 + elapsed * 1.4 + Math.random() * 12,
        poppedAt: null,
        color: FINGER_COLOR[fingerGroup(finger)],
      })
      lastSpawn.current = now
    },
    [letters, layout],
  )

  // Main loop.
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const loop = () => {
      const now = performance.now()
      const elapsed = now - startedAt.current
      if (elapsed >= durationMs) {
        finish()
        return
      }
      const interval = Math.max(620, 1500 - (elapsed / 1000) * 16)
      if (now - lastSpawn.current > interval) spawn(now)
      // Misses: drops that reached the water.
      for (const d of drops.current) {
        if (d.poppedAt) continue
        if (dropY(d, now) >= ground) {
          d.poppedAt = now
          stats.current.misses++
          stats.current.combo = 0
          stats.current.livesLeft--
          shake.current = now
          setMood('sad', now)
          effects.current.push({ id: nextId.current++, kind: 'splash', x: laneX(d.lane) + KEY / 2, y: ground + KEY, color: d.color, at: now })
          if (sound) thud()
          if (stats.current.livesLeft <= 0) {
            finish()
            return
          }
        }
      }
      drops.current = drops.current.filter((d) => !d.poppedAt || now - d.poppedAt < POP_MS)
      effects.current = effects.current.filter((e) => now - e.at < EFFECT_MS)
      if (mood.current.mood !== 'idle' && now - mood.current.at > 700) mood.current = { mood: 'idle', at: now }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMs, ground, spawn, finish, sound, laneX])

  // Keyboard input.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
      e.preventDefault()
      const now = performance.now()
      const candidates = drops.current.filter((d) => !d.poppedAt && d.ch === e.key)
      if (!candidates.length) {
        stats.current.wrong++
        stats.current.combo = 0
        shake.current = now
        setMood('sad', now)
        if (sound) thud()
        return
      }
      // Pop the lowest one.
      const target = candidates.reduce((a, b) => (dropY(a, now) > dropY(b, now) ? a : b))
      target.poppedAt = now
      const s = stats.current
      s.hits++
      s.combo++
      s.bestCombo = Math.max(s.bestCombo, s.combo)
      s.score += 10 * Math.min(5, 1 + Math.floor(s.combo / 5))
      setMood('happy', now)
      effects.current.push({ id: nextId.current++, kind: 'pop', x: laneX(target.lane) + KEY / 2, y: dropY(target, now) + KEY / 2, color: target.color, at: now })
      if (sound) click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sound, laneX])

  const start = () => {
    drops.current = []
    effects.current = []
    stats.current = { hits: 0, misses: 0, wrong: 0, score: 0, combo: 0, bestCombo: 0, livesLeft: lives }
    mood.current = { mood: 'idle', at: 0 }
    finished.current = false
    startedAt.current = performance.now()
    lastSpawn.current = startedAt.current - 900
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

  const now = performance.now()
  const s = stats.current
  const remaining = phase === 'playing' ? Math.max(0, Math.ceil((durationMs - (now - startedAt.current)) / 1000)) : Math.round(durationMs / 1000)
  const shaking = now - shake.current < 220

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm font-bold text-ink-mute">
        <span className="flex items-center gap-3">
          <span>
            <span className="font-display text-2xl text-ink">{s.score}</span> puntos
          </span>
          {s.combo >= 5 && <span className="rounded-full bg-sun-soft px-2 py-0.5 text-xs font-black text-sun-edge">racha ×{s.combo}</span>}
        </span>
        <span className="flex items-center gap-1.5" aria-label={`${s.livesLeft} vidas`}>
          {Array.from({ length: lives }, (_, i) => (
            <svg key={i} width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
              <path
                d="M10 17 L2.2 9.3 A4.4 4.4 0 0 1 8.4 3.1 L10 4.7 L11.6 3.1 A4.4 4.4 0 0 1 17.8 9.3 Z"
                fill={i < s.livesLeft ? 'var(--color-esc)' : 'var(--color-paper-deep)'}
                stroke={i < s.livesLeft ? 'var(--color-esc-edge)' : 'var(--color-line)'}
                strokeWidth="1.5"
              />
            </svg>
          ))}
        </span>
        <span className="keycap keycap-sm font-display text-xl tabular-nums">0:{String(remaining).padStart(2, '0')}</span>
      </div>

      <div
        ref={field}
        className={`card relative h-[420px] overflow-hidden ${shaking ? 'animate-shake' : ''}`}
        style={{ background: 'linear-gradient(var(--color-keycap), var(--color-paper))' }}
      >
        {/* lanes */}
        {Array.from({ length: LANES }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-line-soft"
            style={{ left: laneX(i) + KEY / 2, opacity: 0.7 }}
          />
        ))}
        {/* water */}
        <div className="rain-water absolute inset-x-0 bottom-0" style={{ height: WATER + 6 }} />

        {drops.current.map((d) => {
          const y = dropY(d, now)
          const popped = d.poppedAt !== null
          return (
            <div
              key={d.id}
              className="kb-key absolute items-center justify-center text-2xl font-extrabold text-ink"
              style={{
                left: laneX(d.lane),
                top: y,
                width: KEY,
                height: KEY,
                background: d.color,
                padding: 0,
                transform: popped ? 'scale(1.5)' : undefined,
                opacity: popped ? 0 : 1,
                transition: popped ? `transform ${POP_MS}ms ease-out, opacity ${POP_MS}ms ease-out` : undefined,
              }}
            >
              {d.ch}
            </div>
          )
        })}

        {effects.current.map((e) =>
          e.kind === 'pop' ? (
            <div key={e.id} className="pointer-events-none absolute" style={{ left: e.x, top: e.y }}>
              {Array.from({ length: 7 }, (_, i) => {
                const a = (i / 7) * Math.PI * 2
                return (
                  <span
                    key={i}
                    className="rain-particle"
                    style={{
                      ['--dx' as string]: `${Math.cos(a) * 46}px`,
                      ['--dy' as string]: `${Math.sin(a) * 46 - 10}px`,
                      background: e.color,
                    }}
                  />
                )
              })}
            </div>
          ) : (
            <div key={e.id} className="pointer-events-none absolute" style={{ left: e.x, top: e.y }}>
              <span className="rain-ripple" />
              <span className="rain-ripple" style={{ animationDelay: '120ms' }} />
            </div>
          ),
        )}

        <div className="absolute bottom-6 right-4">
          <Mascot mood={mood.current.mood} combo={s.combo} />
        </div>

        {phase === 'ready' && (
          <div className="absolute inset-0 grid place-items-center bg-paper/70 backdrop-blur-[2px]">
            <div className="max-w-md text-center">
              <h2 className="text-3xl">Lluvia de teclas</h2>
              <p className="mt-2 text-ink-soft">
                Caen teclas con las letras que ya conocés. Tipeá cada una antes de que caiga al agua. Tres vidas, {Math.round(durationMs / 1000)} segundos, y las manos en la fila guía.
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
