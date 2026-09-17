# Proteger y contenido (etapa 3) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Estado:** Ejecutado completo el 2026-09-17 sobre `master` (`0dbfb42`), rama `proteger-contenido`, todavía sin mergear. Desvíos: el `.bat` guarda las lecturas de `git log`/mtime en variables y reconstruye si vienen vacías en vez de tirar un error de parseo; en Ajustes, importar una copia limpia una confirmación pendiente si un archivo posterior falla, y `fechaCopia()` guarda contra fechas inválidas; `challengeText` cuenta la longitud exacta del texto ya unido (+ tests de límite y de la rama de relleno con palabras); la aserción de versión de `e2e/flow.spec.ts` pasa de 2 a 3; en los scripts de corpus, el regex de `VOSOTROS` se amplía (`abais|asteis|isteis|íais`) y se suma un filtro `TUTEO` (formas de tú frecuentes rechazadas, porque Seba lee en rioplatense), se exige `¿?`/`¡!` pareados, y `BLOCK` gana `cagar…/asesinaron…/guerra`; el corpus final quedó en 1500 frases (526 sin tildes, 302 con ¿¡?!), cobertura 603/603/1685 por etapa; los n-gramas quedaron pesados por rango en `words.ts` (`1/√(i+20)`) en vez de la frecuencia cruda de `es_50k.txt` (evita la descarga, `words.ts` no se toca); `ngramText` quedó total (clampa `combination` y cae a palabras si no entra nada); el e2e de "tu velocidad de antes" usa `locator('svg text')` y una sesión de fixture (Progreso muestra un estado vacío con `sessions.length === 0`); el botón de resultados dice "Ver progreso (Enter) →"; la tarjeta de hito queda arriba del recordatorio de copia.

**Goal:** Que el progreso de Seba tenga copia, que use un build estable en vez del dev server, cerrar los issues de severidad A/M del reporte, darle al Reto frases reales desde la tercera unidad (corpus por etapa), sumar n-gramas del español y capturar "tu velocidad de antes" como la vara que el mapeo nuevo tiene que superar.

**Architecture:** Todo lo testeable sigue en `src/engine/` (puro, sin React): resumen de referencia por día en `days`, `challengeText`/`pickSentences`/`fitSentence`/`ngramText` en el generador, `nextLesson` robusto en el currículo, pausa por pestaña oculta en el motor de tipeo (`afterPause`). La UI solo consume: `Settings` gana dos tarjetas (copia, velocidad de antes), `Practice` gana el kind `antes` y el Calentamiento de bigramas, `Stats` lee la referencia de `days` y dibuja la línea "antes". El corpus generado y la tabla de n-gramas los producen scripts de Python en `scripts/` y se commitean como `.ts`.

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 strict, Tailwind v4, zustand 5 (persist), react-router 7, Vitest 5 + Testing Library, Playwright 1.63, Python 3 para scripts.

**Spec:** `docs/superpowers/specs/2026-09-17-proteger-y-contenido-design.md`. Contexto: `docs/research/2026-09-17-auditoria-y-roadmap.md` (§3 issues, §10 addendum).

## Global Constraints

- Motor puro en `src/engine/` (sin React ni imports de `src/app/`). Prosa de UI en rioplatense; código, comentarios y commits en inglés. Sin librerías nuevas.
- **Ninguna decisión de producto de Seba cambia**: parar en el error, ruta, métricas anti-inflado, estética, manos guía. Los IDs de lección existentes no cambian; los nuevos son `velocidad-bigramas` y `velocidad-trigramas`.
- Store: `typelight.v1` pasa de versión 2 a **3**; la migración es en cadena (v1 → v2 → v3) y no inventa historia.
- Puertos: `:5173` = build estable (`npm run serve`) para el uso diario de Seba; `:5175` = dev server para probar la rama; `:5174` = e2e (no cambia).
- Rama `proteger-contenido` sobre `master`, misma carpeta. Avisar a Seba antes de que pruebe (HMR en :5175; :5173 no se toca hasta el merge).
- Verificación por tarea: `npx tsc -b && npm run lint && npm test`. Al cierre: `npm run e2e` y `npm run build`. El lint tiene 4 advertencias previas (2 en `src/main.tsx`, 2 en `LessonPlayer.tsx`): no sumar ninguna.
- Trampa del entorno: heredocs con backticks en Bash fallan a veces; con backticks en el contenido, escribir el archivo con el tool Write. Playwright: la tecla es `Enter`; fechas de e2e con el día **local**.
- Commits: un commit por tarea, mensaje en inglés, terminado en `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `package.json` (modificar) | Script `serve` (`vite preview` de `dist/` en :5173). |
| `scripts/TypeLight.bat` (crear) | Copia del `.bat` de escritorio: build si `dist/` falta o es viejo, después `serve`. |
| `src/engine/stats/days.ts` + `days.test.ts` (modificar) | `DaySummary.reference[]`, `DaySummary.sessions`; `addSession` reemplaza a `addSeconds`. |
| `src/engine/stats/progress.ts` + `progress.test.ts` (modificar) | `referenceByDay(days)`; `legacyBeaten`. |
| `src/engine/stats/index.ts` (modificar) | `dayOfYear`. |
| `src/app/store/migrate.ts` + `migrate.test.ts` (modificar) | v2 → v3 con backfill de `days` desde `sessions`; `legacy: null`; `settings.lastBackupAt`. |
| `src/app/store/index.ts` (modificar) | Versión 3; `Legacy`, `legacy`, `setLegacy`; `settings.lastBackupAt`; `recordSession` con `addSession`; `PersistedState`, `persistedState`, `importState`. |
| `src/app/lib/backup.ts` + `backup.test.ts` (crear) | `serializeBackup`, `parseBackup`, `backupFilename`, `backupDue`, `downloadText`. |
| `src/app/routes/Settings.tsx` (modificar) | Tarjetas "Tu progreso" (copia) y "Tu velocidad de antes"; copia antes de reiniciar. |
| `src/app/routes/Home.tsx` (modificar) | Precisión 7 días; ejercicios desde `days`; recordatorio de copia; `data-done` en tarjetas; línea "antes"; tarjeta "superaste tu forma vieja". |
| `src/engine/typing/index.ts` + `typing.test.ts` (modificar) | `typeChar`/`typeText` con `afterPause`. |
| `src/app/hooks/useTypingSession.ts` + `useTypingSession.test.ts` (modificar/crear) | Reloj que no corre con la pestaña oculta. |
| `src/engine/generator/index.ts` + `generator.test.ts` (modificar) | `fitSentence`, `pickSentences` (ponderado), `challengeText`, `ngramText`. |
| `src/engine/corpus/sentences.ts` (modificar) | +100 frases de la casa. |
| `src/engine/corpus/sentences.generated.ts` (generar) | ~1500 frases de Tatoeba filtradas. |
| `src/engine/corpus/ngrams.ts` (generar) | `BIGRAMS`, `TRIGRAMS` con peso 1..1000. |
| `scripts/corpus_common.py` (crear) · `scripts/build-corpus.py` (modificar) · `scripts/build-sentences.py`, `scripts/build-ngrams.py` (crear) | Filtros compartidos; generadores. |
| `src/engine/curriculum/types.ts`, `index.ts`, `build.ts`, `curriculum.test.ts` (modificar) | `ExerciseSpec` `ngram`; `nextLesson` robusto; dos lecciones en Velocidad. |
| `src/app/hooks/useCurriculum.ts` (modificar) | `next` = `nextLesson(curriculum, completed)`. |
| `src/app/routes/Practice.tsx` (modificar) | `challengeText`; Calentamiento de bigramas; kind `antes`. |
| `src/app/routes/LessonPlayer.tsx` (modificar) | `completeTip` sin `markRoutine`. |
| `src/app/routes/Path.tsx` (modificar) | Leyenda `ab` / n-gramas. |
| `src/app/routes/Stats.tsx` (modificar) | `referenceByDay(days)`; sello "velocidad honesta"; `legacy` al chart. |
| `src/app/components/stats/ReferenceChart.tsx` (modificar) | Línea punteada "antes · N". |
| `e2e/stats.spec.ts` (modificar) · `e2e/backup.spec.ts`, `e2e/tip.spec.ts`, `e2e/ngram.spec.ts`, `e2e/legacy.spec.ts` (crear) | Cobertura e2e. |
| `docs/backlog.md`, `.serena/memories/typelight-architecture.md`, `docs/superpowers/handoffs/HANDOFF.md` (modificar) | Cierre de etapa; instrucciones del `.bat` nuevo para Seba. |

---

### Task 0: Rama

- [x] **Step 1**

```bash
git -C C:/Projects/TypeLight checkout -b proteger-contenido
```

---

### Task 1: Build estable para el uso diario

**Files:**
- Modify: `package.json` (bloque `scripts`)
- Create: `scripts/TypeLight.bat`

**Interfaces:**
- Produces: `npm run serve` sirve `dist/` en `http://localhost:5173/` con fallback SPA.

- [x] **Step 1: Agregar el script `serve`**

En `package.json`, dentro de `"scripts"`, después de `"preview"`:

```json
    "serve": "vite preview --port 5173 --strictPort",
```

- [x] **Step 2: Verificar que el build se sirve con fallback SPA**

Run (en dos terminales o con `run_in_background` para el segundo):

```bash
npm run build
```

```bash
npm run serve
```

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/estadisticas`
Expected: `200` (si :5173 está tomado por el dev server de Seba, parar ese dev server primero o probar con `--port 5176` solo para esta verificación; el script queda en 5173).

- [x] **Step 3: Escribir el `.bat` nuevo (copia en el repo; el de escritorio lo reemplaza Seba)**

Crear `scripts/TypeLight.bat` con el tool Write:

```bat
@echo off
title TypeLight
set "APP=C:\Projects\TypeLight"
set "PORT=5173"
set "URL=http://localhost:%PORT%/"

cd /d "%APP%" || (echo No encuentro %APP% & pause & exit /b 1)

rem Si el server ya esta corriendo, solo abrimos el navegador.
powershell -NoProfile -Command "try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); exit 0}catch{exit 1}"
if %errorlevel%==0 (
  echo El server ya esta corriendo. Abriendo %URL%
  start "" "%URL%"
  exit /b 0
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install || (pause & exit /b 1)
)

rem Reconstruye dist/ si falta o si master tiene un commit mas nuevo que el build.
rem (Sin bloques entre parentesis: las variables que se setean adentro no se leen en el mismo bloque.)
set "NEEDS_BUILD=0"
if not exist dist\index.html set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto build
git log -1 --format=%%ct master > "%TEMP%\typelight-commit.txt"
set /p COMMIT_TS=<"%TEMP%\typelight-commit.txt"
powershell -NoProfile -Command "[int]((Get-Item 'dist\index.html').LastWriteTimeUtc - [datetime]'1970-01-01').TotalSeconds" > "%TEMP%\typelight-build.txt"
set /p BUILD_TS=<"%TEMP%\typelight-build.txt"
if %BUILD_TS% LSS %COMMIT_TS% set "NEEDS_BUILD=1"
:build
if "%NEEDS_BUILD%"=="1" (
  echo Construyendo TypeLight...
  call npm run build || (pause & exit /b 1)
)

echo Sirviendo TypeLight en %URL% ...
echo Cerra esta ventana para apagar el server.
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){ try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); Start-Process '%URL%'; exit}catch{Start-Sleep -Milliseconds 500} }"
npm run serve
```

- [x] **Step 4: Probar el `.bat` desde el repo (sin tocar el del escritorio)**

Run: `cmd /c scripts\TypeLight.bat` en una terminal aparte, esperar a que el navegador abra, cerrar la ventana.
Expected: imprime "Construyendo TypeLight..." solo si `dist/` faltaba; después "Sirviendo TypeLight en http://localhost:5173/".

- [x] **Step 5: Commit**

```bash
git add package.json scripts/TypeLight.bat
git commit -m "build: serve the static build on :5173 for daily use; launcher rebuilds when master moves

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Store v3 — resumen de referencia por día, contador de sesiones, `legacy`

