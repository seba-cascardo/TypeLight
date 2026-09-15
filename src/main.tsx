import { StrictMode } from 'react'
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
    <RouterProvider router={router} />
  </StrictMode>,
)
