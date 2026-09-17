# Ola 3 · Hábito — diseño

Fecha 2026-09-18 · sesión nocturna: decisiones tomadas por el agente sobre el roadmap aprobado (`docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 3, puntos 15–21; §6 insight 7; §7 «lo que no haría»). Seba las revisa cuando vuelve; cada una lleva su porqué.

**Estado:** implementado completo (rama `ola-3`, mergeada fast-forward a `master` el 2026-09-18). Desvíos: la mascota dice «N de 4. Seguimos.» mientras la rutina está a medias (por encima del examen/juego/racha); el récord se juzga contra `records(days).bestReference` previo (solo sesiones de referencia); `keyReason` no distingue «lenta» por meta de unidad sino por umbral fijo de 700 ms.

## 0. Qué es

Lo barato y respaldado del hábito: una racha que perdona, una meta semanal separada de la racha, un resumen por semana con una victoria concreta, récords que no se inflan, hitos con significado, el «por qué hoy» del Repaso y una mascota que habla una línea en Inicio. Nada de ligas, XP, corazones ni notificaciones (§7). Todo silenciable o cerrable; ninguna celebración dura más de 1,5 s.

## 1. Racha amable (punto 15)

- `Streak` pasa a `{ count, lastDay, best, freezes, activeDays }`. **Día activo** = una sesión grabada (`recordSession`: Calentamiento, ejercicio de lección, Repaso, Reto, examen, juego). Un tip ya no mueve la racha (`completeLesson` deja de llamar a `bumpStreak`; las lecciones con ejercicios graban sesiones igual).
- `bumpStreak(streak, today)`: mismo día → sin cambio. `gap = daysBetween(lastDay, today)`: `1` → `count + 1`; **`2` → `count + 1` («nunca dos veces»: un día perdido se perdona si practicás el siguiente)**; `≥ 3` → hacen falta `gap − 2` comodines: si hay, se consumen y `count + 1`; si no, `count = 1`. `activeDays + 1`; se gana **un comodín cada 5 días activos** (`FREEZE_EVERY = 5`), tope **2** (`MAX_FREEZES`); `best = max(best, count)`.
- `streakAlive(streak, today)` = `gap ≤ 2 + freezes` (la racha sigue viva mientras hoy todavía pueda salvarla). `streakAtRisk` = `gap ≥ 2` (hoy hace falta practicar).
- UI: la llama de la barra muestra `count` si está viva; título «N días seguidos · M comodines». Progreso (Constancia): «racha N · mejor B · D días activos · M comodines». Inicio, si `lastDay` existe y `gap ≥ 2`: una línea sin culpa: «Volvés después de N días. Hoy cuenta igual.» (con comodín: «un comodín cubre el hueco»; racha perdida: «la racha vuelve a 1 hoy, los días activos no se borran»).
- Porqué: Lally 2010 (faltar un día no rompe la curva); Duolingo ganó retención aflojando la racha (§6.7).

## 2. Meta semanal (punto 16)

- `settings.weeklyGoal: number` (3..7, default **5**), editable en Ajustes (fila de keycaps 3·4·5·6·7).
- `weekActiveDays(days, today)` = días con `seconds > 0` en la semana ISO de `today`. `activeWeeks(days, goal)` = semanas (por `weekKey`) con días activos ≥ meta.
- Inicio, bajo el saludo: «Esta semana: 3 de 5 días» (verde al cumplirla). Progreso (Constancia): barra de la semana + «N semanas con la meta».

## 3. Resumen semanal (punto 17)

- Store: `lastWeeklySummaryWeek: string | null` (progreso). En Inicio, si `weekKey(today) !== lastWeeklySummaryWeek` **y** la semana anterior tuvo ≥ 1 día activo, tarjeta «Tu semana» (semana anterior): minutos, días activos (con la meta), mediana de referencia de la semana vs. la anterior (Δ PPM), precisión (Δ), teclas dominadas nuevas (snapshot `mastered` último vs. primero disponible), y **una victoria** (`weekWin`): la primera que aplique de: Δ mediana > 0 («+4 PPM de referencia»), teclas dominadas nuevas («2 teclas nuevas dominadas»), Δ precisión ≥ 1 punto, meta semanal cumplida, «N minutos, todos cuentan». «Cerrar» guarda la semana. Después de migrar, la primera visita muestra el resumen de la semana pasada (si hubo actividad) — es correcto, no un bug.
- `weeklySummary(days, sessions, today)` en `engine/stats/week.ts`; puro.

## 4. Récords honestos (punto 18)

- Derivados, sin store: `records(days, sessions)` → `{ bestReference: { wpm, day } | null, bestMedian7: { wpm, day } | null, bestWeeklyAcc: { acc, week } | null, bestRoutineRun: { days, endDay } | null }`. `bestReference` = máximo de `days[].reference`; `bestMedian7` = máximo de la mediana de los últimos 7 puntos de referencia (ventana móvil sobre `referenceByDay`, ≥ 3 puntos); `bestWeeklyAcc` = precisión (chars / (chars + errors)) por semana ISO sobre `sessions`, con ≥ 500 caracteres; `bestRoutineRun` = racha más larga de días consecutivos con `blocks ≥ 4`.
- Progreso: tarjeta «Récords» con las cuatro filas (o «todavía sin récords»).
- **Celebración:** en el resultado del Reto/examen, si `wpm > bestReference` previo (calculado antes de grabar) → chip «Récord personal» con `animate-pop` (260 ms) y la mascota `thrilled` un instante; nada más. No hay modal.

## 5. Hitos (punto 19)

- `MILESTONES = [7, 14, 30, 66, 100]` sobre **días activos** (`streak.activeDays`, no la racha: es lo que Lally cuenta, repeticiones del hábito). Store: `milestonesSeen: number[]`.
- Inicio: si el mayor hito alcanzado no está en `milestonesSeen`, tarjeta «Hito · N días activos» con su copy: 7 «Una semana de teclado. Ya es un principio.»; 14 «Dos semanas. La primera bajada de velocidad ya pasó.»; 30 «Un mes.» + **mes en resumen** (minutos, días activos, mediana de referencia hoy vs. hace 30 días, teclas dominadas hoy vs. hace 30 días); 66 «Sesenta y seis días: a partir de acá ya es hábito para la mayoría (Lally 2010).»; 100 «Cien días.». «Cerrar» marca ese hito y todos los menores como vistos.

## 6. «Por qué hoy» en el Repaso (punto 20)

- `KeyStat` suma `lastSeen?: string` (día); `updateKeyStats(stats, samples, today)` lo escribe. Migración: sin backfill (ausente = «sin fecha»).
- `keyReason(stat, today)` → texto corto: partes separadas por « · »: `«N % de error»` si `errorEma ≥ 0.05`; `«lenta: N teclas/min»` si `keySpeed` existe y `latencyEma > 700`; `«hace N días que no la ves»` si `lastSeen` y `gap ≥ 3`; sin partes → «todavía con pocos datos».
- Repaso: debajo de «Hoy insistimos con», una línea por tecla: «q · 12 % de error · hace 4 días». El «cap de atraso» no aplica: la app no muestra backlog en ningún lado (queda anotado).

## 7. Mascota en Inicio (punto 21)

- `settings.mascot: boolean` (default `true`), Toggle en Ajustes («Mascota en Inicio»).
- `MascotLine` junto al saludo: la cara (`Mascot` de los juegos, `idle`/`happy`/`thrilled`) y **una** línea elegida por estado, en este orden: récord de hoy (`thrilled`) → hito nuevo → vuelta tras hueco (`idle`, sin culpa) → rutina completa (`happy`: «Rutina completa. Lo que sigue es regalo.») → examen pendiente («Hoy toca el examen: tres minutos limpios.») → día de juego («Hoy el Calentamiento es un juego.») → racha ≥ 3 («N días seguidos. Sin apuro.») → default («Diez minutos y listo.»). Nunca culpa. La mascota reemplaza la frase «Cuatro teclas para hoy…» solo cuando está encendida; apagada, queda el texto de siempre.

## 8. Store y compatibilidad

- `version: 4 → 5`. `migrateState` v5: `streak` gana `best = count`, `freezes = 0`, `activeDays` = días con `seconds > 0` en `days` (o `count` si es mayor); `settings.weeklyGoal = 5`, `settings.mascot = true`; `lastWeeklySummaryWeek = null`; `milestonesSeen = []`. `PERSISTED_KEYS` suma los dos; `resetProgress` los limpia; `isPersistedState` valida `streak.best/freezes/activeDays` numéricos y `milestonesSeen` array; `BACKUP_VERSION = 5`.

## 9. Verificación

- Unitarios: `bumpStreak` (gap 1/2/3 con y sin comodines, ganancia cada 5, tope 2, best), `streakAlive`/`streakAtRisk`, `weekActiveDays`/`activeWeeks`, `weeklySummary` y `weekWin`, `records` (las cuatro), `milestoneReached`, `keyReason`, `updateKeyStats` con `lastSeen`, migración v5, `parseBackup` v5, `mascotLine`.
- e2e: Inicio con resumen semanal y cierre; hito 7 con cierre; línea de vuelta tras hueco; Repaso con «por qué hoy»; Ajustes con meta semanal y mascota; Progreso con Récords y la semana; tip no mueve la racha.
- Lint sin advertencias nuevas · build OK.

## 10. Orden

Motor (racha, semana, récords, hitos, razones) → store v5 → Inicio (línea de vuelta, meta, resumen, hito, mascota) → Ajustes → Progreso (Constancia, Récords) → Repaso → Reto (récord) → e2e → docs → merge ff.