**Files:**
- Modify: `src/engine/stats/days.ts`, `src/engine/stats/days.test.ts`
- Modify: `src/app/store/migrate.ts`, `src/app/store/migrate.test.ts`
- Modify: `src/app/store/index.ts`
- Modify: `e2e/stats.spec.ts` (línea `expect(stored.version).toBe(2)`)

**Interfaces:**
- Produces: `DaySummary { seconds; blocks; learned; mastered; reference: number[]; sessions: number }`; `addSession(days: Days, day: string, seconds: number, referenceWpm?: number): Days`; `Legacy { wpm: number; acc: number; at: string; beatenAt?: string; beatenSeen?: true }`; store `legacy: Legacy | null`, `setLegacy(l: Legacy | null)`; `Settings.lastBackupAt: string | null`; `PersistedState`, `persistedState(s)`, `importState(state)`.

- [x] **Step 1: Test de `addSession` y de los campos nuevos**

En `src/engine/stats/days.test.ts`, reemplazar los usos de `addSeconds` por `addSession` y agregar:

```ts
it('addSession sums seconds, counts the session and keeps reference speeds', () => {
  let d: Days = {}
  d = addSession(d, '2026-09-17', 40)
  d = addSession(d, '2026-09-17', 60, 28)
  d = addSession(d, '2026-09-17', 60, 31)
  expect(d['2026-09-17']).toEqual({ seconds: 160, blocks: 0, learned: 0, mastered: 0, reference: [28, 31], sessions: 3 })
})

it('setBlocks and setSnapshot create a day with empty reference and zero sessions', () => {
  const d = setBlocks({}, '2026-09-17', 2)
  expect(d['2026-09-17'].reference).toEqual([])
  expect(d['2026-09-17'].sessions).toBe(0)
})
```

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/engine/stats/days.test.ts`
Expected: FAIL (`addSession` no existe).

- [x] **Step 3: Implementar en `days.ts`**

```ts
/** One row per local day (see `dayKey`). Written by the store as things happen; read by Progreso. */
export interface DaySummary {
  seconds: number
  /** Routine cards done that day, 0..4. */
  blocks: number
  /** Snapshot of the learned pool size and of mastered keys, taken whenever key stats change. */
  learned: number
  mastered: number
  /** WPM of each reference session recorded that day (Reto, Velocidad text, race). Survives the sessions cap. */
  reference: number[]
  /** Sessions recorded that day. */
  sessions: number
}

export type Days = Record<string, DaySummary>

const empty = (): DaySummary => ({ seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 0 })

/** Fold one finished session into its day; `referenceWpm` is given only for reference sessions. */
export function addSession(days: Days, day: string, seconds: number, referenceWpm?: number): Days {
  const prev = days[day] ?? empty()
  return {
    ...days,
    [day]: {
      ...prev,
      seconds: prev.seconds + Math.max(0, seconds),
      sessions: prev.sessions + 1,
      reference: referenceWpm === undefined ? prev.reference : [...prev.reference, referenceWpm],
    },
  }
}
```

Borrar `addSeconds`. `setBlocks` y `setSnapshot` quedan igual (usan `empty()`).

- [x] **Step 4: Tests de la migración v3**

En `src/app/store/migrate.test.ts`, agregar. La migración ahora es en cadena, así que los tests v1 → v2 existentes cambian sus expectativas: el primero (`marks challenge sessions as reference…`) pasa a esperar `v2.settings` igual a `{ name: 'Seba', lastBackupAt: null }` y `v2.days` igual a `{ '2026-09-10': { seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [22], sessions: 2 } }` (las dos sesiones son del 2026-09-10 a las 15:00Z: en zonas horarias de UTC−11 a UTC+8 el día local es el mismo; para que el test no dependa de la zona, cambiar sus `at` a mediodía local con el helper `noon` de abajo). El de `leaves a current state untouched` pasa a usar `version: 3` con un estado v3, y el de `tolerates an empty persisted state` espera `{ sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }`.

```ts
describe('store migration v2 → v3', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`).toISOString() // local noon: the local day is unambiguous
  it('backfills reference speeds and session counts per local day, adds legacy and lastBackupAt', () => {
    const v2 = {
      settings: { name: 'Seba' },
      sessions: [
        { at: noon('2026-09-10'), kind: 'lesson', wpm: 40, acc: 1, chars: 20, errors: 0, seconds: 6 },
        { at: noon('2026-09-10'), kind: 'challenge', wpm: 22, acc: 0.97, chars: 110, errors: 3, seconds: 60, reference: true },
        { at: noon('2026-09-11'), kind: 'game', wpm: 25, acc: 0.98, chars: 100, errors: 2, seconds: 50, reference: true },
      ],
      days: { '2026-09-10': { seconds: 66, blocks: 2, learned: 8, mastered: 3 } },
    }
    const v3 = migrateState(v2, 2) as {
      settings: { name: string; lastBackupAt: string | null }
      days: Record<string, { seconds: number; blocks: number; learned: number; mastered: number; reference: number[]; sessions: number }>
      legacy: unknown
    }
    expect(v3.days['2026-09-10']).toEqual({ seconds: 66, blocks: 2, learned: 8, mastered: 3, reference: [22], sessions: 2 })
    expect(v3.days['2026-09-11']).toEqual({ seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [25], sessions: 1 })
    expect(v3.legacy).toBeNull()
    expect(v3.settings.lastBackupAt).toBeNull()
  })

  it('chains v1 → v2 → v3', () => {
    const v1 = { sessions: [{ at: noon('2026-09-10'), kind: 'challenge', wpm: 22, acc: 1, chars: 10, errors: 0, seconds: 60 }] }
    const v3 = migrateState(v1, 1) as { days: Record<string, { reference: number[] }>; sessions: { reference?: true }[] }
    expect(v3.sessions[0].reference).toBe(true)
    expect(v3.days['2026-09-10'].reference).toEqual([22])
  })

  it('leaves a v3 state untouched', () => {
    const v3 = { sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }
    expect(migrateState(v3, 3)).toBe(v3)
  })
})
```

Cambiar el test existente `'leaves a current state untouched'` para que pase `version: 3` con un estado v3, y el de `'tolerates an empty persisted state'` para esperar `{ sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }`.

- [x] **Step 5: Correr y ver fallar**

Run: `npx vitest run src/app/store/migrate.test.ts`
Expected: FAIL.

- [x] **Step 6: Implementar `migrate.ts`**

```ts
import { dayKey } from '@/engine/stats'

interface PersistedSession {
  at: string
  kind: string
  wpm: number
  reference?: true
}

interface PersistedDay {
  seconds: number
  blocks: number
  learned: number
  mastered: number
  reference?: number[]
  sessions?: number
}

interface Persisted {
  settings?: Record<string, unknown>
  sessions?: PersistedSession[]
  days?: Record<string, PersistedDay>
  legacy?: unknown
}

/** v1 → v2: Retos count toward the reference speed (`reference: true`); the store gains `days`. */
function toV2(s: Persisted): Persisted {
  const sessions = (s.sessions ?? []).map((r) => (r.kind === 'challenge' ? { ...r, reference: true as const } : r))
  return { ...s, sessions, days: {} }
}

/** v2 → v3: each day keeps its reference speeds and session count (backfilled from sessions); `legacy`; `settings.lastBackupAt`. */
function toV3(s: Persisted): Persisted {
  const days: Record<string, PersistedDay> = {}
  for (const [d, row] of Object.entries(s.days ?? {})) days[d] = { ...row, reference: [], sessions: 0 }
  for (const r of s.sessions ?? []) {
    const d = dayKey(new Date(r.at))
    const prev = days[d] ?? { seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 0 }
    days[d] = {
      ...prev,
      sessions: (prev.sessions ?? 0) + 1,
      reference: r.reference ? [...(prev.reference ?? []), r.wpm] : prev.reference ?? [],
    }
  }
  return { ...s, days, legacy: null, settings: { ...(s.settings ?? {}), lastBackupAt: null } }
}

export function migrateState(persisted: unknown, version: number): unknown {
  let s = (persisted ?? {}) as Persisted
  if (version < 2) s = toV2(s)
  if (version < 3) s = toV3(s)
  return version >= 3 ? persisted : s
}
```

- [x] **Step 7: Store `index.ts`**

Cambios en `src/app/store/index.ts`:

```ts
import { addSession, bumpStreak, dayKey, setBlocks, setSnapshot, updateKeyStats, type Days, type KeyStats, type Stars, type Streak } from '@/engine/stats'

export interface Settings {
  name: string
  layoutId: LayoutId
  sound: boolean
  showHands: boolean
  onboarded: boolean
  theme: Theme
  /** ISO of the last downloaded backup, for the reminder. */
  lastBackupAt: string | null
}

/** The one-minute test typed "the old way", before TypeLight: the bar the new fingering has to beat. */
export interface Legacy {
  wpm: number
  acc: number
  at: string
  /** Day the 7-day reference median first reached `wpm`. */
  beatenAt?: string
  /** The celebration card was closed. */
  beatenSeen?: true
}
```

En `State`: agregar `legacy: Legacy | null` y `setLegacy: (legacy: Legacy | null) => void`. En el `create`: `settings: { …, lastBackupAt: null }`, `legacy: null`, y

```ts
      recordSession: (rec, samples) =>
        set((s) => {
          const today = dayKey()
          const sessions = [...s.sessions, { ...rec, at: new Date().toISOString() }].slice(-1000)
          return {
            sessions,
            keys: samples ? updateKeyStats(s.keys, samples) : s.keys,
            streak: bumpStreak(s.streak, today),
            days: addSession(s.days, today, rec.seconds, rec.reference ? rec.wpm : undefined),
          }
        }),

      setLegacy: (legacy) => set({ legacy }),
```

`resetProgress` **no** toca `legacy` (es una medición de antes, no progreso). Versión: `version: 3`. Al final del archivo:

```ts
export const PERSISTED_KEYS = ['settings', 'lessons', 'keys', 'sessions', 'streak', 'routine', 'days', 'legacy'] as const
export type PersistedState = Pick<State, (typeof PERSISTED_KEYS)[number]>

/** The data half of the store, exactly what persist writes. */
export function persistedState(s: State): PersistedState {
  return { settings: s.settings, lessons: s.lessons, keys: s.keys, sessions: s.sessions, streak: s.streak, routine: s.routine, days: s.days, legacy: s.legacy }
}

/** Replace the data half wholesale (backup import); persist saves it on the next tick. */
export function importState(state: PersistedState): void {
  useStore.setState(state)
}
```

- [x] **Step 8: e2e `stats.spec.ts`: la versión guardada es 3**

Cambiar `expect(stored.version).toBe(2)` por `expect(stored.version).toBe(3)` y agregar debajo:

```ts
  expect(stored.state.days[today.slice(0, 10)].reference).toEqual([30])
```

(`today` ya está en el spec como ISO al mediodía local; `slice(0, 10)` del ISO es UTC — reemplazar por el día local: agregar arriba del test `const localDay = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }` y usar `localDay(today)`.)

- [x] **Step 9: Verificar**

Run: `npx tsc -b && npm run lint && npm test`
Expected: todo verde (los tests de `progress.test.ts` siguen pasando porque `referenceByDay` todavía lee sesiones; cambia en la Task 3).

- [x] **Step 10: Commit**

```bash
git add src/engine/stats/days.ts src/engine/stats/days.test.ts src/app/store e2e/stats.spec.ts
git commit -m "feat(store): v3 — per-day reference speeds and session counts, legacy speed, last backup

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: La referencia se lee de `days`; `legacyBeaten`

**Files:**
- Modify: `src/engine/stats/progress.ts`, `src/engine/stats/progress.test.ts`
- Modify: `src/app/routes/Stats.tsx`, `src/app/routes/Home.tsx`

**Interfaces:**
- Consumes: `Days`/`DaySummary` de la Task 2.
- Produces: `referenceByDay(days: Days): DayPoint[]`; `legacyBeaten(points: DayPoint[], legacyWpm: number): boolean`.

- [x] **Step 1: Tests**

En `progress.test.ts`, reemplazar el `describe` de `referenceByDay` para que reciba `days`:

```ts
describe('referenceByDay from days', () => {
  it('folds each day to the median of its reference speeds, oldest first, skipping days without one', () => {
    const days: Days = {
      '2026-09-12': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [20, 30, 26], sessions: 3 },
      '2026-09-10': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [22], sessions: 1 },
      '2026-09-11': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [], sessions: 2 },
    }
    expect(referenceByDay(days)).toEqual([
      { day: '2026-09-10', wpm: 22, n: 1 },
      { day: '2026-09-12', wpm: 26, n: 3 },
    ])
  })
})

