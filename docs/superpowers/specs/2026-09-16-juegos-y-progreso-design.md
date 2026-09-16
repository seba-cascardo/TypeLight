# TypeLight — segunda etapa: juegos y Progreso

Fecha: 2026-09-16. Autor: Claude (Opus 5). Elegido por Seba sobre la propuesta renderizada (`https://claude.ai/artifact/Fw6mUvuvXHzoG2M2L5gMM2`): los tres juegos en el orden B → A → C, la velocidad del encabezado "solo el Reto" (opción 1) y la fila "Jugar" después de la rutina.

## 1. Qué se decidió

| Decisión | Elección de Seba |
|---|---|
| Juegos nuevos | **B · Al compás**, **A · Globos de palabras**, **C · Carrera contra tu fantasma**, en ese orden de construcción. La Lluvia queda. |
| Velocidad del encabezado de Progreso | **Opción 1: solo el Reto** (más los textos de la unidad Velocidad y las Carreras). |
| Fila "Jugar" en Inicio cuando la rutina está completa | **Sí** (modo libre; suma racha y minutos, no rutina). |

Regla que gobierna todo Progreso: **ninguna métrica de avance se mueve con un solo ejercicio fácil**.

Fuera de alcance: deploy, backend, PWA, optimizar bundle, exportar/importar progreso, metrónomo fuera del juego, sílabas/palabras como notas de Al compás.

## 2. Orden de construcción

1. **Progreso** (motor de stats + store v2 + pantalla). Va primero porque Carrera necesita las sesiones de referencia guardadas y porque los juegos nuevos tienen que grabar sesiones con el modelo nuevo.
2. **Infraestructura de juegos** (`GameId`, `game()` con id, resultado y estrellas en el motor, pantalla de resultados genérica, mascota y utilidades compartidas, leyendas en la ruta).
3. **Al compás.** 4. **Globos.** 5. **Carrera.** 6. **Jugar libre** (ruta `/jugar/:gameId` + fila en Inicio).

Cada paso termina con `npm test`, `npm run e2e`, `npm run build` en verde y un commit. Los IDs de lección existentes no cambian (el progreso guardado por ID se conserva).

## 3. Progreso

### 3.1 Modelo de datos (store, `typelight.v1` versión 1 → 2)

`SessionRecord` suma tres campos opcionales:

```ts
export type SessionKind = 'lesson' | 'warmup' | 'review' | 'challenge' | 'game'
export interface SessionRecord {
  at: string; kind: SessionKind; lessonId?: string
  wpm: number; acc: number; chars: number; errors: number; seconds: number
  /** Cuenta para la velocidad de referencia (Reto, texto de Velocidad, Carrera). Se decide al grabar. */
  reference?: true
  /** 0..1, qué tan parejo fue el tiempo entre teclas (ver 3.2). */
  rhythm?: number
  gameId?: GameId
}
```

Resumen por día, escrito por el store (no derivado en la UI, para poder dibujar tendencias sin recalcular todo):

```ts
export interface DaySummary { seconds: number; blocks: number /* 0..4 tarjetas de la rutina */; learned: number; mastered: number }
days: Record<string, DaySummary>   // clave = dayKey()
```

- `recordSession` suma `seconds` al día; `markRoutine` actualiza `blocks`; `learned`/`mastered` los escribe un hook `useDaySnapshot()` montado en `AppShell` cada vez que cambian `keys` o `lessons` (es el único lugar que conoce currículo + pool + meta).
- Migración v2: a cada sesión con `kind === 'challenge'` se le pone `reference: true`; `days` arranca vacío (la constancia empieza a contarse desde el día de la migración; no se inventa historia).
- `sessions` sigue capado a 1000.

### 3.2 Definiciones (motor puro, `src/engine/stats/progress.ts`, con tests)

