import { useRouteError } from 'react-router'
import { isStaleChunkError, reloadForNewVersion } from '../lib/staleChunk'
import { Keycap } from './Keycap'

/** What a screen shows when it fails to load or to render, instead of the router's developer page. */
export function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunkError(error)
  // A new version was published while the tab was open: reload once, silently.
  if (stale && reloadForNewVersion()) return null
  const detail = error instanceof Error ? error.message : String(error)
  return (
    // Padded on its own: at the root it renders without the shell around it.
    <div className="px-4 py-6 md:py-10">
      <div className="card animate-rise mx-auto max-w-xl p-8 text-center" role="alert" data-testid="route-error">
        <div className="eyebrow mb-2">{stale ? 'Versión nueva' : 'Algo falló'}</div>
        <h1 className="text-2xl md:text-3xl">{stale ? 'TypeLight se actualizó' : 'Esta pantalla no se pudo abrir'}</h1>
        <p className="mt-3 text-ink-soft">
          {stale
            ? 'Hay una versión nueva. Recargá la página para seguir: tu progreso queda guardado.'
            : 'Tu progreso está guardado. Probá recargar; si vuelve a pasar, avisá con el detalle de abajo.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Keycap variant="primary" onClick={() => window.location.reload()}>
            Recargar
          </Keycap>
          <Keycap variant="ghost" onClick={() => window.location.assign(import.meta.env.BASE_URL)}>
            Volver a Inicio
          </Keycap>
        </div>
        {!stale && (
          <details className="mt-6 text-left text-sm text-ink-mute">
            <summary className="cursor-pointer font-bold">Detalle</summary>
            <code className="mt-2 block break-words">{detail}</code>
          </details>
        )}
      </div>
    </div>
  )
}
