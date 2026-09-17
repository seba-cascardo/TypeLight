# TypeLight — tercera etapa: proteger, contenido y "tu velocidad de antes"

Fecha: 2026-09-17. **Implementado completo el 2026-09-17** (plan `docs/superpowers/plans/2026-09-17-proteger-y-contenido.md`, rama `proteger-contenido`, todavía sin mergear a `master`). Autora: Clara (Opus 5). Deriva del reporte `docs/research/2026-09-17-auditoria-y-roadmap.md` (Ola 0 + Ola 1 + el ítem 13b del §10), aprobado entero por Seba el 2026-09-17 ("aprobado todo").

## 1. Qué se decidió

| Decisión | Elección |
|---|---|
| Orden del roadmap | proteger → contenido → converso → hábito → modelo de habilidad v2. Esta etapa cubre las dos primeras olas. |
| Reto (para la etapa siguiente) | Variante (a): Reto diario con Backspace + examen semanal sin ayuda y sin Backspace. **No se toca en esta etapa.** |
| Manos guía (etapa siguiente) | Por dominio: se quedan mientras la tecla no está dominada; fuera del Reto. **No se toca en esta etapa.** |
| Adelantado desde la Ola 2 | "Tu velocidad de antes": Seba ya tipeaba rápido con los dedos mal; la vara real del proyecto es superar esa velocidad con el mapeo nuevo. El dato se degrada con cada día de práctica: se captura ahora. |

Regla que gobierna la etapa: **ninguna decisión de producto de Seba cambia**. Parar en el error, la ruta, las métricas anti-inflado, la estética: todo igual. Se protege, se corrige y se agrega contenido.

Fuera de alcance: PWA/service worker (queda para cuando exista export/import: siguiente etapa), Backspace, Reto sin ayuda, rollover, bigramas en el modelo de habilidad, resumen semanal, racha amable. Todo eso está en el reporte, olas 2–4.

## 2. Orden de construcción

1. **Build estable** para el uso diario (sin tocar `src/`): Seba deja de usar el dev server como app.
2. **Store v3**: resumen de referencia por día, contador de sesiones, `legacy`; migración v2 → v3 con backfill.
3. **Exportar / importar** progreso.
4. **Fixes**: Reto sin frases repetidas; tip no consume la Lección; precisión de Inicio = la de Progreso; "~1 min"; reloj del Reto en pausa si la pestaña se oculta; `next` robusto a lecciones insertadas.
5. **Corpus de frases por etapa**: script `build-sentences.py` (Tatoeba) + frases de la casa ampliadas + normalización por pool en el generador.
6. **N-gramas del español**: tabla generada + `ExerciseSpec` `ngram` + dos lecciones en Velocidad + variante de Calentamiento.
7. **Sello "velocidad honesta"** en Progreso.
8. **Tu velocidad de antes**: test único, línea en el chart, hito.

Cada paso termina con `npx tsc -b && npm run lint && npm test` en verde y un commit; al cierre `npm run e2e` y `npm run build`. Los IDs de lección existentes no cambian.

## 3. Build estable para el uso diario

Hoy `C:\Users\seba_\Desktop\TypeLight.bat` corre `npm run dev -- --port 5173` y Seba practica sobre el árbol de trabajo: cada edición en una rama le dispara HMR a mitad de una lección.

- `package.json`: script `"serve": "vite preview --port 5173 --strictPort"`. `vite preview` sirve `dist/` (SPA fallback incluido).
- El `.bat` pasa a: si `dist/index.html` no existe **o** es más viejo que el último commit de `master` (`git log -1 --format=%ct master` vs. mtime), corre `npm run build`; después `npm run serve`. Dev sigue en `npm run dev` (:5173 queda tomado por el preview cuando Seba practica; el dev server para probar ramas se levanta en **:5175** con `npm run dev -- --port 5175`; e2e conserva :5174). El `.bat` vive fuera del repo: se le entrega a Seba el contenido nuevo en el handoff y se deja una copia en `scripts/TypeLight.bat`.
- Flujo con ramas a partir de ahora: Seba practica en :5173 (build de `master`); cuando hay algo para probar, se le avisa y lo mira en :5175 (dev sobre la rama). Al mergear a `master`, el `.bat` reconstruye solo la próxima vez que lo abre.

## 4. Store v3