- **Velocidad de referencia.** Sesiones con `reference: true`. Por día: **mediana** del `wpm` de esas sesiones. Encabezado: el último día con dato; delta contra el dato de 7 días antes (el día con dato más cercano hacia atrás, hasta 10 días; si no hay, sin delta). Tendencia: media móvil de las últimas 3 sesiones de referencia, dibujada como línea tenue. Meta: `goalWpm` de la unidad actual, línea punteada. Marcas de unidad: días en que `days[d].learned` creció respecto al día anterior con dato, etiqueta "N teclas nuevas".
- **Precisión 7 días.** `Σ chars / Σ (chars + errors)` sobre las sesiones de los últimos 7 días (ponderada por caracteres, no por sesión). Se muestra con el total de caracteres.
- **Dominio por tecla.** `mastery(stat, goalWpm) → 0 | 1 | 2 | 3`; `target = 60000 / (goalWpm × 5)` ms (a 15 PPM, 800 ms).
  - 3 dominada: `samples ≥ 10 && errorEma ≤ 0.03 && latencyEma ≤ target`
  - 2 en camino: `samples ≥ 5 && errorEma ≤ 0.08 && latencyEma ≤ 1.6 × target`
  - 1 floja: aprendida pero sin cumplir lo anterior
  - 0 sin aprender: no está en `learned` (no entra en el total)
  Encabezado: "15 de 27" + delta contra `days` de 7 días antes. `goalWpm` = el de la unidad actual (`useProgress().goalWpm`), así el umbral sube con la ruta.
- **Constancia.** Calendario de 28 días desde `days`: completa (`blocks === 4`), parcial (1–3), nada. Encabezado: "N de los últimos 7 días" + racha actual + minutos por día (media de los días con actividad en los últimos 7). Total de minutos histórico al pie.
- **Ritmo parejo.** En `src/engine/typing`: `rhythm(state) = 1 − clamp(CV, 0, 1)`, con CV = desvío estándar / media de las latencias de las teclas correctas (excluida la primera y las ≥ `MAX_LATENCY`); `undefined` con menos de 8 latencias. Se guarda en cada sesión. Encabezado: media ponderada por `chars` de las últimas 10 sesiones con `rhythm`; delta contra las 10 anteriores. Al compás graba `rhythm = fracción a tiempo`.
- **Teclas que piden práctica** y **Unidades**: como hoy. El **mapa de calor** de velocidad se conserva plegado al pie (`<details>`).

### 3.3 Pantalla `/estadisticas` (`Stats.tsx`)

Según el boceto aprobado: fila de 4 tiles (Velocidad de referencia · Precisión 7 días · Teclas dominadas · Constancia) → tarjeta ancha con el chart de referencia (puntos por día, tendencia, meta, marcas de unidad, tooltip al pasar, días sin Reto vacíos) → grilla 2×2: Dominio del teclado (teclado coloreado por `mastery` reutilizando `Keyboard` con una prop `levels`; leyenda; barra "15 de 27"), Constancia (calendario + Ritmo parejo), Teclas que piden práctica, Unidades → mapa de calor plegado. Cada tarjeta lleva la frase de "qué cuenta y qué no" del boceto. Estado vacío: como hoy, con el texto adaptado ("tu primer Reto pone el primer punto").

`Home.tsx`, tarjeta "Últimos números": "Mejor velocidad" pasa a **"Velocidad de referencia"** (último día con dato); el resto queda.

## 4. Infraestructura de juegos

- `GameId = 'rain' | 'rhythm' | 'balloons' | 'race'`. `game(b, u, slug, title, id)` en `build.ts` fija `lesson.game = id`.
- Reparto en la ruta (IDs de lección: `${unidad}-juego-${slug}`; los que ya existen conservan el ID aunque cambie el juego):

