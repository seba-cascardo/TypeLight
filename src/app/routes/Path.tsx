import { Link } from 'react-router'
import type { Lesson } from '@/engine/curriculum'
import { PageTitle, Stars } from '../components/ui'
import { useProgress } from '../hooks/useCurriculum'
import { accentVars, unitAccentClass } from '../lib/accents'
import { useStore } from '../store'

function legend(l: Lesson): { main: string; sub: string } {
  switch (l.kind) {
    case 'keys':
      return { main: l.newChars.map((c) => (c === ' ' ? 'esp' : c)).join(l.newChars.length > 2 ? '' : ' '), sub: 'teclas' }
    case 'review':
      return { main: '↻', sub: 'repaso' }
    case 'practice':
      return l.id.includes('-patron-') ? { main: l.title.replace('Patrón: ', ''), sub: 'patrón' } : { main: '✎', sub: 'práctica' }
    case 'tip':
      return { main: 'tip', sub: 'consejo' }
    case 'unit-review':
      return { main: '★', sub: 'repaso' }
    case 'text':
      return { main: 'Aa', sub: `${l.goalWpm} ppm` }
  }
}

export function Path() {
  const { curriculum, completed, next, isUnlocked } = useProgress()
  const results = useStore((s) => s.lessons)

  return (
    <div className="animate-rise">
      <PageTitle eyebrow="Tu ruta" title="Tecla por tecla, fila por fila.">
        <p className="max-w-sm text-ink-soft">
          Cada unidad es una fila de teclas. Teclas → repaso → práctica, y un repaso general al final.
        </p>
      </PageTitle>

      <div className="space-y-10">
        {curriculum.units.map((u) => {
          const done = u.lessons.filter((l) => completed.has(l.id)).length
          const vars = accentVars[u.accent]
          const isCurrent = next?.unitId === u.id
          return (
            <section key={u.id} id={u.id} className="scroll-mt-24">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wider text-white ${unitAccentClass(u.accent)}`}>
                      meta {u.goalWpm} ppm
                    </span>
                    {isCurrent && <span className="text-xs font-black uppercase tracking-wider text-ink-mute">estás acá</span>}
                  </div>
                  <h2 className="mt-1 text-3xl">{u.title}</h2>
                  <p className="text-ink-soft">{u.blurb}</p>
                </div>
                <span className="text-sm font-bold text-ink-mute">
                  {done}/{u.lessons.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {u.lessons.map((l) => {
                  const r = results[l.id]
                  const unlocked = isUnlocked(l)
                  const isNext = next?.id === l.id
                  const lg = legend(l)
                  const inner = (
                    <>
                      <span
                        className={`font-display font-extrabold leading-none ${l.kind === 'keys' ? 'tracking-tight' : ''} ${lg.main.length > 3 ? 'text-sm' : 'text-xl'}`}
                      >
                        {lg.main}
                      </span>
                      <span className="mt-1 text-[0.62rem] font-black uppercase tracking-wider opacity-70">{lg.sub}</span>
                      <Stars count={r?.stars ?? 0} size="sm" className="mt-1.5" />
                    </>
                  )
                  const style = completed.has(l.id)
                    ? { ['--fill' as string]: vars.soft, ['--edge' as string]: vars.edge, ['--text' as string]: 'var(--color-ink)' }
                    : isNext
                      ? { ['--fill' as string]: vars.fill, ['--edge' as string]: vars.edge, ['--text' as string]: u.accent === 'sun' ? 'var(--color-ink)' : '#fff' }
                      : undefined
                  const cls = `keycap h-24 w-[5.5rem] flex-col items-center justify-center px-1 ${isNext ? 'ring-4 ring-sun ring-offset-2 ring-offset-paper' : ''}`
                  if (!unlocked) {
                    return (
                      <span key={l.id} className={`${cls} cursor-not-allowed opacity-45`} title={`${l.title} (bloqueada)`} style={style}>
                        {inner}
                      </span>
                    )
                  }
                  return (
                    <Link key={l.id} to={`/leccion/${l.id}`} className={cls} title={l.title} style={style}>
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