describe('legacyBeaten', () => {
  const p = (day: string, wpm: number) => ({ day, wpm, n: 1 })
  it('needs at least three days and a 7-day median at or above the legacy speed', () => {
    expect(legacyBeaten([p('2026-09-10', 50)], 40)).toBe(false)
    expect(legacyBeaten([p('2026-09-10', 30), p('2026-09-11', 45), p('2026-09-12', 44)], 40)).toBe(true)
    expect(legacyBeaten([p('2026-09-10', 30), p('2026-09-11', 45), p('2026-09-12', 39)], 40)).toBe(false)
  })
  it('only looks at the last seven days with data', () => {
    const old = Array.from({ length: 7 }, (_, i) => p(`2026-09-0${i + 1}`, 10))
    const recent = Array.from({ length: 7 }, (_, i) => p(`2026-09-1${i + 1}`, 45))
    expect(legacyBeaten([...old, ...recent], 40)).toBe(true)
  })
})
```

Ajustar los tests de `referenceHeadline` que construían puntos vía `referenceByDay(sessions)` para construir los `DayPoint` a mano o vía `days`.

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/engine/stats/progress.test.ts`
Expected: FAIL.

- [x] **Step 3: Implementar**

En `progress.ts`, reemplazar `referenceByDay`:

```ts
/** Reference sessions (Reto, Velocidad texts, race) folded to one point per local day: the median. Oldest first. */
export function referenceByDay(days: Days): DayPoint[] {
  return Object.entries(days)
    .filter(([, d]) => d.reference.length > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, d]) => ({ day, wpm: median(d.reference), n: d.reference.length }))
}

/** True once the median of the last seven days with data (at least three) reaches the speed typed "the old way". */
export function legacyBeaten(points: DayPoint[], legacyWpm: number): boolean {
  const recent = points.slice(-7)
  if (recent.length < 3) return false
  return median(recent.map((p) => p.wpm)) >= legacyWpm
}
```

`SessionLike` deja de necesitar `reference` para este cálculo pero se conserva (lo usan `weeklyAccuracy` y `rhythmHeadline`).

- [x] **Step 4: Consumidores**

`Stats.tsx`: `const points = useMemo(() => referenceByDay(days), [days])`. `Home.tsx`: `const days = useStore((s) => s.days)`, `const reference = referenceHeadline(referenceByDay(days))`, y "Ejercicios":

```tsx
  const exercises = Object.values(days).reduce((a, d) => a + d.sessions, 0)
  …
              <dd className="font-display text-3xl font-extrabold">{exercises}</dd>
```

- [x] **Step 5: Verificar**

Run: `npx tsc -b && npm run lint && npm test`
Expected: verde.

- [x] **Step 6: Commit**

```bash
git add src/engine/stats src/app/routes/Stats.tsx src/app/routes/Home.tsx
git commit -m "feat(stats): reference speed read from per-day summaries (survives the sessions cap); legacyBeaten

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Exportar / importar progreso

**Files:**
- Create: `src/app/lib/backup.ts`, `src/app/lib/backup.test.ts`
- Modify: `src/app/routes/Settings.tsx`, `src/app/routes/Home.tsx`
- Create: `e2e/backup.spec.ts`

**Interfaces:**
- Consumes: `PersistedState`, `persistedState`, `importState`, `migrateState`.
- Produces: `BACKUP_VERSION = 3`; `serializeBackup(state, now?)`; `parseBackup(text)`; `backupFilename(now?)`; `backupDue(lastBackupAt, today, activeDays)`; `downloadText(filename, text)`.

- [x] **Step 1: Tests de la lib**

`src/app/lib/backup.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { backupDue, backupFilename, parseBackup, serializeBackup } from './backup'
import type { PersistedState } from '../store'

const state: PersistedState = {
  settings: { name: 'Seba', layoutId: 'latam', sound: true, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
  lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' } },
  keys: { f: { latencyEma: 300, errorEma: 0, samples: 12 } },
  sessions: [],
  streak: { count: 2, lastDay: '2026-09-17' },
  routine: { day: '2026-09-17', warmup: true, lesson: false, review: false, challenge: false },
  days: { '2026-09-17': { seconds: 40, blocks: 1, learned: 3, mastered: 1, reference: [], sessions: 1 } },
  legacy: null,
}

describe('backup', () => {
  it('round-trips the persisted state', () => {
    const text = serializeBackup(state, new Date('2026-09-17T15:00:00Z'))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.state).toEqual(state)
      expect(parsed.exportedAt).toBe('2026-09-17T15:00:00.000Z')
    }
  })

  it('migrates an older backup on import', () => {
    const v2 = JSON.stringify({ app: 'typelight', version: 2, exportedAt: 'x', state: { settings: { name: 'S' }, sessions: [], days: {} } })
    const parsed = parseBackup(v2)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.state.legacy).toBeNull()
  })

  it('rejects things that are not a TypeLight backup', () => {
    expect(parseBackup('hola').ok).toBe(false)
    expect(parseBackup('{"app":"otra","version":1,"state":{}}').ok).toBe(false)
    expect(parseBackup('{"app":"typelight","version":99,"state":{}}').ok).toBe(false)
  })

  it('names the file by local day', () => {
    expect(backupFilename(new Date(2026, 8, 17, 9))).toBe('typelight-progreso-2026-09-17.json')
  })

  it('is due after 30 days, or with two weeks of activity and no backup yet', () => {
    expect(backupDue(null, '2026-09-17', 3)).toBe(false)
    expect(backupDue(null, '2026-09-17', 14)).toBe(true)
    expect(backupDue('2026-08-01T12:00:00.000Z', '2026-09-17', 1)).toBe(true)
    expect(backupDue('2026-09-10T12:00:00.000Z', '2026-09-17', 40)).toBe(false)
  })
})
```

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/app/lib/backup.test.ts`
Expected: FAIL (módulo inexistente).

- [x] **Step 3: Implementar `backup.ts`**

```ts
import { dayKey, daysBetween } from '@/engine/stats'
import { migrateState } from '../store/migrate'
import type { PersistedState } from '../store'

export const BACKUP_VERSION = 3

export interface Backup {
  app: 'typelight'
  version: number
  exportedAt: string
  state: PersistedState
}

export type ParsedBackup = { ok: true; state: PersistedState; exportedAt: string } | { ok: false; error: string }

export function backupFilename(now: Date = new Date()): string {
  return `typelight-progreso-${dayKey(now)}.json`
}

export function serializeBackup(state: PersistedState, now: Date = new Date()): string {
  const backup: Backup = { app: 'typelight', version: BACKUP_VERSION, exportedAt: now.toISOString(), state }
  return JSON.stringify(backup, null, 2)
}

/** Validate and (if older) migrate a backup file's text. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'No parece una copia de TypeLight: el archivo no es JSON.' }
  }
  const b = raw as Partial<Backup> | null
  if (!b || b.app !== 'typelight' || typeof b.version !== 'number' || !b.state || typeof b.state !== 'object') {
    return { ok: false, error: 'No parece una copia de TypeLight.' }
  }
  if (b.version > BACKUP_VERSION) {
    return { ok: false, error: `La copia es de una versión más nueva (${b.version}) que esta app (${BACKUP_VERSION}).` }
  }
  const state = migrateState(b.state, b.version) as PersistedState
  return { ok: true, state, exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : '' }
}

/** A reminder is due 30 days after the last backup, or after two weeks of activity without one. */
export function backupDue(lastBackupAt: string | null | undefined, today: string, activeDays: number): boolean {
  if (!lastBackupAt) return activeDays >= 14
  return daysBetween(dayKey(new Date(lastBackupAt)), today) >= 30
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

- [x] **Step 4: Correr tests**

Run: `npx vitest run src/app/lib/backup.test.ts`
Expected: PASS.

- [x] **Step 5: Tarjeta "Tu progreso" en Ajustes**

En `Settings.tsx`, imports nuevos: `useRef, type ChangeEvent` de react; `backupFilename, downloadText, parseBackup, serializeBackup` de `../lib/backup`; `importState, persistedState, type PersistedState` de `../store`. Componente (fuera de `Settings`):

```tsx
function BackupCard() {
  const lastBackupAt = useStore((s) => s.settings.lastBackupAt)
  const setSettings = useStore((s) => s.setSettings)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<{ state: PersistedState; when: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const download = () => {
    const now = new Date()
    downloadText(backupFilename(now), serializeBackup(persistedState(useStore.getState()), now))
    setSettings({ lastBackupAt: now.toISOString() })
    setMessage('Copia descargada.')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (!parsed.ok) {
      setMessage(parsed.error)
      return
    }
    const when = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleDateString('es-AR') : 'sin fecha'
    setPending({ state: parsed.state, when })
    setMessage(null)
  }

  const confirmImport = () => {
    if (!pending) return
    importState(pending.state)
    setMessage(`Progreso restaurado desde la copia del ${pending.when}.`)
    setPending(null)
  }

  const last = lastBackupAt ? `Última copia: ${new Date(lastBackupAt).toLocaleDateString('es-AR')}.` : 'Todavía no guardaste ninguna copia.'

  return (
    <div className="rounded-xl bg-paper px-4 py-3" data-testid="backup-card">
      <span className="block font-bold">Tu progreso</span>
      <span className="block text-sm text-ink-soft">Vive solo en este navegador. Una copia en un archivo lo protege de cualquier limpieza. {last}</span>
      <div className="mt-3 flex flex-wrap gap-2">
        <Keycap variant="secondary" size="sm" onClick={download}>
          Descargar copia
        </Keycap>
        <Keycap variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          Importar copia…
        </Keycap>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onFile} data-testid="backup-file" />
      </div>
      {pending && (
        <div className="mt-3 rounded-lg border-2 border-sun bg-sun-soft/60 px-3 py-2 text-sm">
          Reemplaza el progreso actual por el de la copia del {pending.when}. ¿Seguir?
          <div className="mt-2 flex gap-2">
            <Keycap variant="primary" size="sm" onClick={confirmImport}>
              Sí, reemplazar
            </Keycap>
            <Keycap variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancelar
            </Keycap>
          </div>
        </div>
      )}
      {message && <p className="mt-2 text-sm font-bold text-ink-soft">{message}</p>}
    </div>
  )
}
```

Insertar `<BackupCard />` justo antes del bloque "Reiniciar progreso". En ese bloque, cuando `confirm` es `true`, mostrar además un botón `Descargar copia` (mismo `download`, extraído a una función compartida `downloadBackup(setSettings)` en el mismo archivo) si `lastBackupAt` es `null` o no es de hoy:

```tsx
                  {(!settings.lastBackupAt || dayKey(new Date(settings.lastBackupAt)) !== dayKey()) && (
                    <Keycap variant="secondary" size="sm" onClick={() => downloadBackup(setSettings)}>
                      Antes, descargar copia
                    </Keycap>
                  )}
```

(`dayKey` importado de `@/engine/stats`.)

- [x] **Step 6: Recordatorio en Inicio**

En `Home.tsx`: `const lastBackupAt = useStore((s) => s.settings.lastBackupAt)`, `const activeDays = Object.values(days).filter((d) => d.seconds > 0).length`, y debajo del `<header>`:

```tsx
      {backupDue(lastBackupAt, dayKey(), activeDays) && (
        <p className="mb-6 rounded-xl bg-sun-soft/60 px-4 py-2 text-sm font-semibold text-ink-soft" data-testid="backup-reminder">
          {lastBackupAt ? 'Hace más de un mes que no guardás una copia de tu progreso.' : 'Tu progreso vive solo en este navegador.'}{' '}
          <Link to="/ajustes" className="font-bold text-mod-edge underline">
            Ajustes → Descargar copia
          </Link>
        </p>
      )}