`typelight.v1`, versión 2 → 3 (`src/app/store/index.ts`, `migrate.ts`).

```ts
export interface DaySummary {
  seconds: number; blocks: number; learned: number; mastered: number
  /** WPM of each reference session that day (Reto, Velocidad text, race). Survives the sessions cap. */
  reference: number[]
  /** Sessions recorded that day. */
  sessions: number
}
export interface Legacy { wpm: number; acc: number; at: string; beatenAt?: string }
interface State { …; legacy: Legacy | null; … }
```

- `recordSession` escribe `days[today].reference.push(wpm)` cuando `rec.reference`, y `days[today].sessions++`.
- **Migración v2 → v3**: recorre `sessions` y rellena `days[d].reference` y `days[d].sessions` por día local (`dayKey(new Date(at))`); `legacy = null`. Días sin entrada en `days` se crean con `seconds: 0, blocks: 0, learned: 0, mastered: 0`.
- `referenceByDay` (`engine/stats/progress.ts`) pasa a leer de `days` (`{ day, wpm: median(reference), n: reference.length }`), no de `sessions`. `referenceHeadline`, marcas y chart no cambian. `ghostWpm` (race) sigue leyendo sesiones de 7 días (están dentro del tope).
- "Ejercicios" en Inicio = `Σ days[*].sessions`.
- Tests: migración (backfill correcto por día local; idempotente), `referenceByDay` desde `days`, `recordSession` acumula.

## 5. Exportar / importar

Ajustes, tarjeta nueva **"Tu progreso"** arriba de "Reiniciar progreso".

- **Descargar copia**: genera `typelight-progreso-YYYY-MM-DD.json` con `{ app: 'typelight', version: 3, exportedAt, state }` donde `state` es exactamente lo que persiste zustand (`settings`, `lessons`, `keys`, `sessions`, `streak`, `routine`, `days`, `legacy`). Descarga por `Blob` + `<a download>`. Muestra "Última copia: hace N días" (`settings.lastBackupAt`).
- **Importar copia**: `<input type="file" accept=".json">`; valida `app === 'typelight'` y `version ≤ 3`; si `version < 3` aplica `migrateState`; confirma ("Reemplaza el progreso actual por el de la copia del DD/MM. ¿Seguir?"); escribe el estado con `useStore.setState` y `useStore.persist` lo guarda. Errores en texto plano ("No parece una copia de TypeLight").
- **Antes de reiniciar**: el botón "Reiniciar…" primero ofrece "Descargar copia" si `lastBackupAt` es nulo o anterior a hoy.
- **Recordatorio**: en Inicio, una línea discreta si no hay copia en 30 días: "Hace más de un mes que no guardás una copia de tu progreso. Ajustes → Descargar copia." Nada de modales.
- Tests: unitario de `serializeBackup` / `parseBackup` (motor de app, en `src/app/lib/backup.ts`, con tests en jsdom); e2e: exportar → borrar → importar → el progreso vuelve.

## 6. Fixes

| # (reporte §3) | Cambio |
|---|---|
| 3 | Reto: una sola llamada `sentencesText(pool, 10, { rng })` (frases distintas) y se corta al primer límite ≥ 420 chars; si devuelve `''`, `wordsText(pool, 90)`. Test: sin frases repetidas cuando el corpus tiene ≥ 10 candidatas. |
| 4 | `completeTip` deja de llamar `markRoutine('lesson')`. El tip sigue completándose (3 estrellas) y navega a la lección siguiente, que marca el bloque. Test e2e: un tip no pinta la tarjeta Lección. |
| 9 | `Home` "Precisión reciente" → "Precisión · 7 días" con `weeklyAccuracy` (mismo número que Progreso). |
| 12 | Calentamiento: "~1 min". |
| 13 | `useTypingSession`: mientras `document.hidden`, el reloj no corre (acumula `hiddenMs` y lo descuenta de `elapsedMs` y de `seconds`); una latencia que atraviesa una pausa se trata como `MAX_LATENCY`. Test: `metrics` ignora tiempo oculto. |
| `next` | `useProgress.next` = primera lección no completada con `index > last.index`; si no hay, la primera no completada. Así se pueden insertar lecciones en unidades ya pasadas sin que "Ir a la lección" retroceda. `isUnlocked` no cambia. Test unitario del cálculo (extraer a `engine/curriculum/progress.ts` puro). |

