import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router'
import './index.css'
import { AppShell } from './app/components/AppShell'
import { Home } from './app/routes/Home'
import { LessonPlayer } from './app/routes/LessonPlayer'
import { Path } from './app/routes/Path'
import { Practice } from './app/routes/Practice'
import { Settings } from './app/routes/Settings'
import { Stats } from './app/routes/Stats'
import { Welcome } from './app/routes/Welcome'
import { useStore } from './app/store'

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
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/ruta', element: <Path /> },
          { path: '/leccion/:id', element: <LessonPlayer /> },
          { path: '/practica/:kind', element: <Practice /> },
          { path: '/estadisticas', element: <Stats /> },
          { path: '/ajustes', element: <Settings /> },
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