```

- [x] **Step 7: e2e**

`e2e/backup.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const seed = {
  state: {
    settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
    lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' } },
    keys: {},
    sessions: [],
    streak: { count: 0, lastDay: null },
    routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
    days: {},
    legacy: null,
  },
  version: 3,
}

test('backup: download → reset → import restores the progress', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((s) => localStorage.setItem('typelight.v1', JSON.stringify(s)), seed)
  await page.goto('/ajustes')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar copia' }).click()
  const download = await downloadPromise
  const path = await download.path()
  expect(path).toBeTruthy()
  const backup = JSON.parse(readFileSync(path!, 'utf8'))
  expect(backup.app).toBe('typelight')
  expect(backup.state.lessons['guia-tip-intro'].stars).toBe(3)
  await expect(page.getByText('Copia descargada.')).toBeVisible()

  await page.getByRole('button', { name: 'Reiniciar…' }).click()
  await page.getByRole('button', { name: 'Sí, borrar todo' }).click()
  let stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons).toEqual({})

  await page.getByTestId('backup-file').setInputFiles(path!)
  await page.getByRole('button', { name: 'Sí, reemplazar' }).click()
  await expect(page.getByText(/Progreso restaurado/)).toBeVisible()
  stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})
```

- [x] **Step 8: Verificar**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/backup.spec.ts`
Expected: verde.

- [x] **Step 9: Commit**

```bash
git add src/app/lib/backup.ts src/app/lib/backup.test.ts src/app/routes/Settings.tsx src/app/routes/Home.tsx e2e/backup.spec.ts
git commit -m "feat: download and import a JSON backup of the progress; reminder on Home; copy before reset

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: El reloj no corre con la pestaña oculta

**Files:**
- Modify: `src/engine/typing/index.ts`, `src/engine/typing/typing.test.ts`
- Modify: `src/app/hooks/useTypingSession.ts`
- Create: `src/app/hooks/useTypingSession.test.ts`

**Interfaces:**
- Produces: `typeChar(s, ch, t, afterPause = false)`, `typeText(s, text, t, afterPause = false)` — con `afterPause`, la latencia del primer carácter es `MAX_LATENCY`.

- [x] **Step 1: Test del motor**

En `typing.test.ts`:

```ts
it('caps the latency of the first key after a pause', () => {
  let s = createSession('ab')
  s = typeChar(s, 'a', 1000)
  s = typeText(s, 'b', 1300, true)
  expect(s.keystrokes[1].latency).toBe(MAX_LATENCY)
  expect(s.finishedAt).toBe(1300)
})
```

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/engine/typing/typing.test.ts`
Expected: FAIL (tipos: `typeText` no acepta un cuarto argumento).

- [x] **Step 3: Implementar**

```ts
/** Feed one character (may be a multi-char string; processed sequentially). `afterPause` caps the first latency. */
export function typeText(s: TypingState, text: string, t: number, afterPause = false): TypingState {
  let next = s
  let first = true
  for (const ch of text) {
    next = typeChar(next, ch, t, afterPause && first)
    first = false
  }
  return next
}

export function typeChar(s: TypingState, ch: string, t: number, afterPause = false): TypingState {
  if (s.finishedAt !== null || s.pos >= s.target.length) return s
  const expected = s.target[s.pos]
  const correct = ch === expected
  const prev = s.keystrokes[s.keystrokes.length - 1]
  // A gap that spans a hidden tab is a pause, not typing.
  const latency = prev ? (afterPause ? MAX_LATENCY : Math.min(t - prev.t, MAX_LATENCY)) : undefined
  …resto igual
```

- [x] **Step 4: Test del hook**

`src/app/hooks/useTypingSession.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_LATENCY, metrics } from '@/engine/typing'
import { useTypingSession } from './useTypingSession'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useTypingSession', () => {
  afterEach(() => {
    setHidden(false)
    vi.restoreAllMocks()
  })

  it('does not count time while the tab is hidden and caps the latency across the pause', () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTypingSession('abc', { sound: false }))
    act(() => result.current.input('a'))
    now = 1200
    act(() => setHidden(true))
    now = 6200
    act(() => setHidden(false))
    now = 6400
    act(() => result.current.input('b'))
    expect(result.current.state.keystrokes[1].latency).toBe(MAX_LATENCY)
    // 200 ms before hiding + 200 ms after: the five hidden seconds are not typing time.
    expect(metrics(result.current.state).seconds).toBeCloseTo(0.4, 1)
  })
})
```

- [x] **Step 5: Correr y ver fallar**

Run: `npx vitest run src/app/hooks/useTypingSession.test.ts`
Expected: FAIL (`seconds` ≈ 5.4).

- [x] **Step 6: Implementar en el hook**

En `useTypingSession.ts`, después de `const limit = opts.timeLimitMs`:

```ts
  // Session clock = wall clock minus the time the tab spent hidden: the Reto's minute doesn't run while you're away.
  const hiddenMs = useRef(0)
  const hiddenFrom = useRef<number | null>(null)
  const resumed = useRef(false)
  const clock = useCallback(() => (hiddenFrom.current ?? performance.now()) - hiddenMs.current, [])
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (hiddenFrom.current === null) hiddenFrom.current = performance.now()
      } else if (hiddenFrom.current !== null) {
        hiddenMs.current += performance.now() - hiddenFrom.current
        hiddenFrom.current = null
        resumed.current = true
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
```

En el efecto del reloj: `const t = clock()` en vez de `performance.now()` (y `clock` en las dependencias). En `input`: `const now = clock()` y `const next = typeText(s, text, now, resumed.current); resumed.current = false`. En `restart`: antes de `setState`, `hiddenMs.current = 0; resumed.current = false`.

- [x] **Step 7: Verificar**

Run: `npx tsc -b && npm run lint && npm test`
Expected: verde, sin advertencias nuevas de lint.

- [x] **Step 8: Commit**

```bash
git add src/engine/typing src/app/hooks/useTypingSession.ts src/app/hooks/useTypingSession.test.ts
git commit -m "fix(typing): the session clock pauses while the tab is hidden; the gap across a pause is capped

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: El Reto sin frases repetidas — `pickSentences` y `challengeText`

**Files:**
- Modify: `src/engine/generator/index.ts`, `src/engine/generator/generator.test.ts`
- Modify: `src/app/routes/Practice.tsx`

**Interfaces:**
- Produces: `pickSentences(pool, count, opts?): string[]` (distintas); `sentencesText` la usa; `challengeText(pool, opts?: GenOpts & { minChars?: number }): string`.

- [x] **Step 1: Tests**

En `generator.test.ts`:

```ts
  it('pickSentences never repeats a sentence within one call', () => {
    const pool = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const picked = pickSentences(pool, 10, { rng: makeRng(11) })
    expect(picked).toHaveLength(10)
    expect(new Set(picked).size).toBe(10)
  })

  it('challengeText reaches the minimum length with distinct sentences, or words when none fit', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const t = challengeText(full, { rng: makeRng(12) })
    expect(t.length).toBeGreaterThanOrEqual(420)
    const sentences = t.split(/(?<=[.?!]) /)
    expect(new Set(sentences).size).toBe(sentences.length)
    const fj = challengeText(poolOf('fj'), { rng: makeRng(13) })
    expect(only(fj, 'fj ')).toBe(true)
    expect(fj.length).toBeGreaterThanOrEqual(420)
  })
```

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/engine/generator/generator.test.ts`
Expected: FAIL.

- [x] **Step 3: Implementar**

Reemplazar `sentencesText` en `generator/index.ts` por:

```ts
/** Distinct real sentences typable with the pool, up to `count`. Empty when none fit. */
export function pickSentences(
  pool: ReadonlySet<string>,
  count: number,
  opts: GenOpts & { corpus?: SentenceCorpus } = {},
): string[] {
  const rng = opts.rng ?? makeRng()
  const source = CORPORA[opts.corpus ?? 'general']
  const fits = source.filter((s) => usesOnly(s, pool))
  return rng.shuffle([...fits]).slice(0, count)
}

/** Real sentences typable with the pool, joined. Returns '' if none fit, so callers can fall back. */
export function sentencesText(
  pool: ReadonlySet<string>,
  count = 2,
  opts: GenOpts & { corpus?: SentenceCorpus } = {},
): string {
  return pickSentences(pool, count, opts).join(' ')
}

/** A Reto's text: distinct sentences until `minChars`, topped up with words; words only when no sentence fits. */
export function challengeText(pool: ReadonlySet<string>, opts: GenOpts & { minChars?: number } = {}): string {
  const rng = opts.rng ?? makeRng()
  const min = opts.minChars ?? 420
  const out: string[] = []
  let total = 0
  for (const s of pickSentences(pool, 12, { rng })) {
    if (total >= min) break
    out.push(s)
    total += s.length + 1
  }
  let guard = 0
  while (total < min && guard++ < 12) {
    const w = wordsText(pool, 20, { rng })
    out.push(w)
    total += w.length + 1
  }
  return out.join(' ')
}
```

(`pickSentences` se re-escribe en la Task 8 para ponderar y normalizar; acá alcanza con "distintas".)

- [x] **Step 4: Usarlo en `Practice.tsx`**

Reemplazar el bloque del Reto en el `useMemo` de `text`:

```ts
    if (joined) return drillText(learned, 12, { rng, joined })
    return challengeText(pool, { rng })
```

Importar `challengeText` y quitar `sentencesText` del import si queda sin uso.

- [x] **Step 5: Verificar**

Run: `npx tsc -b && npm run lint && npm test`
Expected: verde.

- [x] **Step 6: Commit**

```bash
git add src/engine/generator src/app/routes/Practice.tsx
git commit -m "fix(reto): distinct sentences within one Reto; challengeText in the engine

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Fixes chicos y `next` robusto

**Files:**
- Modify: `src/app/routes/LessonPlayer.tsx:149-155` (`completeTip`)
- Modify: `src/app/routes/Home.tsx` (precisión, "~1 min", `data-done`)
- Modify: `src/engine/curriculum/index.ts` (`nextLesson`), `src/engine/curriculum/curriculum.test.ts`
- Modify: `src/app/hooks/useCurriculum.ts`
- Create: `e2e/tip.spec.ts`

**Interfaces:**
- Produces: `nextLesson(c: Curriculum, completedIds: Set<string>): Lesson | undefined` — primera no completada con índice mayor al de la última completada; si no hay, la primera no completada.

- [x] **Step 1: Test de `nextLesson`**

En `curriculum.test.ts`:

```ts
  it('nextLesson moves past the last completed lesson, even if an earlier one is pending', () => {
    const c = buildCurriculum(LATAM)
    expect(nextLesson(c, new Set())?.index).toBe(0)
    const done = new Set([c.lessons[0].id, c.lessons[1].id, c.lessons[3].id])
    expect(nextLesson(c, done)?.index).toBe(4)
    const all = new Set(c.lessons.map((l) => l.id))
    all.delete(c.lessons[2].id)
    expect(nextLesson(c, all)?.index).toBe(2)
    expect(nextLesson(c, new Set(c.lessons.map((l) => l.id)))).toBeUndefined()
  })
```

(`nextLesson` se importa desde `./index`.)

- [x] **Step 2: Correr y ver fallar**

Run: `npx vitest run src/engine/curriculum/curriculum.test.ts`
Expected: FAIL en el segundo `expect` (hoy devuelve el índice 2).

- [x] **Step 3: Implementar**

En `curriculum/index.ts`:

```ts
/**
 * The lesson to open next: the first pending one after the last completed lesson, so inserting a lesson
 * earlier in the path never sends the learner back; only when nothing is pending ahead, the first pending one.
 */