## 7. Corpus de frases por etapa

### 7.1 Fuente y script
`scripts/build-sentences.py`, hermano de `build-corpus.py`, genera `src/engine/corpus/sentences.generated.ts` (no editar a mano).

- Entrada: `spa_sentences.tsv` de Tatoeba (descarga manual a `scripts/`, CC BY 2.0 FR; se cita en el encabezado del archivo generado y en `README`/handoff), más `dict.json` ya usado por `build-corpus.py`.
- Filtros, en orden: solo caracteres del conjunto `[a-záéíóúüñA-ZÁÉÍÓÚÜÑ ,.;:¿?¡!'"()-]` (nada de dígitos en el corpus general); largo 40–90; empieza con mayúscula y termina en `.`, `?` o `!`; **ninguna mayúscula que no sea la primera letra o siga a `¿`/`¡`/`.`** (saca nombres propios); todas las palabras, sin tildes, en el diccionario; ninguna palabra en la `BLOCK` de `build-corpus.py` (se importa desde un módulo compartido `scripts/corpus_common.py`); sin formas de vosotros (`-áis`, `-éis`, `vosotros`, `os `, `vuestro`); sin `Tom`, `Mary`, `María`, `Juan`… (lista `NAMES`); sin duplicados ni casi-duplicados (misma frase en minúscula sin puntuación).
- Cuota: hasta **1500** frases, muestreadas al azar con semilla fija entre las que pasan, con al menos **400 sin tildes** (para las etapas anteriores a Tildes) y al menos 300 con `¿`/`¡`/`?`/`!`.
- Salida: `export const GENERATED_SENTENCES: string[]`.

### 7.2 Frases de la casa
`sentences.ts` conserva `SENTENCES` (85) y se amplía a mano a ~200 en el mismo registro (rioplatense, datos curiosos, consejos de tipeo), con al menos 60 sin tildes. Se escriben en esta etapa y Seba las revisa por muestreo. `NUMBER_SENTENCES` y `SYMBOL_SENTENCES` no cambian.

### 7.3 Generador
`sentencesText(pool, count, { corpus, rng })` en `engine/generator/index.ts`:

- Fuente `general` = `SENTENCES` con peso 3 + `GENERATED_SENTENCES` con peso 1 (muestreo ponderado sin reposición).
- **Normalización por pool**: `fitSentence(s, pool)` devuelve la frase adaptada o `null`: si el pool no tiene mayúsculas, se pasa a minúscula; si no tiene `.`/`,`/etc., se quita la puntuación que falte (y `¿ ¡`); después `usesOnly`. Las tildes y la ñ **nunca** se quitan (cambiarían la palabra). Así "El pulpo tiene tres corazones." sirve en Fila inferior como "el pulpo tiene tres corazones".
- Objetivo verificado por test: con el pool de "alfabeto + espacio" (LATAM) hay ≥ 300 frases; con "+ mayúsculas" ≥ 300; con "+ tildes" ≥ 1000.
- Consumidores sin cambios de firma: Reto, `ExerciseSpec sentences`, Carrera (`raceText`).

## 8. N-gramas del español

### 8.1 Tabla
`build-corpus.py` pasa a emitir también `src/engine/corpus/ngrams.ts`: `BIGRAMS: [string, number][]` (top 150) y `TRIGRAMS: [string, number][]` (top 100), contados **dentro de palabra** sobre las 6000 palabras ponderadas por su frecuencia en `es_50k.txt` (el script ya lee la frecuencia; hoy la descarta). Solo letras minúsculas con tildes y ñ.

### 8.2 Generador y spec
- `ExerciseSpec { kind: 'ngram'; pool: string[]; n: 2 | 3; combination?: number; repetition?: number; tokens?: number }`.
- `ngramText(pool, n, { combination = 3, repetition = 3, tokens = 15, weak?, rng })`: filtra los n-gramas tipeables con el pool, elige `combination` n-gramas ponderados por frecuencia (y ×3 si contienen una tecla de `weak`), y arma tokens "que ent ado que ent ado …" (estilo Ngram Type: combinación × repetición), intercalando cada 3 tokens una palabra real que contenga uno de los n-gramas elegidos (de `candidateWords`), para que el chunk se practique dentro de palabra. Con < 6 n-gramas tipeables cae a `wordsText`.
- Determinista con `rng`; tests: solo caracteres del pool, repetición consecutiva presente, sesgo a `weak`.