| Unidad | slug | Juego | Título |
|---|---|---|---|
| guia | primeras-8 | rain | Juego: las primeras 8 |
| guia | fila-guia | **rhythm** | Juego: al compás |
| superior | ruei | rain | Juego: r u e i |
| superior | fila-superior | **balloons** | Juego: globos de palabras |
| inferior | vmcx | **rhythm** | Juego: al compás |
| inferior | alfabeto | **balloons** | Juego: globos de palabras |
| patrones | patrones *(nuevo, después de "mente")* | **balloons** | Juego: globos con patrones |
| mayusculas | mayusculas | **race** | Juego: carrera contra tu fantasma |
| numeros | numeros | **rhythm** | Juego: al compás con números |
| signos | signos | rain | Juego: signos |
| velocidad | carrera-1 *(nuevo, después de Texto 4)* | **race** | Juego: carrera a 34 PPM |
| velocidad | carrera-2 *(nuevo, después de Texto 8)* | **race** | Juego: carrera a 50 PPM |

  Los juegos de Velocidad llevan `goalWpm` del texto anterior (34 y 50); el fantasma usa ese valor si no hay Reto reciente.
- Contrato común (`src/app/components/games/`): `GameProps { layout, pool, goalWpm, sound, durationMs?, ghostWpm?, onFinish(r: GameResult) }`. `GameResult { gameId, score, hits, misses, wrong, bestCombo, seconds, accuracy, detail: Record<string, number | boolean> }` donde `accuracy = hits / (hits + wrong)` y `detail` lleva lo propio de cada juego (`onTime`, `escaped`, `won`, `marginSeconds`…).
- Estrellas en el motor: `src/engine/games/scoring.ts`, `starsForGame(r: GameResult): Stars` con las reglas de las secciones 5–7 (la Lluvia conserva las suyas: ★ · ★★ ≥ 85 % · ★★★ ≥ 95 %). Con tests.
- `LessonPlayer`: `phase === 'game'` elige el componente por `lesson.game`; la pantalla de resultados es una sola (`GameResults`) que muestra estrellas, título según estrellas, 4 `Stat` según el juego, "Jugar de nuevo" y "Siguiente". Al terminar, además de `completeLesson`, se graba `recordSession({ kind: 'game', gameId, … })` (hoy la Lluvia no graba sesión; pasa a grabar).
- Compartido: `Mascot` sale de `RainGame.tsx` a `components/games/Mascot.tsx`; `pickLetters(layout, pool)` (teclas de un solo toque) a `engine/games/pool.ts`; captura por input oculto: `TypingArea` se divide en `useHiddenInput()` (captura) + render, y Globos usa el hook.
- Ruta (`Path.tsx`): leyenda por juego — rain `▼`, rhythm `♪`, balloons `○`, race `⚑`, sub "juego".
- Todos aceptan `?dur=` como la Lluvia (tests e2e con `dur=6000`). rAF se pausa con la pestaña oculta: mismo tratamiento que hoy.

## 5. Juego B · Al compás (`rhythm`)

**Entrena** cadencia pareja sobre cualquier pool de teclas de un toque.

**Motor** (`src/engine/games/rhythm.ts`, puro, con tests):
- `beatMs(goalWpm) = 60000 / (goalWpm × 5)` (meta 12 PPM → 1000 ms).
- `judge(offsetMs)`: `|offset| ≤ 80` → `justo`; `≤ 160` → `bien`; si no, `fuera`. Una nota que pasa la ventana sin tecla correcta es `fuera` (tarde). Tecla equivocada = `wrong`, no consume la nota, corta la racha.
- Rampa: cada 15 s, si en ese tramo `a tiempo ≥ 80 %`, `beat *= 0.9` (mínimo 250 ms). El resultado informa el pulso máximo alcanzado.
- Secuencia de notas: aleatoria sobre `pickLetters`, sin repetir la tecla anterior, sesgada 50 % a las 3 teclas más flojas (`weakestKeys`) cuando hay stats.
- Ronda: `durationMs` = 45 000 por defecto. Sin vidas.

**Estrellas**: ★ terminado · ★★ `onTime ≥ 0.70` · ★★★ `onTime ≥ 0.85 && accuracy ≥ 0.97`, con `onTime = (justo + bien) / notas juzgadas`.