export function nextLesson(c: Curriculum, completedIds: Set<string>): Lesson | undefined {
  let lastIndex = -1
  for (const l of c.lessons) if (completedIds.has(l.id)) lastIndex = l.index
  return c.lessons.find((l) => l.index > lastIndex && !completedIds.has(l.id)) ?? c.lessons.find((l) => !completedIds.has(l.id))
}
```

En `useCurriculum.ts`: `import { curriculumFor, nextLesson, … }` y `const next = nextLesson(curriculum, completed)`.

- [x] **Step 4: Tip sin bloque; Home**

`LessonPlayer.tsx`, `completeTip`:

```ts
  // A tip is reading, not practice: it completes but does not fill the routine's Lección card.
  const completeTip = () => {
    completeLesson(lesson.id, 3, 0, 1)
    if (nextLesson) navigate(`/leccion/${nextLesson.id}`)
    else navigate('/ruta')
  }
```

`Home.tsx`: en `BLOCKS`, `minutes: '~1 min'` para `warmup`; reemplazar `recentAcc` por

```ts
  const weekly = weeklyAccuracy(sessions, dayKey())
```

y en el `<dd>` correspondiente `{weekly ? `${Math.round(weekly.acc * 100)} %` : '—'}` con `<dt>` "Precisión · 7 días" (importar `weeklyAccuracy` de `@/engine/stats`; borrar `recent`/`recentAcc`). En el `<Link>` de cada tarjeta de la rutina agregar `data-testid={`routine-${b.id}`}` y `data-done={done ? 'true' : 'false'}`.

- [x] **Step 5: e2e del tip**

`e2e/tip.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('a tip completes but does not fill the routine Lección card', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: {}, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    ),
  )
  await page.goto('/leccion/guia-tip-intro')
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Siguiente/ }).click()
  await page.getByRole('button', { name: /Entendido/ }).click()
  await expect(page).toHaveURL(/leccion\/guia-66-6a-keys/)
  await page.goto('/')
  await expect(page.getByTestId('routine-lesson')).toHaveAttribute('data-done', 'false')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('typelight.v1')!))
  expect(stored.state.lessons['guia-tip-intro'].stars).toBe(3)
})
```

- [x] **Step 6: Verificar**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/tip.spec.ts e2e/flow.spec.ts`
Expected: verde (`flow.spec.ts` sigue pasando: el tip auto-avanza igual que antes).

- [x] **Step 7: Commit**

```bash
git add src/app/routes/LessonPlayer.tsx src/app/routes/Home.tsx src/engine/curriculum src/app/hooks/useCurriculum.ts e2e/tip.spec.ts
git commit -m "fix: tips no longer fill the routine Lección; weekly accuracy on Home; next lesson never goes back

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Corpus de frases por etapa

**Files:**
- Create: `scripts/corpus_common.py`, `scripts/build-sentences.py`
- Modify: `scripts/build-corpus.py` (importar `BLOCK`, `STRIP` desde `corpus_common`)
- Generate: `src/engine/corpus/sentences.generated.ts`
- Modify: `src/engine/corpus/sentences.ts` (+100 frases de la casa)
- Modify: `src/engine/generator/index.ts`, `src/engine/generator/generator.test.ts`

**Interfaces:**
- Produces: `GENERATED_SENTENCES: string[]`; `fitSentence(s: string, pool: ReadonlySet<string>): string | null`; `pickSentences` ponderado (casa ×3) y normalizado.

- [x] **Step 1: `corpus_common.py`**

Crear `scripts/corpus_common.py`: mover ahí, **textualmente**, el bloque `BLOCK = set("""…""".split())` de `build-corpus.py` y `STRIP`, y agregar:

```python
import json

STRIP = str.maketrans('áéíóúü', 'aeiouu')

# (BLOCK pegado acá, sin cambios)

# First names that survive the dictionary check or start a sentence capitalised.
NAMES = set("""
tom mary maría maria juan pedro ana josé jose luis carlos jorge marta laura elena pablo miguel lucía lucia sofía sofia diego
pepe paco manolo ken taro yumi bob john jack alicia beatriz carmen claudia cristina daniel david eduardo emilio enrique
fernando francisco gabriel gonzalo guillermo ignacio isabel javier jesús jesus joaquín joaquin julia julio lola lorenzo
manuel marcos mario mercedes nicolás nicolas pilar rafael ramón ramon raúl raul roberto rosa sara sergio susana teresa
tomás tomas vicente víctor victor alejandro andrés andres antonio ángel angel alberto
""".split())


def load_dictionary(path):
    return set(json.load(open(path, encoding='utf8')))
```

En `build-corpus.py`: borrar el bloque `BLOCK` y `STRIP`, agregar `from corpus_common import BLOCK, STRIP, load_dictionary` y `dictionary = load_dictionary(dict_path)`. (Esto cambia el hash del script que menciona el handoff como condición de caducidad del filtro del corpus; la condición sigue valiendo en espíritu: el filtro es el mismo.)

- [x] **Step 2: `build-sentences.py`**

```python
"""Builds src/engine/corpus/sentences.generated.ts from Tatoeba's Spanish sentences.

Inputs (download to scripts/, or pass paths):
  spa_sentences.tsv(.bz2) - https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2 (CC BY 2.0 FR)
  dict.json               - words/an-array-of-spanish-words (accent-stripped dictionary, used as whitelist)
"""
import bz2, json, os, random, re, sys
from corpus_common import BLOCK, NAMES, STRIP, load_dictionary

here = os.path.dirname(os.path.abspath(__file__))
src_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, 'spa_sentences.tsv.bz2')
dict_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, 'dict.json')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'sentences.generated.ts')

QUOTA, MIN_PLAIN, MIN_QUESTION = 1500, 400, 300
dictionary = load_dictionary(dict_path)

ALLOWED = re.compile(r"^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ ,.;:¿?¡!'\"()-]+$")
ACCENT = re.compile(r'[áéíóúü]')
QUESTION = re.compile(r'[¿?¡!]')
VOSOTROS = re.compile(r'\b(vosotros|vosotras|vuestr[oa]s?|os)\b|(áis|éis)\b')
CAPITAL = re.compile(r'[A-ZÁÉÍÓÚÜÑ]')
WORD = re.compile(r'[a-záéíóúüñ]+')


def ok(s):
    if not (40 <= len(s) <= 90) or not ALLOWED.match(s):
        return False
    if not s[0].isupper() or s[-1] not in '.?!':
        return False
    for m in CAPITAL.finditer(s):
        i = m.start()
        if i == 0:
            continue
        before = s[:i].rstrip()
        if before and before[-1] in '¿¡.?!"':
            continue
        return False  # a capital mid-sentence: a proper noun
    words = WORD.findall(s.lower())
    if len(set(words)) < 4 or VOSOTROS.search(s.lower()):
        return False
    for w in words:
        if w in BLOCK or w in NAMES or w.translate(STRIP) not in dictionary:
            return False
    return True


opener = bz2.open if src_path.endswith('.bz2') else open
seen, plain, accented = set(), [], []
with opener(src_path, 'rt', encoding='utf8') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3 or parts[1] != 'spa':
            continue
        s = re.sub(r'\s+', ' ', parts[2]).strip()
        if not ok(s):
            continue
        key = re.sub(r'[^a-záéíóúüñ ]', '', s.lower())
        if key in seen:
            continue
        seen.add(key)
        (accented if ACCENT.search(s) else plain).append(s)

rng = random.Random(20260917)
rng.shuffle(plain)
rng.shuffle(accented)
chosen = []
taken = set()


def take(bucket, n, pred=lambda s: True):
    for s in bucket:
        if len(chosen) >= QUOTA or n <= 0:
            return
        if s in taken or not pred(s):
            continue
        chosen.append(s)
        taken.add(s)
        n -= 1


take(plain, MIN_PLAIN)
take(plain + accented, MIN_QUESTION, lambda s: bool(QUESTION.search(s)))
take(accented + plain, QUOTA - len(chosen))
chosen.sort(key=lambda s: s.lower())

src = (
    "// Frases del español tomadas de Tatoeba (https://tatoeba.org, CC BY 2.0 FR), filtradas por scripts/build-sentences.py:\n"
    "// sin nombres propios, sin formas de vosotros, todas las palabras en diccionario, sin vulgaridades. No editar a mano.\n"
    "export const GENERATED_SENTENCES: string[] = [\n" + ''.join(f"  {json.dumps(s, ensure_ascii=False)},\n" for s in chosen) + "]\n"
)
with open(out_path, 'w', encoding='utf8', newline='\n') as f:
    f.write(src)
print(len(chosen), 'sentences;', sum(1 for s in chosen if not ACCENT.search(s)), 'without accents;',
      sum(1 for s in chosen if QUESTION.search(s)), 'questions/exclamations ->', os.path.normpath(out_path))
