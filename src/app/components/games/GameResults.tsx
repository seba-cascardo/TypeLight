import type { ReactNode } from 'react'
import type { Lesson } from '@/engine/curriculum'
import type { GameResult } from '@/engine/games'
import type { Stars as StarCount } from '@/engine/stats'
import { Keycap } from '../Keycap'
import { Stars, Stat } from '../ui'

type Tone = 'ink' | 'enter' | 'esc' | 'mod'

interface View {
  /** Headline for 1, 2 and 3 stars. */
  headline: [string, string, string]
  stats: { label: string; value: ReactNode; tone?: Tone }[]
  footnote: string
}

const pct = (v: number) => `${Math.round(v * 100)} %`

function view(r: GameResult): View {
  switch (r.gameId) {
    case 'rain':
      return {
        headline: ['Terminado. Con más práctica, la lluvia se vuelve lenta.', 'Buen reflejo. Un poco más de calma y son tres.', 'Ni una gota al piso.'],
        stats: [
          { label: 'Puntos', value: r.score, tone: 'enter' },
          { label: 'Atrapadas', value: r.hits },
          { label: 'Al piso', value: r.misses, tone: r.misses === 0 ? 'enter' : 'esc' },
          { label: 'Precisión', value: pct(r.accuracy), tone: r.accuracy >= 0.95 ? 'enter' : r.accuracy >= 0.85 ? 'ink' : 'esc' },
        ],
        footnote: `Mejor racha: ${r.bestCombo} seguidas. Tres estrellas con 95 % de precisión.`,
      }
    case 'rhythm': {
      const onTime = r.detail.onTime ?? 0
      return {
        headline: ['Terminado. El pulso se aprende de a poco: repetilo mañana.', 'Buen pulso. Un poco más de calma y son tres.', 'Como un metrónomo.'],
        stats: [
          { label: 'A tiempo', value: pct(onTime), tone: onTime >= 0.85 ? 'enter' : onTime >= 0.7 ? 'ink' : 'esc' },
          { label: 'Justo', value: r.detail.justo ?? 0, tone: 'enter' },
          { label: 'Errores', value: r.wrong, tone: r.wrong === 0 ? 'enter' : 'ink' },
          { label: 'Pulso máximo', value: `${r.detail.maxTempo ?? 0}/min` },
        ],
        footnote: `Mejor racha: ${r.bestCombo} seguidas. Tres estrellas con 85 % a tiempo y 97 % de precisión.`,
      }
    }
  }
}

interface Props {
  result: GameResult
  stars: StarCount
  onRetry: () => void
  nextLesson?: Lesson
  /** Where "back" goes when there is no next lesson (free play uses the home). */
  backTo?: { to: string; label: string }
}

export function GameResults({ result, stars, onRetry, nextLesson, backTo = { to: '/ruta', label: 'Volver a la ruta' } }: Props) {
  const v = view(result)
  return (
    <div className="card p-8 text-center">
      <div className="eyebrow mb-3">Juego terminado</div>
      <div className="animate-pop inline-block">
        <Stars count={stars} size="lg" />
      </div>
      <h2 className="mt-3 text-3xl">{v.headline[Math.min(2, Math.max(0, stars - 1))]}</h2>
      <div className="mx-auto mt-6 flex max-w-lg justify-around">
        {v.stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-mute">{v.footnote}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Keycap variant="ghost" onClick={onRetry}>
          Jugar de nuevo
        </Keycap>
        {nextLesson ? (
          <Keycap to={`/leccion/${nextLesson.id}`} variant="primary" size="lg">
            Siguiente: {nextLesson.title} <span className="opacity-70">(Enter)</span> →
          </Keycap>
        ) : (
          <Keycap to={backTo.to} variant="primary" size="lg">
            {backTo.label}
          </Keycap>
        )}
      </div>
    </div>
  )
}