**Pantalla** (boceto aprobado): banda horizontal, zona de golpe a la izquierda (keycap punteado azul), notas keycap viajando de derecha a izquierda a velocidad constante (una nota por pulso), juicio flotante (`justo` verde, `bien` amarillo, `tarde/temprano` coral), 4 puntos de compás con el activo pulsando, tempo ("60 / min = 12 PPM, tu meta"), barra de los últimos 20 toques, mascota. HUD: a tiempo %, racha, errores, tiempo.

**Sonido**: tic de metrónomo en cada pulso (`tick()` nuevo en `lib/sound.ts`, más suave que `click`); `click`/`thud` en aciertos/errores. Todo detrás de `settings.sound`.

**Input**: `keydown` (como la Lluvia). **Sesión**: `kind: 'game', gameId: 'rhythm', rhythm: onTime, wpm: 0, acc: accuracy`. No alimenta stats por tecla.

**e2e**: leer del DOM la nota dentro de la zona y tipearla; `?dur=6000`; verificar "Juego terminado", estrellas ≥ 1 y la lección guardada.

## 6. Juego A · Globos de palabras (`balloons`)

**Entrena** palabras completas de corrido.

**Motor** (`src/engine/games/balloons.ts`, puro, con tests):
- Palabras: `candidateWords(pool)` del generador (se exporta), con `focus` = teclas nuevas de la unidad; menos de 12 candidatas → `pseudoWord`. En la lección de Patrones: solo palabras que contengan alguno de los patrones ya vistos (`que ent ado con est ien mente`). Mayúsculas y tildes entran cuando están en el pool.
- Regla de enganche: sin globo activo, la tecla tipeada elige **el globo más alto** cuya palabra empieza por ella; si no hay, es `wrong`. Nunca hay dos globos activos con la misma inicial (se evita al generar). Con globo activo: parar en el error sobre la palabra.
- Palabra completa → explota: `score += largo × 10 × min(5, 1 + ⌊combo / 5⌋)`, `combo++`. Error → `combo = 0`. Globo que llega al techo → `escaped++`, `lives--`, `combo = 0`.
- Ritmo: máximo 5 globos vivos; intervalo de aparición 1800 → 1100 ms; velocidad de subida 14 → 26 px/s a lo largo de la ronda. Ronda 45 s o 3 vidas.

**Estrellas**: ★ terminado · ★★ `accuracy ≥ 0.95` · ★★★ `accuracy ≥ 0.97 && escaped === 0`.

**Pantalla** (boceto aprobado): cielo (degradé `mod-soft` → `keycap`), globos = píldora con la palabra + hilo + canasta, activo con anillo verde y letras hechas en verde / siguiente subrayada en amarillo, globo por escaparse punteado y atenuado, "+60" al explotar, suelo con mascota. HUD: puntos, combo, vidas, tiempo.

**Input**: input oculto (`useHiddenInput`) para que las teclas muertas compongan. **Sesión**: `kind: 'game', gameId: 'balloons', acc, chars = letras correctas, errors = wrong, wpm: 0`, con `rhythm` y muestras por tecla (`KeySample` armadas del registro de teclas del juego) → alimenta el Repaso.

**e2e**: leer del DOM el globo activo o el más alto, tipear la palabra, `?dur=6000`, verificar resultados y lección guardada.

## 7. Juego C · Carrera contra tu fantasma (`race`)

**Entrena** velocidad sostenida sobre texto real; es referencia.

**Motor** (`src/engine/games/race.ts`, puro, con tests):
- Fantasma: `ghostWpm = max(wpm)` de las sesiones `reference` de los últimos 7 días; si no hay, `goalWpm` de la lección. `ghostPos(t) = min(len, t × ghostWpm × 5 / 60)`.
- Texto: `sentencesText(pool, 3)`; si no hay frases que entren, `wordsText(pool, 24)`.
- Termina cuando el jugador completa el texto. `won = el jugador terminó antes de que ghostPos llegara a len`; `marginSeconds` (positivo si ganó). Parar en el error, como siempre: el error frena al jugador, no al fantasma.

