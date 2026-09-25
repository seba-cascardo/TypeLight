import { StrictMode, useEffect, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router'
import './index.css'
import { AppShell } from './app/components/AppShell'
import { Home } from './app/routes/Home'
import { Welcome } from './app/routes/Welcome'
import { useStore } from './app/store'

// Every screen past Inicio loads on demand: the daily routine paints from a small first chunk.
const lazy = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T) => async () => ({ Component: (await load())[name] as ComponentType })

/** Mirrors the theme setting onto <html data-theme>; 'auto' follows the system. */
function ThemeSync() {
  const theme = useStore((s) => s.settings.theme ?? 'auto')
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') delete root.dataset.theme
    else root.dataset.theme = theme
    const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#16181b' : '#F1ECDF')
  }, [theme])
  return null
}

function RequireOnboarding() {
  const onboarded = useStore((s) => s.settings.onboarded)
  if (!onboarded) return <Navigate to="/bienvenida" replace />
  return <Outlet />
}

const router = createBrowserRouter([
  { path: '/bienvenida', element: <Welcome /> },
  {
    element: <RequireOnboarding />,
    // While a lazy screen loads on a direct visit, paint nothing (the page background shows) instead of warning.
    hydrateFallbackElement: <></>,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/ruta', lazy: lazy(() => import('./app/routes/Path'), 'Path') },
          { path: '/leccion/:id', lazy: lazy(() => import('./app/routes/LessonPlayer'), 'LessonPlayer') },
          { path: '/practica/:kind', lazy: lazy(() => import('./app/routes/Practice'), 'Practice') },
          { path: '/jugar/:gameId', lazy: lazy(() => import('./app/routes/Play'), 'Play') },
          { path: '/texto', lazy: lazy(() => import('./app/routes/OwnText'), 'OwnText') },
          { path: '/lectura', lazy: lazy(() => import('./app/routes/Reading'), 'Library') },
          { path: '/lectura/:bookId', lazy: lazy(() => import('./app/routes/Reading'), 'Reader') },
          { path: '/estadisticas', lazy: lazy(() => import('./app/routes/Stats'), 'Stats') },
          { path: '/ajustes', lazy: lazy(() => import('./app/routes/Settings'), 'Settings') },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeSync />
    <RouterProvider router={router} />
  </StrictMode>,
)