```

- [x] **Step 3: Descargar las entradas y correr**

Run (en `scripts/`; si `dict.json` ya existe, saltear esa línea):

```bash
curl -L -o scripts/dict.json https://raw.githubusercontent.com/words/an-array-of-spanish-words/master/index.json
```

```bash
curl -L -o scripts/spa_sentences.tsv.bz2 https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2
```

```bash
python scripts/build-sentences.py
```

Expected: `1500 sentences; ≥ 400 without accents; ≥ 300 questions/exclamations -> src\engine\corpus\sentences.generated.ts`. Si da menos de 1500, bajar `QUOTA` al número reportado (no inventar). Verificar que `scripts/*.tsv*` y `scripts/dict.json` estén en `.gitignore` (agregar `scripts/spa_sentences.tsv*` y `scripts/dict.json` y `scripts/es_50k.txt` si faltan).

- [x] **Step 4: Revisar una muestra**

Run: `python -c "import random,re;s=open('src/engine/corpus/sentences.generated.ts',encoding='utf8').read();l=re.findall(r'^  \"(.*)\",$',s,re.M);random.seed(1);print('\n'.join(random.sample(l,40)))"`
Expected: 40 frases legibles, sin nombres, sin "vosotros". Si aparece basura sistemática (un patrón que se repite), agregar el filtro a `ok()` y regenerar; anotar en el PR qué se filtró.

- [x] **Step 5: Frases de la casa**

Agregar al final del array `SENTENCES` en `sentences.ts` (antes del `]`) estas 100 frases:

```ts
  'Las hormigas pueden cargar varias veces su propio peso sin cansarse.',
  'El mate se ceba con agua caliente, nunca hirviendo, y se toma sin apuro.',
  'Los flamencos duermen parados sobre una sola pata para no perder calor.',
  'El tango nace en los arrabales de Buenos Aires y Montevideo.',
  'Un buen tipista no mira las manos: escucha el ritmo de las teclas.',
  'Cada dedo tiene su lugar y vuelve a casa cuando termina el golpe.',
  'Las ballenas cantan canciones que cambian de un verano al otro.',
  'El pan casero se amasa con paciencia y descansa antes de ir al horno.',
  'En la Patagonia el viento sopla fuerte durante todo el año.',
  'Los gatos pasan dos tercios de su vida durmiendo en cualquier lugar.',
  'La luna se aleja de la Tierra un poco cada año, sin que nadie lo note.',
  'El teclado se toca con los dedos livianos, como si fueran plumas.',
  'Las abejas bailan para avisarles a las otras que hay flores cerca.',
  'Un error no se borra: se respira, se corrige y se sigue adelante.',
  'Los meñiques trabajan poco al principio, pero con paciencia se vuelven fuertes.',
  'El anular es un dedo tranquilo que aprende de a poco a moverse solo.',
  'Las tortugas marinas vuelven a poner huevos en la playa donde nacieron.',
  'Escribir sin mirar es como andar en bicicleta: de pronto sale solo.',
  'El asado se cocina despacio, con brasas parejas y sin apurar el fuego.',
  'Los perros mueven la cola hacia un lado cuando ven a alguien conocido.',
  'La lluvia sobre el techo de chapa suena como un aplauso largo.',
  'Un teclado limpio y una buena silla ayudan tanto como el ejercicio.',
  'Los caracoles llevan la casa a cuestas y no se apuran por nada.',
  'El sol sale por el este y se esconde entre las sierras al atardecer.',
  'Las manos descansan y los ojos leen: esa es toda la receta.',
  'En invierno el arroyo baja lento y deja ver las piedras del fondo.',
  'El chocolate se derrite a la temperatura de la boca, por eso gusta tanto.',
  'Los elefantes se saludan entrelazando las trompas como si fueran manos.',
  'Un buen ritmo es lento y parejo, como el paso de alguien que camina.',
  'Las estrellas que vemos de noche quedan tan lejos que su luz viaja siglos.',
  'El barrio se despierta con el olor del pan que sale del horno.',
  'Las nutrias juegan con piedras como los chicos con sus juguetes.',
  'Cuando dudes de una tecla, frena un segundo: el dedo correcto aparece solo.',
  'Las gaviotas siguen a los barcos pesqueros esperando su parte.',
  'La memoria de los dedos se construye con repeticiones lentas y correctas.',
  'Un tipista experto casi no piensa en las teclas: piensa en las palabras.',
  'Las nubes bajas anuncian lluvia y las altas prometen un cielo despejado.',
  'El humo del asado avisa a toda la cuadra que es domingo.',
  'Los delfines duermen con la mitad del cerebro despierta para no ahogarse.',
  'Cada tecla suena distinta si la toca el dedo que le corresponde.',
  'Un rato corto todas las tardes rinde mucho, aunque no lo parezca.',
  'Las jirafas duermen apenas un par de horas por noche, casi siempre de pie.',
  'El viento de la tarde trae olor a tierra mojada y a jazmines.',
  'Los picaflores baten las alas tan seguido que apenas se ven.',
  'Nadie aprende a escribir sin equivocarse; el error es parte del camino.',
  'Las teclas de la fila del medio son la casa donde descansan los dedos.',
  'El dulce de leche se hace con leche, mucha paciencia y un fuego suave.',
  'Los pulgares se ocupan de la barra y del resto no se preocupan.',
  'Las hojas del otoño crujen bajo los pies en las veredas del barrio.',
  'Un teclado se aprende con los ojos cerrados y las manos abiertas.',
  'La calle se llena de bicicletas cuando llega el primer calor del año.',
  'Las olas llegan a la costa una tras otra, sin apuro y sin descanso.',
  'Los zorros grises de la pampa cazan de noche y duermen con el sol.',
  'El ruido de las teclas es la banda de sonido de quien escribe seguido.',
  'Las manos van y vuelven de la fila del medio como olas en la orilla.',
  'El horizonte de la pampa es tan plano que parece dibujado con regla.',
  'Escribir con todos los dedos deja las manos descansadas al terminar.',
  'Los tucanes usan el pico enorme para regular la temperatura del cuerpo.',
  'La niebla de la mañana se levanta despacio sobre el campo.',
  'Las teclas se presionan, no se golpean: un toque corto alcanza.',
  'El café recién hecho es la mejor excusa para sentarse a escribir un rato.',
  'Los ñandúes corren en zigzag para despistar a quien los persigue.',
  'La práctica diaria de diez minutos rinde más que una hora aislada por semana.',
  'En Buenos Aires hay una librería por cada barrio y un café por cada esquina.',
  'El río Paraná arrastra camalotes que a veces llegan hasta el Delta.',
  'Cuando el meñique aprende su lugar, la ñ deja de dar miedo.',
  'Los músicos ensayan las partes difíciles despacio hasta que salen solas.',
  'El mate amargo se comparte en ronda y nadie dice gracias hasta que termina.',
  'Las tildes se escriben en dos toques: primero la tecla muerta, después la vocal.',
  'Un día de lluvia es la ocasión perfecta para practicar sin distracciones.',
  'El anular y el meñique se fortalecen con paciencia, no con fuerza.',
  'La velocidad llega sola cuando la precisión ya está instalada.',
  'Los árboles de la avenida cambian de color antes de que llegue el frío.',
  'El pingüino emperador incuba el huevo sobre las patas durante el invierno antártico.',
  'El sábado a la mañana la feria del barrio huele a frutas y a pan fresco.',
  'Los relámpagos iluminan la pampa como si alguien encendiera la luz por un segundo.',
  'Escribir rápido con errores es ir lento por otro camino.',
  'El té con limón después de la cena ayuda a que la noche sea más tranquila.',
  'Las cataratas del Iguazú tienen más de doscientos saltos de agua.',
  'Un párrafo bien escrito se lee de un tirón, como una buena canción.',
  'Los científicos creen que los pulpos sueñan porque cambian de color mientras duermen.',
  'El fútbol de barrio se juega hasta que se hace de noche o se pincha la pelota.',
  'Cada semana la ñ, las tildes y los signos se vuelven un poco más fáciles.',
  'El glaciar avanza tan lento que parece quieto, pero nunca se detiene.',
  'Después de un error, el mejor remedio es volver a la fila guía y respirar.',
  'Los jacarandás tiñen de violeta las calles de la ciudad en noviembre.',
  'La música de fondo ayuda a algunos y distrae a otros: probá y decidí.',
  'Los dedos índices son los más ágiles, por eso cargan con más teclas.',
  'En el sur del país los días de verano duran hasta las diez de la noche.',
  'La brújula de las manos son los relieves de la f y la j.',
  'El tereré es mate frío con jugo, ideal para las siestas de enero.',
  'Un tipista con ritmo parece un pianista tocando una pieza sencilla.',
  'El pájaro carpintero golpea el tronco hasta veinte veces por segundo sin marearse.',
  'Cuando el teclado parece lejano, la solución es mirar la pantalla y confiar.',
  'Las montañas de Córdoba guardan arroyos frescos incluso en pleno enero.',
  'Nunca se practica mejor que cuando no hay nadie apurándote.',
  'El último tramo del día es para leer, no para seguir escribiendo.',
  'La ñ es una letra con casa propia: vive al lado de la l y la toca el meñique.',
  'Un buen resumen dice en cinco líneas lo que el texto dice en cinco páginas.',
  'Cada tecla dominada es una pequeña victoria que nadie te puede sacar.',
```

- [x] **Step 6: Tests del generador**

En `generator.test.ts`, agregar (importar `buildCurriculum` de `../curriculum` y `LATAM` de `../layouts`, y `fitSentence`, `GENERATED_SENTENCES`):

```ts
  it('fitSentence lowers and strips only the punctuation the pool lacks; accents are never touched', () => {
    const lower = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    expect(fitSentence('El pulpo tiene tres corazones.', lower)).toBe('el pulpo tiene tres corazones')
    expect(fitSentence('¿Cuántos años tenés?', lower)).toBeNull() // accents cannot be dropped
    const withDot = poolOf('abcdefghijklmnopqrstuvwxyzñ.')
    expect(fitSentence('¿Hay pan? Hay, y mucho.', withDot)).toBe('hay pan hay y mucho.')
    const caps = new Set('abcdefghijklmnopqrstuvwxyzñABCDEFGHIJKLMNOPQRSTUVWXYZÑ. ')
    expect(fitSentence('Hoy es lunes.', caps)).toBe('Hoy es lunes.')
  })

  it('offers plenty of real sentences at every stage of the LATAM path', () => {
    const c = buildCurriculum(LATAM)
    const poolAt = (id: string) => poolOf(c.byId.get(id)!.pool)
    const countAt = (id: string) => pickSentences(poolAt(id), 5000, { rng: makeRng(1) }).length
    expect(countAt('inferior-unit-review')).toBeGreaterThanOrEqual(300)
    expect(countAt('mayusculas-unit-review')).toBeGreaterThanOrEqual(300)
    expect(countAt('acentos-unit-review')).toBeGreaterThanOrEqual(1000)
  })

  it('weights the house sentences three to one over generated ones', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    let house = 0
    const generated = new Set(GENERATED_SENTENCES)
    for (let seed = 0; seed < 200; seed++) for (const s of pickSentences(full, 1, { rng: makeRng(seed) })) if (!generated.has(s)) house++
    // ~185 house vs ~1500 generated at weight 3:1 → roughly 27 % house; well above the unweighted 11 %.
    expect(house).toBeGreaterThan(35)
  })
```

- [x] **Step 7: Correr y ver fallar**

Run: `npx vitest run src/engine/generator/generator.test.ts`
Expected: FAIL (`fitSentence` no existe).

- [x] **Step 8: Implementar `fitSentence` y el `pickSentences` ponderado**

En `generator/index.ts`:

```ts
import { GENERATED_SENTENCES } from '../corpus/sentences.generated'

const PUNCT = new Set(',.;:¿?¡!"()-')
const PAIRS: Record<string, string> = { '¿': '?', '?': '¿', '¡': '!', '!': '¡' }
const CAPITAL = /[A-ZÁÉÍÓÚÜÑ]/

/**
 * Adapt a sentence to what the pool can type: lower-case when no capital is known, drop the punctuation
 * the pool lacks (question/exclamation marks go as a pair). Accents and ñ are never removed — that would
 * change the word. Null when the result still needs keys outside the pool.
 */
export function fitSentence(s: string, pool: ReadonlySet<string>): string | null {
  const hasCaps = [...pool].some((c) => CAPITAL.test(c))
  let t = hasCaps ? s : s.toLowerCase()
  t = [...t].filter((c) => !PUNCT.has(c) || (pool.has(c) && (!(c in PAIRS) || pool.has(PAIRS[c])))).join('')
  t = t.replace(/\s+/g, ' ').trim()
  return t && usesOnly(t, pool) ? t : null
}

/** Distinct real sentences typable with the pool, up to `count`; house sentences weigh 3, generated ones 1. */
export function pickSentences(
  pool: ReadonlySet<string>,
  count: number,
  opts: GenOpts & { corpus?: SentenceCorpus } = {},
): string[] {
  const rng = opts.rng ?? makeRng()
  const corpus = opts.corpus ?? 'general'
  const sources: [readonly string[], number][] = corpus === 'general' ? [[SENTENCES, 3], [GENERATED_SENTENCES, 1]] : [[CORPORA[corpus], 1]]
  const fits: string[] = []
  const weights: number[] = []
  for (const [list, weight] of sources) {
    for (const s of list) {
      const f = fitSentence(s, pool)
      if (f) {
        fits.push(f)
        weights.push(weight)
      }
    }
  }
  const out: string[] = []
  while (out.length < count && fits.length > 0) {
    const i = weightedIndex(weights, rng)
    out.push(fits[i])
    fits.splice(i, 1)
    weights.splice(i, 1)
  }
  return out
}
```

`CORPORA` queda para `numbers` y `symbols`. `sentencesText` y `challengeText` no cambian.

- [x] **Step 9: Verificar**

Run: `npx tsc -b && npm run lint && npm test`
Expected: verde. Si el test de cobertura falla en alguna etapa, mirar cuántas frases sin tildes salieron del script y subir `MIN_PLAIN`.

- [x] **Step 10: Commit**

```bash
git add scripts/corpus_common.py scripts/build-corpus.py scripts/build-sentences.py .gitignore src/engine/corpus/sentences.ts src/engine/corpus/sentences.generated.ts src/engine/generator
git commit -m "feat(corpus): sentences per stage — Tatoeba-generated corpus, 100 more house sentences, fitSentence normalisation

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: N-gramas del español

**Files:**
- Create: `scripts/build-ngrams.py`
- Generate: `src/engine/corpus/ngrams.ts`
- Modify: `src/engine/generator/index.ts`, `generator.test.ts`
- Modify: `src/engine/curriculum/types.ts`, `index.ts`, `build.ts`, `curriculum.test.ts`
- Modify: `src/engine/stats/index.ts` (`dayOfYear`)
- Modify: `src/app/routes/Practice.tsx`, `src/app/routes/Path.tsx`
- Create: `e2e/ngram.spec.ts`

**Interfaces:**
- Produces: `BIGRAMS`, `TRIGRAMS: [string, number][]`; `ngramText(pool, n, opts?)`; `ExerciseSpec { kind: 'ngram'; pool; n: 2 | 3; combination?; repetition?; tokens? }`; lecciones `velocidad-bigramas`, `velocidad-trigramas`; `dayOfYear(d: Date): number`.

- [x] **Step 1: Script y tabla**

`scripts/build-ngrams.py` (desvío del spec §8.1, anotado: pesa por **rango** en `words.ts` — el mismo peso `1/√(i+20)` que usa `wordsText` — en vez de por la frecuencia cruda de `es_50k.txt`, para no depender de una descarga ni tocar `words.ts`):