**Estrellas**: ★ llegaste · ★★ `accuracy ≥ 0.95` · ★★★ `won && accuracy ≥ 0.97`.

**Pantalla** (boceto aprobado): HUD "Vos 27 PPM · Fantasma 24 PPM · tu mejor Reto", dos carriles con auto (keycap verde "vos") y fantasma (keycap translúcido con su PPM), bandera de llegada, y la frase debajo con el mismo render de `TypingArea` (hecho en verde, actual resaltado, resto atenuado). Cierre: "le ganaste por 1,8 s" / "te faltaron N palabras".

**Input**: `useTypingSession` + `TypingArea` (input oculto). **Sesión**: `kind: 'game', gameId: 'race', reference: true, wpm` de `metrics`, `acc`, `rhythm`, muestras por tecla.

**e2e**: leer el texto objetivo del DOM, `page.keyboard.type` completo, verificar resultados, `reference: true` en la sesión guardada.

## 8. Jugar libre

- Ruta `/jugar/:gameId` (`Play.tsx`, hermana de `Practice.tsx`): `pool = learned`, `goalWpm = useProgress().goalWpm`, mismo componente de juego y misma pantalla de resultados con "Jugar de nuevo" y "Volver al inicio" (Enter vuelve). Graba `recordSession` (racha + minutos) y **no** `markRoutine` ni `completeLesson`.
- `Home.tsx`: cuando `doneCount === 4`, debajo de las cuatro tarjetas aparece la fila **"Jugar"** con cuatro keycaps (Lluvia, Al compás, Globos, Carrera). Globos y Carrera se ocultan hasta que el pool tiene la barra espaciadora y ≥ 8 letras (antes no hay palabras).

## 9. Tests

- Unitarios (Vitest, motor): `progress.ts` (mediana por día, delta 7 días, tendencia, precisión ponderada, `mastery`, calendario, marcas de unidad), `rhythm()` en typing, migración v1→v2 del store, `scoring.ts` (estrellas de los cuatro juegos), `rhythm.ts` (beat, judge, rampa, secuencia sin repetidos), `balloons.ts` (enganche por inicial, iniciales únicas, puntaje, patrones), `race.ts` (fantasma, `won`, margen), currículo (los 12 huecos con su `game`, IDs estables de los existentes).
- e2e (Playwright): `flow.spec.ts` actualizado para la pantalla nueva de Progreso (tiles y chart presentes, "Velocidad de referencia" solo con Reto); un spec por juego con `?dur=6000`; `Jugar` visible con la rutina completa y oculto sin ella. Capturas en `e2e/screens/`.
- Manual con Seba al cierre de cada juego (avisar antes de que pruebe, por el HMR).

## 10. Riesgos y decisiones menores

- **Datos viejos**: las sesiones anteriores a la migración no tienen `rhythm` ni `reference` salvo los Retos; las tarjetas muestran "todavía no" en vez de números inventados. `days` arranca vacío: la constancia se ve desde el día del deploy.
- **Reto con pool chico**: sigue contando como referencia aunque el texto sean palabras y no frases (opción 1 elegida: el Reto es el examen, sea cual sea el texto). Las marcas de unidad en el chart explican las bajadas.
- **`Keyboard` con niveles**: se agrega una prop `levels?: Record<string, 0|1|2|3>` junto a `heat`; no se toca el modo normal.
- **Bundle**: +3 componentes de juego y un chart SVG a mano; sin librerías nuevas.
- **IDs de lección**: los huecos que cambian de juego conservan el ID (`guia-juego-fila-guia`, `superior-juego-fila-superior`, `inferior-juego-vmcx`, `inferior-juego-alfabeto`, `mayusculas-juego-mayusculas`, `numeros-juego-numeros`); los nuevos son `patrones-juego-patrones`, `velocidad-juego-carrera-1`, `velocidad-juego-carrera-2`.
