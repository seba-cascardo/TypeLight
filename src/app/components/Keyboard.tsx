import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { resolveChar, shiftCodeFor, type KeyDef, type Layout } from '@/engine/layouts'
import { FINGER_COLOR, fingerGroup, type FingerGroup } from '../lib/fingers'

interface Props {
  layout: Layout
  /** Next character to type: its key(s) light up, with shift/AltGr when needed. */
  nextChar?: string | null
  /** Characters to mark softly (intro cards). */
  highlight?: string[]
  /** Physical keys currently held down. */
  pressed?: ReadonlySet<string>
  fingerColors?: boolean
  /** Per-character heat value 0..1 (1 = strong). */
  heat?: Record<string, number>
  /** Per-character mastery level (1 weak · 2 on track · 3 mastered); keys absent from the map render as unlearned. */
  levels?: Record<string, 1 | 2 | 3>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const MODS_LEFT: KeyDef[] = [
  { code: 'ControlLeft', base: '', label: 'Ctrl', finger: 'LP', width: 1.25 },
  { code: 'AltLeft', base: '', label: 'Alt', finger: 'LT', width: 1.25 },
]
const MODS_RIGHT: KeyDef[] = [
  { code: 'AltRight', base: '', label: 'Alt Gr', finger: 'RT', width: 1.25 },
  { code: 'ControlRight', base: '', label: 'Ctrl', finger: 'RP', width: 1.25 },
]

const MAX_KEY_HEIGHT = { sm: 36, md: 60, lg: 68 }

function legendOf(key: KeyDef): { main: string; top?: string; alt?: string } {
  if (key.label) return { main: key.label }
  const isLetter = /^[a-zñ]$/i.test(key.base)
  if (isLetter) return { main: key.base.toUpperCase(), alt: key.altGr }
  return { main: key.base, top: key.shift, alt: key.altGr }
}

export function Keyboard({ layout, nextChar, highlight, pressed, fingerColors = true, heat, levels, size = 'md', className = '' }: Props) {
  const rows = useMemo(() => {
    const base = layout.rows.map((r) => [...r])
    // Bottom row: modifiers around the space bar.
    base[4] = [...MODS_LEFT, ...base[4], ...MODS_RIGHT]
    return base
  }, [layout])

  const maxUnits = useMemo(() => Math.max(...rows.map((r) => r.reduce((a, k) => a + (k.width ?? 1), 0))), [rows])

  // Keys are as tall as one unit of width (capped), so the keyboard keeps its proportions at any size.
  const wrapper = useRef<HTMLDivElement>(null)
  const [unit, setUnit] = useState(48)
  useLayoutEffect(() => {
    const el = wrapper.current
    if (!el) return
    const update = () => setUnit(el.getBoundingClientRect().width / maxUnits)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxUnits])
  const keyHeight = Math.max(18, Math.min(MAX_KEY_HEIGHT[size], unit - 4))

  const next = useMemo(() => {
    const map = new Map<string, { step: number; shift: boolean; altGr: boolean }>()
    if (!nextChar) return map
    const seq = resolveChar(layout, nextChar)
    if (!seq) return map
    seq.forEach((p, i) => {
      map.set(p.code, { step: seq.length > 1 ? i + 1 : 0, shift: p.shift, altGr: p.altGr })
      if (p.shift) map.set(shiftCodeFor(p.finger), { step: 0, shift: false, altGr: false })
      if (p.altGr) map.set('AltRight', { step: 0, shift: false, altGr: false })
    })
    return map
  }, [layout, nextChar])

  const soft = useMemo(() => {
    const set = new Set<string>()
    for (const ch of highlight ?? []) {
      const seq = resolveChar(layout, ch)
      seq?.forEach((p) => set.add(p.code))
    }
    return set
  }, [layout, highlight])

  const heatOf = (key: KeyDef): number | undefined => {
    if (!heat) return undefined
    const v = heat[key.base] ?? (key.shift ? heat[key.shift] : undefined)
    return v
  }

  const LEVEL_STYLE: Record<1 | 2 | 3, { background: string; color: string }> = {
    1: { background: 'var(--color-esc-soft)', color: 'var(--color-esc-edge)' },
    2: { background: 'var(--color-sun-soft)', color: 'var(--color-sun-edge)' },
    3: { background: 'var(--color-enter-soft)', color: 'var(--color-enter-edge)' },
  }
  const levelOf = (key: KeyDef): 1 | 2 | 3 | undefined => {
    if (!levels) return undefined
    if (key.code === 'Space') return levels[' ']
    return levels[key.base] ?? (key.shift ? levels[key.shift] : undefined)
  }

  return (
    <div
      ref={wrapper}
      className={`select-none ${className}`}
      style={{ ['--kb-h' as string]: `${keyHeight}px` }}
      aria-hidden="true"
    >
      {rows.map((row, ri) => {
        const units = row.reduce((a, k) => a + (k.width ?? 1), 0)
        return (
          <div key={ri} className="flex gap-1 mb-1 last:mb-0">
            {row.map((key) => {
              const legend = legendOf(key)
              const n = next.get(key.code)
              const isNext = !!n
              const isPressed = pressed?.has(key.code)
              const isSoft = soft.has(key.code)
              const h = heatOf(key)
              const group = fingerGroup(key.finger)
              let background: string | undefined
              let color: string | undefined
              let finger: string | undefined
              if (levels) {
                const lv = levelOf(key)
                if (lv) ({ background, color } = LEVEL_STYLE[lv])
                else if (key.base || key.code === 'Space') {
                  background = 'var(--color-paper-deep)'
                  color = 'var(--color-ink-mute)'
                }
              } else if (h !== undefined) {
                // cool (slow) → warm (fast): coral → sun → mint
                const hue = 10 + h * 150
                background = `hsl(${hue} 75% ${78 - h * 10}%)`
              } else if (fingerColors && (key.base || key.code === 'Space')) {
                finger = FINGER_COLOR[group]
              }
              return (
                <div
                  key={key.code}
                  className={`kb-key ${isNext ? 'is-next' : ''} ${isNext && n.step === 2 ? 'is-next-2' : ''} ${isPressed ? 'is-pressed' : ''} ${key.home ? 'is-home' : ''} ${finger && !isNext ? 'has-finger' : ''}`}
                  style={{
                    flexGrow: key.width ?? 1,
                    flexBasis: 0,
                    ['--finger' as string]: finger,
                    background: isNext ? undefined : background,
                    color,
                    boxShadow: isSoft && !isNext ? '0 0 0 3px var(--color-sun)' : undefined,
                    fontSize: size === 'sm' ? '0.65rem' : undefined,
                  }}
                >
                  {legend.top && size !== 'sm' && <span className="absolute left-1.5 top-0.5 text-[0.65em] opacity-70">{legend.top}</span>}
                  <span className={key.label ? 'text-[0.72em] font-bold' : ''}>{legend.main}</span>
                  {legend.alt && size !== 'sm' && <span className="absolute right-1.5 bottom-0.5 text-[0.6em] opacity-60">{legend.alt}</span>}
                  {isNext && n.step > 0 && (
                    <span className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-sun text-[0.65rem] font-black text-ink">
                      {n.step}
                    </span>
                  )}
                </div>
              )
            })}
            {units < maxUnits && <div style={{ flexGrow: maxUnits - units, flexBasis: 0 }} />}
          </div>
        )
      })}
    </div>
  )
}

export function FingerLegend() {
  const items: [FingerGroup, string][] = [
    ['pinky', 'meñique'],
    ['ring', 'anular'],
    ['middle', 'medio'],
    ['index', 'índice'],
    ['thumb', 'pulgar'],
  ]
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
      {items.map(([g, name]) => (
        <span key={g} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-black/10" style={{ background: FINGER_COLOR[g] }} />
          {name}
        </span>
      ))}
    </div>
  )
}
