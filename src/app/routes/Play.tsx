import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import type { GameId } from '@/engine/curriculum'
import { ghostWpm, starsForGame, type GameResult } from '@/engine/games'
import { dayKey, weakestKeys } from '@/engine/stats'
import { Game } from '../components/games/Game'
import { GameResults } from '../components/games/GameResults'
import { GAME_META } from '../components/games/meta'
import { useProgress } from '../hooks/useCurriculum'
import { gameSession } from '../lib/gameSession'
import { useStore } from '../store'

export function Play() {
  const { gameId = '' } = useParams()
  if (!(gameId in GAME_META)) return <Navigate to="/" replace />
  return <PlayRun key={gameId} gameId={gameId as GameId} />
}

/** Free play with everything learned: counts for the streak and the minutes, not for the routine. */
function PlayRun({ gameId }: { gameId: GameId }) {
  const { layout, learned, goalWpm } = useProgress()
  const keyStats = useStore((s) => s.keys)
  const sessions = useStore((s) => s.sessions)
  const sound = useStore((s) => s.settings.sound)
  const recordSession = useStore((s) => s.recordSession)
  const setSessionForm = useStore((s) => s.setSessionForm)
  const navigate = useNavigate()
  const [result, setResult] = useState<GameResult | null>(null)
  const at = useRef<string | null>(null)
  const [round, setRound] = useState(0)
  const meta = GAME_META[gameId]

  const onFinish = useCallback(
    (r: GameResult) => {
      setResult(r)
      at.current = recordSession(gameSession(r), r.typing?.samples)
    },
    [recordSession],
  )

  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        navigate('/')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, navigate])

  return (
    <div className="animate-rise">
      <header className="mb-6">
        <div className="eyebrow mb-1">Jugar libre</div>
        <h1 className="text-3xl md:text-4xl">{meta.title}</h1>
        <p className="mt-1 text-ink-soft">{meta.blurb} Con todo lo que ya sabés. No cuenta para la rutina; sí para la racha y los minutos.</p>
      </header>
      {result ? (
        <GameResults
          result={result}
          stars={starsForGame(result)}
          onRetry={() => {
            setResult(null)
            setRound((n) => n + 1)
          }}
          backTo={{ to: '/', label: 'Volver al inicio' }}
          onForm={(form) => at.current && setSessionForm(at.current, form)}
        />
      ) : (
        <Game
          key={round}
          id={gameId}
          layout={layout}
          pool={learned}
          goalWpm={goalWpm}
          weak={weakestKeys(keyStats, learned, 3)}
          ghostWpm={ghostWpm(sessions, dayKey(), goalWpm)}
          sound={sound}
          onFinish={onFinish}
          durationMs={Number(new URLSearchParams(window.location.search).get('dur')) || undefined}
        />
      )}
    </div>
  )
}
