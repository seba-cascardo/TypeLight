# Ola 5 · Extras — diseño

Fecha 2026-09-18 · sesión nocturna: decisiones del agente sobre el roadmap aprobado (`docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 5, puntos 29–34). Los puntos 35 (modo lectura, L) y 36 (numérico y símbolos de código, M) quedan en el backlog: piden corpus y unidades nuevas que no entran en una sesión nocturna y conviene que Seba decida si los quiere.

**Estado:** en implementación (rama `ola-5`).

## 1. Texto propio (punto 29)

- Ruta `/texto`: un `textarea` («Pegá un mail, un párrafo, lo que sea») + «Tipear». `prepareOwnText(text, layout)` (motor): colapsa espacios y saltos de línea, normaliza comillas y guiones tipográficos a ASCII, quita los caracteres que el layout no puede tipear, recorta a 1500 caracteres. Vacío → botón deshabilitado.
- Se tipea en modo `free` (como el Reto), sin teclado ni manos, sin reloj; graba `kind: 'review'` **sin** `reference` ni bloque de rutina, con bigramas y palabras. Resultado con los cuatro números del Reto (velocidad, al primer intento, reparados, teclas por letra) y «Otro texto» / «Volver».
- Enlace en Inicio (tarjeta «Últimos números»: «Tipear un texto propio →») y en el menú no (YAGNI).

## 2. Compromiso semanal (punto 30)

- `settings.commitment: string` (default `''`), editable en Ajustes («Esta semana, fuera de la app: ___», placeholder «escribo los mails sin mirar el teclado»).
- Con compromiso no vacío, la tarjeta «Tu semana» (resumen semanal, Ola 3) agrega «¿Cumpliste: “…”?» con **Sí / No**; la respuesta va a `commitments[week]` (`'si' | 'no'`, store) y cierra la tarjeta. Progreso (Constancia): «Compromiso: N de M semanas».

## 3. Muerte súbita y racha de precisión (punto 31)

- **Muerte súbita** = juego `sudden` (`GameId`), solo en la fila «Jugar» de Inicio (no en la ruta): texto real (`challengeText`), modo `stop`; **el primer error termina**; puntaje = caracteres correctos. Estrellas: 3 ★ ≥ 120 caracteres, 2 ★ ≥ 60, 1 ★ el resto. Graba `kind: 'game'`, `gameId: 'sudden'`, sin referencia. El pie del resultado muestra el mejor puntaje histórico (máximo de `sessions` con `gameId: 'sudden'`).
- **Racha de precisión** = caracteres seguidos sin error dentro de una sesión (`cleanRun(state)` en `engine/typing`, sobre intentos, Backspace no corta). Se guarda como `SessionRecord.cleanRun`. Progreso (Récords): «Racha de precisión: hoy N · histórica M».

## 4. Fantasma «vos hace 30 días» (punto 32)

- `ghostWpm30(days, today)` = mediana de las referencias de hace 30–36 días (null sin datos). La Carrera recibe `ghostOptions: { week: number; month: number | null }`; antes de arrancar (sin keystrokes) muestra dos keycaps «Esta semana · N PPM» / «Hace 30 días · M PPM» (la segunda solo si existe). La elección vive en el componente; el rótulo del fantasma la refleja.

## 5. Reto del día con semilla fija + copiar resultado (punto 33)

- El texto del Reto se genera con `makeRng(seedOf(dayKey()))` (mismo texto todo el día; «Otra vez» repite el mismo texto). Idea: cualquiera con la app tipea lo mismo ese día.
- En el resultado del Reto: «Copiar resultado» → portapapeles: `TypeLight · Reto 18/9 · 34 PPM · 96 % al primer intento · ⌨️ 🟩🟩🟩🟨⬜` (cinco casillas: velocidad sobre la meta de la unidad, de 0 a 5). `shareText(...)` pura en `src/app/lib/share.ts`. Sin portapapeles → «No se pudo copiar».

## 6. Metrónomo opcional en `practice` (punto 34)

- `settings.metronome: boolean` (default `false`), Toggle en Ajustes («Metrónomo en las prácticas: un pulso al 90 % de la meta de la unidad; es folklore, pero frena al que atropella»).
- En `Exercise` de lecciones `practice`, encendido: `tick()` (sonido corto, `lib/sound.ts`) cada `60000 / (goalWpm × 0.9 × 5)` ms desde la primera tecla hasta terminar, y un punto que late en la línea de meta. Solo si `settings.sound` está encendido suena; el punto late igual.

## 7. Store v7

- `settings.commitment`, `settings.metronome`, `commitments: Record<string, 'si' | 'no'>`, `SessionRecord.cleanRun?`. `GameId` suma `'sudden'`. `PERSISTED_KEYS` suma `commitments`; reset lo vacía; backup v7.

## 8. Verificación

Unitarios: `prepareOwnText`, `cleanRun`, `ghostWpm30`, `shareText`, `starsForGame('sudden')`, migración v7, backup v7. e2e: `/texto` de punta a punta; muerte súbita termina al primer error; Reto con el mismo texto dos veces y «Copiar resultado»; Ajustes con compromiso y metrónomo; la Carrera con el fantasma de 30 días. Lint sin nuevas · build.