```python
"""Builds src/engine/corpus/ngrams.ts: the most frequent bigrams and trigrams inside Spanish words,
weighted by the rank of the words in words.ts (same 1/sqrt(rank+20) weight wordsText uses)."""
import math, os, re
from collections import Counter

here = os.path.dirname(os.path.abspath(__file__))
words_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'words.ts')
out_path = os.path.join(here, '..', 'src', 'engine', 'corpus', 'ngrams.ts')

words = re.search(r"'([^']+)'", open(words_path, encoding='utf8').read()).group(1).split(' ')
bi, tri = Counter(), Counter()
for i, w in enumerate(words):
    weight = 1 / math.sqrt(i + 20)
    for j in range(len(w) - 1):
        bi[w[j:j + 2]] += weight
    for j in range(len(w) - 2):
        tri[w[j:j + 3]] += weight


def table(counter, n):
    top = counter.most_common(n)
    mx = top[0][1]
    return ',\n'.join(f"  ['{g}', {max(1, round(v / mx * 1000))}]" for g, v in top)


src = (
    "// N-gramas más frecuentes dentro de palabra, peso relativo 1..1000 (por rango de frecuencia en words.ts).\n"
    "// Generado por scripts/build-ngrams.py — no editar a mano.\n"
    f"export const BIGRAMS: [string, number][] = [\n{table(bi, 150)},\n]\n\n"
    f"export const TRIGRAMS: [string, number][] = [\n{table(tri, 100)},\n]\n"
)
with open(out_path, 'w', encoding='utf8', newline='\n') as f:
    f.write(src)
print(len(bi), 'bigrams,', len(tri), 'trigrams counted ->', os.path.normpath(out_path))
```

Run: `python scripts/build-ngrams.py`
Expected: el archivo existe; `head -5 src/engine/corpus/ngrams.ts` muestra `['es', 1000]` o similar primero.

- [x] **Step 2: Tests de `ngramText`**

En `generator.test.ts`:

```ts
  it('ngramText repeats the chosen n-grams consecutively, inside the pool, and leans on weak keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const t = ngramText(pool, 2, { combination: 3, repetition: 3, tokens: 15, rng: makeRng(21) })
    expect(only(t, pool)).toBe(true)
    const tokens = t.split(' ')
    expect(tokens).toHaveLength(15)
    // pattern: g1 g2 g3 g1 g2 g3 g1 g2 g3 word g1 g2 g3 g1 g2
    const [g1, g2, g3] = tokens
    expect([g1, g2, g3].every((g) => g.length === 2)).toBe(true)
    expect(new Set([g1, g2, g3]).size).toBe(3)
    expect(tokens.slice(0, 9)).toEqual([g1, g2, g3, g1, g2, g3, g1, g2, g3])
    expect([g1, g2, g3].some((g) => tokens[9].includes(g))).toBe(true) // a real word carrying one of them
    expect(tokens.slice(10)).toEqual([g1, g2, g3, g1, g2])
    const tri = ngramText(pool, 3, { tokens: 12, rng: makeRng(23) })
    expect(tri.split(' ')[0]).toHaveLength(3)
  })

  it('ngramText leans on the weak keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const rare = /[xzwkj]/
    let withWeak = 0
    let without = 0
    for (let seed = 0; seed < 40; seed++) {
      if (rare.test(ngramText(pool, 2, { weak: ['x', 'z', 'w', 'k', 'j'], tokens: 9, rng: makeRng(seed) }))) withWeak++
      if (rare.test(ngramText(pool, 2, { tokens: 9, rng: makeRng(seed) }))) without++
    }
    expect(withWeak).toBeGreaterThan(without)
  })

  it('ngramText falls back to words when the pool fits fewer than six n-grams', () => {
    const t = ngramText(poolOf('fj'), 2, { rng: makeRng(24) })
    expect(only(t, 'fj ')).toBe(true)
  })
```

- [x] **Step 3: Correr y ver fallar**

Run: `npx vitest run src/engine/generator/generator.test.ts`
Expected: FAIL.

- [x] **Step 4: Implementar `ngramText`**

```ts
import { BIGRAMS, TRIGRAMS } from '../corpus/ngrams'

/**
 * Ngram-Type style drill: `combination` n-grams, each repeated `repetition` times in a row, then a real word
 * that contains one of them, and again. Weighted by frequency, ×3 for n-grams with a weak key.
 */
export function ngramText(
  pool: ReadonlySet<string>,
  n: 2 | 3,
  opts: GenOpts & { combination?: number; repetition?: number; tokens?: number; weak?: readonly string[] } = {},
): string {
  const rng = opts.rng ?? makeRng()
  const { combination = 3, repetition = 3, tokens = 15 } = opts
  const weak = new Set(opts.weak ?? [])
  const fits = (n === 2 ? BIGRAMS : TRIGRAMS).filter(([g]) => usesOnly(g, pool))
  if (fits.length < 6) return wordsText(pool, tokens, { rng })
  const weights = fits.map(([g, w]) => w * ([...g].some((c) => weak.has(c)) ? 3 : 1))
  const chosen: string[] = []
  let guard = 0
  while (chosen.length < Math.min(combination, fits.length) && guard++ < 200) {
    const g = fits[weightedIndex(weights, rng)][0]
    if (!chosen.includes(g)) chosen.push(g)
  }
  const words = candidateWords(pool, 1500).filter((w) => chosen.some((g) => w.includes(g)))
  const out: string[] = []
  while (out.length < tokens) {
    for (let r = 0; r < repetition; r++) for (const g of chosen) if (out.length < tokens) out.push(g)
    if (words.length && out.length < tokens) out.push(rng.pick(words))
  }
  return out.join(' ')
}
```

- [x] **Step 5: `ExerciseSpec`, `generateExercise`, lecciones**

`curriculum/types.ts`, en la unión `ExerciseSpec`:

```ts
  | { kind: 'ngram'; pool: string[]; n: 2 | 3; combination?: number; repetition?: number; tokens?: number }
```

`curriculum/index.ts`, en `generateExercise`:

```ts
    case 'ngram':
      return ngramText(poolOf(spec.pool), spec.n, { rng, combination: spec.combination, repetition: spec.repetition, tokens: spec.tokens })
```

`build.ts`, en la unidad Velocidad, después de `tip(b, vel, TIP_SPEED)` y antes de `goals.forEach`:

```ts
  const velPool = [...b.pool]
  add(b, vel, 'bigramas', 'Bigramas del español', 'practice', [], [], [
    { kind: 'ngram', pool: velPool, n: 2, tokens: 15 },
    { kind: 'ngram', pool: velPool, n: 2, tokens: 15 },
    { kind: 'words', pool: velPool, count: 16 },
  ])
  add(b, vel, 'trigramas', 'Trigramas del español', 'practice', [], [], [
    { kind: 'ngram', pool: velPool, n: 3, tokens: 15 },
    { kind: 'ngram', pool: velPool, n: 3, tokens: 15 },
    { kind: 'words', pool: velPool, count: 16 },
  ])
```

Test en `curriculum.test.ts`:

```ts
  it('opens Velocidad with bigram and trigram drills that generate text within the pool', () => {
    const c = buildCurriculum(LATAM)
    const bi = c.byId.get('velocidad-bigramas')!
    const tri = c.byId.get('velocidad-trigramas')!
    expect(bi.unitId).toBe('velocidad')
    expect(tri.index).toBe(bi.index + 1)
    const pool = new Set([...bi.pool, ' '])
    for (const spec of bi.exercises) expect([...generateExercise(spec, makeRng(3))].every((ch) => pool.has(ch))).toBe(true)
    expect(generateExercise(tri.exercises[0], makeRng(4)).split(' ')[0]).toHaveLength(3)
  })
```

- [x] **Step 6: Ruta y Calentamiento**

`Path.tsx`, en `legend`, caso `'practice'`:

```ts
    case 'practice':
      if (l.id.endsWith('-bigramas') || l.id.endsWith('-trigramas')) return { main: 'ab', sub: 'n-gramas' }
      return l.id.includes('-patron-') ? { main: l.title.replace('Patrón: ', ''), sub: 'patrón' } : { main: '✎', sub: 'práctica' }
```

`engine/stats/index.ts`, junto a `dayKey`:

```ts
/** 1-based day of the year, local time. */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}
```

`Practice.tsx`: `const bigramDay = dayOfYear() % 2 === 1` (fuera del `useMemo`, dentro del componente) y en el `useMemo`:

```ts
    if (kind === 'calentamiento') {
      if (learned.length < 6) return drillText(learned, joined ? 8 : 16, { rng, joined })
      // Odd days warm up on the bigrams that lean on the weakest keys; even days on real words.
      return bigramDay ? ngramText(pool, 2, { weak, tokens: 16, rng }) : wordsText(pool, 16, { rng })
    }
```

(agregar `bigramDay` a las dependencias). En el header, título `{kind === 'calentamiento' && bigramDay ? 'Calentamiento · bigramas' : meta.title}`.

- [x] **Step 7: e2e**

`e2e/ngram.spec.ts` (usa el helper `remaining`/`typeRemaining` copiado de `flow.spec.ts`):

```ts
import { expect, test, type Page } from '@playwright/test'

async function typeRemaining(page: Page) {
  const text = await page.evaluate(() =>
    [...document.querySelectorAll('.type-char')]
      .filter((s) => !s.classList.contains('is-done'))
      .map((s) => (s.classList.contains('is-space') || s.textContent === '\u00a0' || s.textContent === '' ? ' ' : s.textContent))
      .join(''),
  )
  await page.keyboard.type(text, { delay: 10 })
}

test('the bigram drill in Velocidad is playable end to end', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const done = { stars: 3, bestWpm: 30, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' }
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: { 'velocidad-tip-velocidad': done }, keys: {}, sessions: [], streak: { count: 0, lastDay: null },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false }, days: {}, legacy: null,
        },
        version: 3,
      }),
    )
  })
  await page.goto('/leccion/velocidad-bigramas')
  await expect(page.getByRole('heading', { name: 'Bigramas del español' })).toBeVisible()
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('.type-char.is-current')).toBeVisible()
    await typeRemaining(page)
    if (i < 2) await page.keyboard.press('Enter')
  }
  await expect(page.getByText('Lección terminada')).toBeVisible()
})
```

- [x] **Step 8: Verificar**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/ngram.spec.ts`
Expected: verde.

- [x] **Step 9: Commit**

```bash
git add scripts/build-ngrams.py src/engine/corpus/ngrams.ts src/engine/generator src/engine/curriculum src/engine/stats/index.ts src/app/routes/Practice.tsx src/app/routes/Path.tsx e2e/ngram.spec.ts
git commit -m "feat: Spanish n-gram drills — bigram/trigram tables, ngram exercise, two Velocidad lessons, bigram warm-up on odd days

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Sello "velocidad honesta"

**Files:**
- Modify: `src/app/routes/Stats.tsx`

- [x] **Step 1: Agregar el plegable bajo la tarjeta del chart**

Dentro de la `Card` "Velocidad de referencia", después del `<div>` de los `Swatch`:

```tsx
        <details className="mt-3 text-sm text-ink-soft">
          <summary className="cursor-pointer font-bold text-ink">¿Por qué este número y no otro?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Solo cuentan el Reto de un minuto, los textos de la unidad Velocidad y las Carreras: texto real, de corrido, contra reloj.</li>
            <li>Si hubo varios en un día, vale la mediana: un intento suelto, bueno o malo, no mueve la línea.</li>
            <li>La precisión es al primer intento: cada tecla equivocada cuenta, aunque el ejercicio termine perfecto.</li>
          </ul>
        </details>
```

- [x] **Step 2: Verificar y commit**

Run: `npx tsc -b && npm run lint`
Expected: verde.