### 8.3 Dónde se usa
- **Velocidad**: dos lecciones nuevas al principio de la unidad, antes de "Texto 1": `velocidad-bigramas` ("Bigramas del español", `kind: 'practice'`, 3 ejercicios `ngram n=2`) y `velocidad-trigramas` (`ngram n=3`). Gracias al `next` robusto (§6), si Seba ya pasó ese punto no le retroceden la ruta; quedan abiertas por el soft lock de unidad.
- **Calentamiento**: en días impares del año (`dayOfYear % 2`), el texto es `ngramText(pool, 2, { weak })` en vez de `wordsText`; el título dice "Calentamiento · bigramas". Sigue sin ser referencia y sigue marcando `warmup`.
- Ruta (`Path.tsx`): leyenda `ab` / sub "n-gramas".

## 9. Sello "velocidad honesta"

En `Stats.tsx`, bajo el tile de Velocidad de referencia, una línea plegable ("¿por qué este número?") con tres frases: solo Retos, textos de Velocidad y Carreras; mediana por día; precisión al primer intento (los errores cuentan aunque el ejercicio termine perfecto). Sin números nuevos.

## 10. Tu velocidad de antes

- **Captura**: Ajustes → tarjeta "Tu velocidad de antes" ("Tipeá un minuto como tipeabas antes de TypeLight: sin pensar en los dedos. Es la vara que vas a superar."). Botón → `/practica/antes`: misma `Practice` con `kind: 'antes'` (título "Como antes", 60 s, texto = `sentencesText` con el pool **completo** del layout — sin normalizar; parar en el error como siempre). Al terminar: guarda `legacy = { wpm, acc, at }`; **no** graba sesión, no toca racha, rutina ni `keys`. Se puede repetir; guarda el último. En Inicio, mientras `legacy === null`, la tarjeta de "Últimos números" muestra "Tu velocidad de antes: medila en Ajustes".
- **Chart**: `ReferenceChart` recibe `legacy?: number` y dibuja una línea punteada gris con etiqueta "antes: N".
- **Hito**: cuando la mediana de referencia de los últimos 7 días con dato ≥ `legacy.wpm` por primera vez, `legacy.beatenAt = hoy` y en Inicio aparece una tarjeta única, sin confetti: "Superaste tu forma vieja: N PPM con los dedos correctos contra M de antes." Se cierra y no vuelve.
- Tests: `legacyBeaten(points, legacy)` puro en `progress.ts`; e2e: medir → línea en el chart.

## 11. Tests

- Unitarios (Vitest): migración v2→v3; `referenceByDay(days)`; backup serialize/parse; Reto sin repetidas; `next` robusto; `fitSentence` y cobertura por pool (≥ 300 / ≥ 300 / ≥ 1000); `ngramText`; `legacyBeaten`; `metrics` con tiempo oculto.
- e2e (Playwright): exportar → reiniciar → importar; tip no marca Lección; lección `velocidad-bigramas` jugable; `/practica/antes` deja la línea "antes" en Progreso.
- `npm run build` y `npm run serve` levantan `dist/` y la app carga desde `/estadisticas` directo (SPA fallback).

## 12. Riesgos y decisiones menores

- **Tatoeba trae "translationese"** ("Tom fue a la tienda"). Mitigación: filtros de §7.1, peso 3 a las frases de la casa, y una muestra de 100 generadas en el PR para que Seba las ojee. Si no le gustan, se baja la cuota o se sube el peso de la casa; el mecanismo queda.
- **Cambiar `referenceByDay` a `days`** no cambia ningún número (mismas sesiones, misma mediana): verificar en el test de migración con el estado sembrado de `e2e/stats.spec.ts`.
- **Importar una copia** reemplaza todo; no se mezcla. Es más simple y es lo que Entertrained hace.
- **`vite preview`** no es un servidor de producción, pero para un usuario en localhost es exactamente lo que hace falta y no agrega dependencias.
- **Lecciones nuevas en Velocidad** aparecen sin estrellas en una unidad que Seba quizá ya empezó: es esperado y el `next` robusto evita que lo manden atrás.
- **Al compás con n-gramas** (idea del backlog) no entra: las notas siguen siendo letras sueltas.
