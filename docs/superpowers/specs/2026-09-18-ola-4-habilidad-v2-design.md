# Ola 4 · Modelo de habilidad v2 — diseño

Fecha 2026-09-18 · sesión nocturna: decisiones del agente sobre el roadmap aprobado (`docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 4, puntos 22–27; §2.5; §6 insights 3, 4 y 6). Seba las revisa cuando vuelve.

**Estado:** implementado completo (rama `ola-4`, mergeada fast-forward a `master` el 2026-09-18). Desvíos: piso de α = 0.05 (no 0.1); las tildes se muestran dentro de la tarjeta Transiciones como una línea, con la latencia sin tilde tomada de `keys[a,e,i,o,u]`; la Carrera no alimenta bigramas/palabras; `weaknessQualities` usa prioridad fija (mano → fila → mismo dedo → dobles → tecla muerta) y devuelve como máximo dos.

## 0. Qué es

El modelo deja de ser «una EMA por tecla que nunca olvida»: pondera por muestras, olvida con una vida media que crece con cada repaso limpio, exige dominio sostenido en dos días, conoce **bigramas** (la unidad que predice velocidad), recuerda **palabras problemáticas** y ofrece practicarlas, nombra la **cualidad** de la debilidad, **predice** cuántas rutinas faltan para la meta y mide la **tecla muerta**. Todo puro en `src/engine/`; la UI muestra tres tarjetas nuevas en Progreso y dos líneas en el Repaso.

## 1. EMA ponderada por muestras + olvido (punto 22)

- `KeyStat` suma `halfLife: number` (días, default 3) y `daysSeen: number` (días distintos con intentos). `updateKeyStats(stats, samples, today)`:
  - α efectivo = `clamp(attempts / (prev.samples + attempts), 0.05, 0.5)`: una `x` que falla una vez entre cien muestras mueve `errorEma` 5 % (queda «en camino», no «floja»), no 25 %; el piso 0.05 mantiene recencia.
  - `halfLife`: sesión limpia (0 errores y ≥ 3 aciertos) → `min(30, halfLife × 1.5)`; sesión con error → `max(3, halfLife / 2)`.
  - `daysSeen + 1` cuando `lastSeen` cambia de día.
- **Olvido:** `weaknessScore(stat, today?)` suma `min(2, gap / halfLife)` (gap = días desde `lastSeen`); las teclas raras vuelven solas al Repaso. `mastery(stat, goalWpm, today?)`: nivel 3 exige `daysSeen ≥ 2`; con `today`, un gap > `2 × halfLife` baja un nivel (3→2, 2→1). `masteryMap(..., today?)` lo propaga (Progreso e Inicio pasan `today`; el snapshot diario también).
- Migración v6: `halfLife = 3`, `daysSeen = lastSeen ? 1 : 0` para cada tecla existente.

## 2. Dominio por bigrama (punto 23)

- `engine/stats/bigrams.ts`: `BigramStat { latencyEma, errorEma, samples }`, `BigramStats = Record<string, BigramStat>`; `bigramSamples(state)` (en `engine/typing`): por cada keystroke correcto con anterior correcto y `latency < MAX_LATENCY`, el bigrama `expected[i−1] + expected[i]` (sin espacios) suma una latencia; un keystroke erróneo cuyo anterior fue correcto suma un error al bigrama. `updateBigramStats(stats, samples)` con la misma EMA ponderada; se guarda como `store.bigrams` (tope 600 entradas: se descartan las de menos muestras).
- **Clases** (`bigramClass(layout, bigram)`): `repeat` (misma letra), `finger` (mismo dedo), `hand` (misma mano, distinto dedo), `alt` (alternancia de manos). `bigramClasses(stats, layout)` → media de latencia y muestras por clase.
- `weakestBigrams(stats, pool, n = 3)` por `weaknessScore` sobre bigramas tipeables con el pool y ≥ 5 muestras.
- Repaso: `adaptiveText(pool, weak, count, { bigrams })` prefiere palabras que contengan un bigrama débil (70 % de las palabras reales, como hoy con teclas). Progreso: tarjeta «Transiciones» con las cuatro clases (ms y muestras) y los tres bigramas más lentos.

## 3. Palabras problemáticas (punto 24)

- `engine/typing`: `wordSamples(state)` → por palabra del target (sin puntuación, ≥ 3 letras): latencia media por letra (solo keystrokes correctos, salvo la primera letra de la palabra, que carga la lectura — §2.5) y errores. `engine/stats/words.ts`: `WordStat { latencyEma, errorEma, samples, lastSeen }`, `updateWordStats(stats, samples, today)` (tope 400 palabras: se descartan las menos vistas), `weakestWords(stats, n)` (≥ 2 muestras, por `errorEma × 4 + latencyEma / 400`).
- Reto y examen: en el resultado, «Se te resistieron: casa · zapatillas · …» (palabras con error o latencia > 1.5× la media de la sesión, máx. 5) y botón **«Practicar estas»** → `/practica/palabras` (kind `palabras`, `stop`, texto = esas palabras ×3 barajadas; graba `kind: 'review'` sin `reference` y sin bloque de rutina). Sin palabras que se resistieran, no hay botón.
- Progreso: tarjeta «Palabras que piden práctica» (6, con «practicar estas» que lleva a la misma ruta con `?w=`).

## 4. Cualidades de la debilidad (punto 25)

- `engine/stats/qualities.ts`: `weaknessQualities(keys, bigrams, layout, learned)` → hasta dos de: `mano izquierda` / `mano derecha` (latencia media por mano > 1.2× la otra), `fila superior` / `fila inferior` / `fila de números` (vs. la fila guía), `mismo dedo` (clase `finger` > 1.3× `alt`), `letras dobles` (`repeat` > 1.3× `alt`), `tecla muerta` (media de las teclas con tilde/diéresis > 1.4× las vocales sin tilde). Necesita `rowFor(layout, ch)` en `engine/layouts`.
- Repaso: línea «Hoy pesa: fila superior y mismo dedo.» debajo de «por qué hoy». Progreso: la tarjeta «Transiciones» la repite.

## 5. Predicción (punto 26)

- `engine/stats/forecast.ts`: `forecast(points, goal, today)` → regresión lineal sobre los últimos 30 puntos de referencia (día → PPM); con ≥ 8 puntos, `R² ≥ 0.5` y pendiente > 0: `{ daysToGoal, r2, slope }` (días calendario hasta cruzar `goal`, tope 365); si la última mediana ya supera la meta → `{ reached: true }`; si no → `null`.
- Progreso, bajo el chart: «A este ritmo, la meta de la unidad (N PPM) llega en ~N días de práctica.» / «Ya estás por encima de la meta de la unidad.» / nada.

## 6. Tecla muerta (punto 27)

- `engine/typing`: `deadKeyStats(state, isAccented)` → `{ n, latency, missed, loose }`: `n` = keystrokes correctos sobre caracteres acentuados (á é í ó ú ü), `latency` = media de sus latencias; `missed` = keystrokes erróneos donde lo esperado era acentuado y lo tipeado fue la vocal sin tilde; `loose` = keystrokes erróneos donde lo tipeado fue un acento suelto (`´` `¨` `` ` `` `^`) o una vocal acentuada cuando se esperaba una sin tilde. Se guarda en `SessionRecord.dead?: { n, latency, missed, loose }` cuando `n + missed + loose > 0`.
- Progreso (solo layouts con teclas muertas, y solo si hay sesiones con `dead`): tile «Tildes» en la tarjeta Transiciones: latencia media con tilde vs. sin tilde (últimas 30 sesiones), «N tildes olvidadas · N sueltas».

## 7. Store v6

- `keys[*]` gana `halfLife`, `daysSeen`; nuevos `bigrams: BigramStats`, `words: WordStats`; `SessionRecord.dead?`. `PERSISTED_KEYS` suma `bigrams`, `words`; `resetProgress` los vacía; backup v6 valida que sean objetos.

## 8. Verificación

Unitarios por módulo (EMA ponderada, halfLife, daysSeen, olvido en score y mastery, bigramas y clases, palabras y tope, cualidades, forecast, dead-key) · migración v6 · e2e: Repaso con «Hoy pesa», Progreso con Transiciones/Palabras/predicción, Reto con «Practicar estas» → `/practica/palabras`. Lint sin nuevas · build.