```bash
git add src/app/routes/Stats.tsx
git commit -m "feat(stats): explain what the reference speed counts

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Tu velocidad de antes

**Files:**
- Modify: `src/app/routes/Practice.tsx` (kind `antes`)
- Modify: `src/app/routes/Settings.tsx` (tarjeta)
- Modify: `src/app/components/stats/ReferenceChart.tsx` (`legacy` prop)
- Modify: `src/app/routes/Stats.tsx`, `src/app/routes/Home.tsx`
- Create: `e2e/legacy.spec.ts`

**Interfaces:**
- Consumes: `Legacy`, `setLegacy`, `legacyBeaten`, `challengeText`.
- Produces: ruta `/practica/antes`; `ReferenceChart` prop `legacy?: number`.

- [x] **Step 1: `Practice.tsx` — el kind `antes`**

`type Kind = 'calentamiento' | 'repaso' | 'reto' | 'antes'`. En `META`, `block` y `session` pasan a opcionales (`block?: RoutineBlock; session?: SessionKind`) y se agrega:

```ts
  antes: {
    title: 'Como antes',
    blurb: 'Un minuto tipeando como tipeabas antes de TypeLight, sin pensar en los dedos. Es la vara que vas a superar.',
    variant: 'sun',
    timed: 60_000,
  },
```

En `PracticeRun`: `const { layout, learned, goalWpm, curriculum } = useProgress()`, `const setLegacy = useStore((s) => s.setLegacy)`; el pool para `antes` es todo el layout:

```ts
  const pool = useMemo(
    () => (kind === 'antes' ? poolOf(curriculum.lessons[curriculum.lessons.length - 1].pool) : poolOf(learned.length >= 2 ? learned : ['f', 'j'])),
    [kind, curriculum, learned],
  )
```

En el `useMemo` de `text`, antes del `if (kind === 'calentamiento')`: `if (kind === 'antes') return challengeText(pool, { rng })`. En `onFinish`:

```ts
      if (kind === 'antes') {
        setLegacy({ wpm: m.wpm, acc: m.accuracy, at: new Date().toISOString() })
        setResult(m)
        return
      }
      recordSession({ kind: meta.session!, … }, keySamples(state).values())
      markRoutine(meta.block!)
```

En el header, el eyebrow: `{kind === 'antes' ? 'Ajustes · tu velocidad de antes' : 'Rutina de hoy'}`. En la tarjeta de resultado, el eyebrow `{meta.title} · listo` y, para `antes`, un párrafo debajo de los `Stat`: `<p className="mt-4 text-sm text-ink-soft">Guardado como tu velocidad de antes. Cuando la mediana de tus Retos la supere, te aviso en Inicio.</p>`; el botón primario dice `Ver progreso →` con `to="/estadisticas"` en vez de "Volver a la rutina" (el Enter global sigue yendo a `/`; cambiar ese `navigate('/')` por `navigate(kind === 'antes' ? '/estadisticas' : '/')`).

- [x] **Step 2: Tarjeta en Ajustes**

En `Settings.tsx`, después de `<BackupCard />`:

```tsx
function LegacyCard() {
  const legacy = useStore((s) => s.legacy)
  return (
    <div className="rounded-xl bg-paper px-4 py-3" data-testid="legacy-card">
      <span className="block font-bold">Tu velocidad de antes</span>
      <span className="block text-sm text-ink-soft">
        {legacy
          ? `Medida el ${new Date(legacy.at).toLocaleDateString('es-AR')}: ${legacy.wpm} PPM con ${Math.round(legacy.acc * 100)} % de precisión. Es la línea gris de Progreso.`
          : 'Un minuto tipeando como tipeabas antes de TypeLight. Cuanto antes la midas, más fiel es: los dedos viejos se van olvidando.'}
      </span>
      <div className="mt-3">
        <Keycap to="/practica/antes" variant={legacy ? 'ghost' : 'secondary'} size="sm">
          {legacy ? 'Medir de nuevo' : 'Medir ahora'}
        </Keycap>
      </div>
    </div>
  )
}
```

- [x] **Step 3: Línea en el chart**

`ReferenceChart.tsx`: prop `legacy?: number`; en `top`: `Math.max(goal, 10, legacy ?? 0, ...shown.map((p) => p.wpm)) * 1.15`; después de la línea de la meta:

```tsx
        {legacy !== undefined && (
          <>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(legacy)} y2={y(legacy)} stroke="var(--color-ink-mute)" strokeWidth="1.5" strokeDasharray="2 5" />
            <text x={PAD.l + 4} y={y(legacy) - 5} fontSize="11" fontWeight="600" fill="var(--color-ink-mute)">
              antes · {legacy}
            </text>
          </>
        )}
```

`Stats.tsx`: `const legacy = useStore((s) => s.legacy)` y `<ReferenceChart … legacy={legacy?.wpm} />`; en la leyenda de `Swatch`, si `legacy`, `<Swatch className="bg-ink-mute" label="tu velocidad de antes" />`.

- [x] **Step 4: Inicio — línea "antes" e hito**

`Home.tsx`: `const legacy = useStore((s) => s.legacy)`, `const setLegacy = useStore((s) => s.setLegacy)`, `const points = referenceByDay(days)` (ya usado para `reference`). Detectar el hito:

```ts
  useEffect(() => {
    if (legacy && !legacy.beatenAt && legacyBeaten(points, legacy.wpm)) setLegacy({ ...legacy, beatenAt: dayKey() })
  }, [legacy, points, setLegacy])
```

Tarjeta (debajo del header, antes de la rutina), solo cuando `legacy?.beatenAt && !legacy.beatenSeen`:

```tsx
      {legacy?.beatenAt && !legacy.beatenSeen && (
        <section className="card mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-enter p-5" data-testid="legacy-beaten">
          <div>
            <div className="eyebrow mb-1">Hito</div>
            <p className="font-display text-xl font-extrabold">Superaste tu forma vieja.</p>
            <p className="text-ink-soft">
              La mediana de tus Retos ya está en {reference?.value ?? legacy.wpm} PPM con los dedos correctos, contra {legacy.wpm} de antes.
            </p>
          </div>
          <Keycap variant="ghost" size="sm" onClick={() => setLegacy({ ...legacy, beatenSeen: true })}>
            Cerrar
          </Keycap>
        </section>
      )}
```

En "Últimos números", debajo del `<dl>`: `{!legacy && <Link to="/ajustes" className="mt-3 block text-sm font-bold text-ink-soft underline">Medí tu velocidad de antes →</Link>}` y, si `legacy`, `<p className="mt-3 text-sm text-ink-soft">Tu velocidad de antes: {legacy.wpm} PPM.</p>`.

- [x] **Step 5: e2e**

`e2e/legacy.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('legacy speed: the route exists and the line shows on the chart', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem(
      'typelight.v1',
      JSON.stringify({
        state: {
          settings: { name: 'Seba', layoutId: 'latam', sound: false, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
          lessons: {}, keys: {}, sessions: [], streak: { count: 1, lastDay: today },
          routine: { day: '2000-01-01', warmup: false, lesson: false, review: false, challenge: false },
          days: { [today]: { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [30], sessions: 1 } },
          legacy: { wpm: 45, acc: 0.9, at: d.toISOString() },
        },
        version: 3,
      }),
    )
  })
  await page.goto('/estadisticas')
  await expect(page.getByText('antes · 45')).toBeVisible()
  await page.goto('/ajustes')
  await expect(page.getByTestId('legacy-card')).toContainText('45 PPM')
  await page.getByRole('link', { name: 'Medir de nuevo' }).click()
  await expect(page).toHaveURL(/practica\/antes/)
  await expect(page.getByRole('heading', { name: 'Como antes' })).toBeVisible()
  await expect(page.locator('.type-char.is-current')).toBeVisible()
})
```

- [x] **Step 6: Verificar**

Run: `npx tsc -b && npm run lint && npm test && npx playwright test e2e/legacy.spec.ts`
Expected: verde.

- [x] **Step 7: Commit**

```bash
git add src/app/routes/Practice.tsx src/app/routes/Settings.tsx src/app/routes/Stats.tsx src/app/routes/Home.tsx src/app/components/stats/ReferenceChart.tsx e2e/legacy.spec.ts
git commit -m "feat: 'tu velocidad de antes' — one-minute legacy test, line on the reference chart, milestone when the median beats it

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Cierre

**Files:**
- Modify: `docs/backlog.md`, `.serena/memories/typelight-architecture.md`, `docs/superpowers/handoffs/HANDOFF.md`, `docs/superpowers/specs/2026-09-17-proteger-y-contenido-design.md` (marca "Implementado"), este plan (`> **Estado:**`).

- [x] **Step 1: Suite completa**

Run: `npx tsc -b && npm run lint && npm test && npm run e2e && npm run build`
Expected: todo verde; el lint con las 4 advertencias previas y ninguna más.

- [x] **Step 2: Capturas para Seba**

Run: `node scripts/shot.mjs http://localhost:5175/ajustes e2e/screens/ajustes-copia.png 1280 900` y lo mismo para `/estadisticas` (`stats-antes.png`) con el dev server de la rama en :5175. (El `shot.mjs` apunta a :5173; pasarle la URL completa con :5175 o cambiar temporalmente el `goto` inicial a la misma base.)

- [x] **Step 3: Docs**

- `docs/backlog.md`: dejar en "Ideas sueltas" solo lo que sigue vigente (metrónomo en práctica; Backspace ya está decidido para la etapa siguiente: moverlo a "Pendientes" como "Ola 2 del reporte").
- `.serena/memories/typelight-architecture.md`: viñetas nuevas en "Decisiones con su porqué": store v3 (`days.reference[]`/`sessions`, `legacy`), copia JSON, corpus por etapa (`fitSentence`, casa ×3, Tatoeba), n-gramas (`build-ngrams.py`, pesos por rango), `nextLesson` que no retrocede, pausa por pestaña oculta, `:5173` = `vite preview`, `:5175` = dev. En "Trampas": `window.confirm` no se usa (Playwright descarta diálogos); `document.hidden` se mockea con `defineProperty`.
- `HANDOFF.md`: reescribir con el estado nuevo, **incluyendo el texto completo del `.bat`** y la instrucción para Seba: "reemplazá `C:\Users\seba_\Desktop\TypeLight.bat` por `scripts\TypeLight.bat`; desde ahora :5173 sirve el build de `master` y las ramas se prueban en :5175". Próximo paso: propuesta renderizada de la Ola 2.
- Spec: agregar "Implementado completo el AAAA-MM-DD" en la línea de fecha. Plan: línea `> **Estado:**` con desvíos.

- [x] **Step 4: Commit y aviso**

```bash
git add docs .serena/memories/typelight-architecture.md
git commit -m "docs: close the protect + content stage; handoff with the new launcher

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

Avisar a Seba: la rama `proteger-contenido` está lista para probar en :5175 (`npm run dev -- --port 5175`); qué mirar: Ajustes → Descargar copia / Importar; Ajustes → Medir ahora; Progreso → línea "antes" y el plegable; Reto con frases nuevas; lección "Bigramas del español" en Velocidad; el Calentamiento de bigramas los días impares. Merge a `master` cuando él lo pida ("merge local a master", fast-forward), y después reemplaza el `.bat`.

---

## Self-review

- **Cobertura del spec:** §3 build estable → Task 1; §4 store v3 → Task 2 (+ `referenceByDay` en Task 3); §5 export/import → Task 4; §6 fixes: #3 → Task 6, #4/#9/#12/`next` → Task 7, #13 → Task 5; §7 corpus → Task 8; §8 n-gramas → Task 9; §9 sello → Task 10; §10 velocidad de antes → Task 11 (`legacyBeaten` en Task 3); §11 tests: repartidos por tarea, suite completa en Task 12.
- **Desvío declarado:** n-gramas pesados por rango en `words.ts` (Task 9) en vez de por frecuencia cruda de `es_50k.txt`; no requiere descarga ni cambia `words.ts`.
- **Tipos consistentes:** `DaySummary.reference: number[]` / `.sessions: number` (Tasks 2, 3, 4-e2e, 11-e2e); `Legacy` (Tasks 2, 11); `PersistedState` (Tasks 2, 4); `pickSentences`/`challengeText` (Tasks 6, 8, 11); `ngramText(pool, n, opts)` (Task 9); `nextLesson(c, completedIds)` (Task 7); `typeText(s, text, t, afterPause)` (Task 5).
