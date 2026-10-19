# Verificación adversarial B

Base: worktree `typelight-comprehensive-review-466e4d` @ 616de67. Repros en tests temporales `src/**/zz-verify-b-*.test.ts` (ya borrados; `git status` limpio) y scripts de Python en el scratchpad (`verifyb_tuteo*.py`). La severidad está pensada para amigos que usan Chrome de escritorio.

## Tabla

| ID | Veredicto | Severidad | En una línea |
|---|---|---|---|
| P-01 | CONFIRMADO | alto | La pestaña vieja reescribe el estado entero y borra lo de la nueva. No hay listener de `storage` ni rehidratación. Lo reproduje. |
| P-02 | CONFIRMADO CON MATICES | bajo (medio si alguien usa Safari) | El borrado de ITP existe, pero sólo en Safari. `persist()` no arregla nada demostrable allí. En Chrome no aplica. |
| P-03 | CONFIRMADO CON MATICES | bajo | La foto se serializa cuando corre en la cola, no cuando se encola. El doble clic depende de un disco lento. El caso B (dos reinicios en el día) es seguro. |
| P-05 | CONFIRMADO (latente) | bajo | zustand llama a `migrate` también con una versión mayor, y `migrate` la devuelve tal cual. Hoy no existe una v9. |
| P-06 / O-02 | CONFIRMADO CON MATICES | bajo | Lo reproduje, incluido `layoutId:"toString"`, que rompe `curriculumFor`. Una copia real nunca trae claves de más: hace falta un JSON editado a mano. |
| P-07 | CONFIRMADO | bajo | «Empezar de cero» sólo desbloquea, y 3 s después se pisa el archivo de hoy. Los requisitos son raros. |
| S-02 | CONFIRMADO CON MATICES | medio | El rollover se indexa por `e.key` y no se limpia en blur. El daño dura **una sesión**, no «para siempre», y el Reto empieza con mayúscula. |
| S-03 | CONFIRMADO CON MATICES | bajo | El mecanismo es cierto, pero el ritmo es más lento: unas 5–6 sesiones por día con la rutina, así que el tope de 1000 llega en ~6 meses (~3 meses para alguien intenso). |
| S-04 | CONFIRMADO, y peor | medio (palabras) / bajo (bigramas) | Se graba una muestra por palabra **por sesión**, así que repetirla en la misma sesión no ayuda. Además, la basura de los drills («fff», «úúú») ocupa lugares para siempre. |
| S-07 | CONFIRMADO | bajo | El titular del resumen semanal dice «meta semanal cumplida: 6 de 5 días» y el subtítulo dice «6 días, meta de 5 cumplida». |
| S-08 | CONFIRMADO | bajo | A las 00:30 de Madrid en verano da 291 y a las 01:30 da 292. Sólo afecta qué juego toca en el calentamiento. |
| E1-02 | CONFIRMADO | medio | Unas 35 de las 1500 frases (~2,3 %) tienen tuteo claro o contenido delicado. ~73 % de las frases del Reto salen de Tatoeba. ~13 % de los Retos traen al menos una de esas frases. |
| E1-07 | CONFIRMADO CON MATICES | bajo | Las palabras están en el archivo, pero «pene», «vagina», «mataré» y «man» no aparecieron en 37 800 palabras generadas. Las formas de tú sí son frecuentes, y eso es una decisión documentada. |
| O-03 | CONFIRMADO | bajo | Google Fonts es el único tercero (`index.html:9-14`). |
| O-06 | CONFIRMADO | bajo | La app no tiene versión (`package.json` dice `0.0.0`, no hay `define`) ni ningún canal de reporte. |

---

## Detalle

### P-01 · CONFIRMADO · alto
- `src/app/store/index.ts:192-310`: `persist` no tiene `partialize`, y cada `set` escribe el estado completo que esa pestaña tiene en memoria. Un grep de `addEventListener('storage'|focus|pageshow)`, `BroadcastChannel`, `rehydrate` y `navigator.locks` en `src/` sólo encuentra listeners de `visibilitychange` (`useTypingSession.ts:58`, que pausa el reloj, y `autoBackup.ts:230`, que hace flush) y de `blur` (`usePressedKeys.ts:21`). Ninguno rehidrata.
- Repro (dos imports del store con `vi.resetModules()` sobre el mismo localStorage): B grabó 2 sesiones y 1 lección. A después hizo sólo `setSettings({sound:false})`, y en localStorage quedaron `sessions 0` y `lessons []`. **Basta con tocar un ajuste en la pestaña vieja**; no hace falta practicar.
- Copia automática: `autoBackup.ts:213` (`getState` de esa pestaña) más el nombre único por día confirman que el archivo de hoy también queda con el estado viejo.
- Mitigación parcial, y no determinista: el «Ahorro de memoria» de Chrome descarta pestañas inactivas, y al volver la pestaña se recarga y rehidrata. No es algo con lo que se pueda contar.

### P-02 · CONFIRMADO CON MATICES · bajo para el público objetivo
- WebKit, *Full Third-Party Cookie Blocking and More* (2020): borra localStorage, IndexedDB y el resto del almacenamiento escribible por script **después de 7 días de uso de Safari sin interacción con el sitio**. Son días en que se usó Safari, no días de calendario. Las web apps agregadas a la pantalla de inicio quedan exentas.
- WebKit, *Updates to Storage Policy* (Safari 17): por defecto el modo es best-effort. `persist()` se concede «por heurística», y el ejemplo que dan es una web app de la pantalla de inicio. Un origen «might be excluded from eviction» si está en modo persistente. **No hay ninguna documentación que diga que el modo persistente exima del tope de 7 días de ITP.** Eso sigue siendo hipótesis, y lo más probable es que en una pestaña común `persist()` ni se conceda.
- `requestPersistence` (`storage.ts:73-75`) hace `navigator.storage?.persist?.().catch(()=>{})` sin leer el resultado, y sólo cuando ya hay `onboarded` al cargar (`main.tsx:61`). En Chrome la concesión es silenciosa y depende del engagement o de un marcador, y sólo protege ante falta de espacio. En Safari no cambia nada demostrable.
- `backup.ts:109`: sin copia, el aviso aparece con `activeDays >= 14`. `Home.tsx:258` lo muestra con `auto.state` en `off` o `unsupported`. Confirmado.
- Para amigos en Chrome de escritorio, ITP no existe. Sube a medio si alguno usa Safari en Mac.

### P-03 · CONFIRMADO CON MATICES · bajo
- `autoBackup.ts:120`: `serializeBackup(deps.getState(), now)` corre adentro del trabajo encolado. `Settings.tsx:281-285` y `BackupRestore.tsx:43-52` no deshabilitan el botón durante el `await`.
- El caso B, un segundo reinicio o importación en el mismo día que pisa `…-antes-de-reiniciar.json`, es seguro: `autoBackupName` da un solo nombre por día (`backupFiles.ts:16-17`).
- El caso A, el doble clic, necesita copia automática activa y una escritura lenta. La pérdida se limita a lo hecho hoy.

### P-05 · CONFIRMADO (latente) · bajo
- `node_modules/zustand/esm/middleware.mjs:392`: llama a `migrate` si `version !== options.version`, también cuando la guardada es mayor. `migrate.ts:96` la devuelve tal cual.
- Hoy no existe una v9, así que el bug está latente. Lo único que lo dispara es un bundle viejo que carga datos nuevos (un `index.html` cacheado justo después de un deploy). El problema real de las pestañas viejas es P-01.

### P-06 / O-02 · CONFIRMADO CON MATICES · bajo (O-02 decía medio)
- Repro: una copia con `state.recordSession = 0` pasa `parseBackup` (`ok: true`). Después de importar, `typeof recordSession` da `number`, sigue en `number` tras `resetProgress()` y también después de recargar el módulo.
- `layoutId: "toString"` también pasa (`backup.ts:48`, porque `'toString' in LAYOUTS` es true). Después `curriculumFor(LAYOUTS.toString)` tira `TypeError: layout.rows is not iterable`, y ese llamado está en `useProgress` (`useCurriculum.ts:25`), que corre en cada render. La app queda rota en cada carga, y ni reiniciar el progreso lo arregla, porque `settings` se conserva.
- **¿Se puede llegar con una copia real?** No. `serializeBackup` recibe `persistedState(...)`, que se queda sólo con `PERSISTED_KEYS` (`index.ts:345`, `autoBackup.ts:213`). Las migraciones `toV2..toV8` sólo agregan claves (`migrate.ts:36-85`), así que una copia vieja tampoco trae claves ajenas. Los `layoutId` reales son `us`, `es` y `latam`. Hace falta un JSON editado a mano o generado por otra herramienta.
- Por eso le doy severidad baja: el daño es total, pero la probabilidad es casi nula. El arreglo cuesta tres líneas.

### P-07 · CONFIRMADO · bajo
- `Welcome.tsx:118`: `onClick={unblockWrites}`. `autoBackup.ts:115-120`: `write` sólo mira `isBlocked()`, y como el primer `setSettings` marca `dirty`, a los 3 s escribe el estado vacío sobre `typelight-progreso-<hoy>.json`.
- Los requisitos son raros: tiene que haber fallado la carga, la copia automática tiene que estar activa y la persona tiene que haber practicado hoy. La pérdida se limita al día de hoy.
- La agravante que proponía el reporte (que restaurar falle por la misma migración) es plausible, porque las copias en la carpeta se escriben con la versión de la app que las generó. Sigue siendo hipótesis.

### S-02 · CONFIRMADO CON MATICES · medio
- `useHiddenInput.ts:82` y `:89` pasan `e.key`. `rollover.ts:22,27` indexa `held` por esa clave. No hay limpieza en `blur` ni en `visibilitychange`.
- Repro del motor: una frase de 40 pulsaciones de a una tecla, donde la «L» inicial baja como `'L'` y sube como `'l'`, da `presses 40, overlaps 39, held ['L'], ratio 0.975`.
- Matiz 1: el contador se crea de nuevo en cada sesión (`useRef(newRollover())` por ejercicio en `LessonPlayer.tsx:408`; `Practice.tsx:355` lo reinicia). Así que no queda «para siempre»: arruina el resto de **esa** sesión. Pero el Reto y la Velocidad empiezan con mayúscula, así que alcanza con soltar Shift primero una sola vez para que esa sesión dé casi 1.
- Matiz 2, hipótesis no verificada: con teclas muertas (´ + a), es posible que Chrome dé `key='á'` en el keydown y `'a'` en el keyup. Eso dejaría trabada cada vocal con tilde, aun sin Shift. Se confirma logueando los eventos en Chrome con el teclado ES o LATAM.
- Que `key` siga a los modificadores del momento es lo que dice la especificación (UI Events), pero no lo logueé en un Chrome real.

### S-03 · CONFIRMADO CON MATICES · bajo
- `index.ts:230`: `.slice(-1000)`. Cada ejercicio de una lección es una sesión (`LessonPlayer.tsx:105`).
- Lo medí sobre el camino principal LATAM: son 154 lecciones y **293 ejercicios** en total (`keys` y `review` tienen 2 cada una, `practice` 2,2, `text` y `unit-review` 3; `tip` y `game` no tienen ejercicios). La rutina diaria suma más o menos calentamiento (1) + lección (2–3) + repaso (1) + Reto (1), o sea **5–6 sesiones por día**. Así, 1000 sesiones son unos 170–200 días de rutina, o unos 100 días para alguien que hace varias lecciones y juega. El «uno a tres meses» del reporte es pesimista.
- El mecanismo (récords sobre `sessions` que bajan solos) sigue siendo cierto, pero tarda meses en aparecer y es sutil.

### S-04 · CONFIRMADO, y más fuerte de lo que dice el reporte · medio para palabras, bajo para bigramas
- `typing/index.ts:346-387`: `wordSamples` devuelve un `Map` indexado por palabra, así que las repeticiones dentro de una sesión se funden. Es **una muestra por sesión**, y la salida que proponía el reporte («las que aparecen dos veces en una misma sesión») no existe.
- Simulación: recorrí el camino entero (293 sesiones) y después hice 4 Retos por día con el pool completo. Al terminar el camino la tabla tiene 400 entradas y todavía acepta palabras nuevas. Se **congela** (mínimo de muestras ≥ 2, y una palabra nueva se desaloja en la misma llamada) a los **63 días** de Retos: el día 80, la sonda `zzprobe` ya no entra.
- Hallazgo nuevo: los tokens de los drills cuentan como palabras («fff», «úúú», …: unas 34–41 entradas sin vocal sólo en mi simulación). Juntan muestras al principio y no se van nunca. En la simulación, «úúú» apareció en `weakestWords`, lo que alimenta la tarjeta «Palabras que piden práctica» (`Stats.tsx:363`). Con latencias reales, los drills de teclas nuevas son lentos y con errores, así que es plausible que encabecen esa tarjeta. Esto último es hipótesis, y se confirma mirando el estado de alguien que hizo el camino.
- Bigramas: en 400 Retos aparecen 701 bigramas distintos, más que el tope de 600, así que la tabla se llena. Pero las muestras se cuentan por intento, y los que quedan afuera son los raros (mayúscula o puntuación). El impacto es bajo.

### S-07 · CONFIRMADO · bajo
- `week.ts:62` arma `meta semanal cumplida: ${activeDays} de ${goal} días`. Eso es el **titular** de `WeeklySummaryCard.tsx:41`, y el subtítulo de la misma tarjeta usa `weekGoalLabel` («6 días, meta de 5 cumplida»): se contradicen en la misma tarjeta. Sólo pasa cuando no hay delta de referencia, ni teclas nuevas, ni +1 punto de precisión.
- `Stats.tsx:284-286` muestra `{weekDays} de {weeklyGoal}` junto a la barra. Ahí «6 de 5» se lee como un contador y molesta menos.

### S-08 · CONFIRMADO · bajo
- Repro con `TZ=Europe/Madrid`: el 2026-10-19 a las 00:30 da 291 y a las 01:30 da 292. El 2026-01-19 a las 00:30 da 19, y el 2026-10-26 a las 00:30 (ya en horario de invierno) da 299, los dos bien.
- Uso: `warmupGame(dayOfYear(), …)` en Inicio y en Práctica. El efecto es que el juego del calentamiento anunciado y el que se abre pueden no coincidir si se cruza la 01:00. Es mínimo.

### E1-02 · CONFIRMADO · medio
- Todas las líneas citadas existen (4, 5, 8, 466, 597, 602, 603, 617, 632, 670, 1045, 1230, 1238, 1249, 1377, 1433). La memoria de arquitectura (línea 29) dice «sin tuteo» para estas frases, y el filtro (`scripts/build-sentences.py`, `TUTEO`) sólo cubre una lista de presentes frecuentes. Bien que deje pasar subjuntivos, condicionales y el posesivo «tu», porque el voseo también los usa.
- Conteo con una heurística (presentes de tú fuera de la lista, imperativos de tú al principio de una cláusula y «tú»), revisado a mano: 40 marcadas, menos 5 falsos positivos (l.52 «sigue siendo», l.88 «ve tantas», l.154 «Deja mucha nostalgia», l.283 «presenta lagunas», l.1378 «Toma tiempo»), da **~35 de 1500 (≈ 2,3 %)**. Es una cota inferior: no cubre imperativos a mitad de frase. Aparecen además «Viajas…», «¿coleccionas…?», «Dispones de…», «Piensa harto», «Trae al portero», «Enciende la chimenea».
- Peso en el Reto: hay 184 frases de la casa (peso ×3) y 1500 generadas (peso ×1). Lo medí con `pickSentences` hasta 420 caracteres, en 2000 Retos por pool:
  - con el pool completo, el **73 %** de las frases del Reto vienen de Tatoeba;
  - a mitad del camino (lección 61, entran 91 de la casa y 507 generadas), el 66 %;
  - el **~13 %** de los Retos (20 % a mitad del camino) trae al menos una de las ~35 frases marcadas.
- «te mataré» y «se suicidó» confirmados, más un error ortográfico en l.8 («que tu me recomendaste»). Los dos delicados importan más que el tuteo.

### E1-07 · CONFIRMADO CON MATICES · bajo
- Rangos en `WORDS` (de 5917): mataré 2109, pene 2375, mato 2558, man 3160, vagina 4729, y además **maté 1767**. Las formas de tú: tú 53, estás 51, tienes 74, eres 80, quieres 100.
- Alcance: `candidateWords(pool, 1500)` corta en las primeras 1500 palabras tipeables. Ningún patrón del camino (`que, ent, ado, con, est, ien, mente, nte, los, para`, en `build.ts:215`) contiene esas palabras. Muestreé 37 800 palabras de `wordsText` en 18 pools del camino: **0** apariciones de pene, vagina, mataré, maté y man, y **2** de «mato», que es alcanzable en 2 de los 18 pools.
- Las formas de tú aparecieron 294 veces (≈ 0,8 % de las palabras: eres 67, puedes 55, quieres 51, tienes 41…). La memoria (línea 14) dice que la blocklist de palabras saca vosotros, pero no el tuteo: es una decisión, no un bug.
- El comentario de `words.ts:2` («sin vulgaridades ni violencia») es falso para ese puñado de palabras, pero en la práctica casi no salen.

### O-03 · CONFIRMADO · bajo
- `index.html:9-14`: dos `preconnect` y la hoja de `fonts.googleapis.com` (con `display=swap`). No hay otros terceros en `src`: lo único que aparece son links de créditos en `Settings.tsx:322` y `Reading.tsx:79`. El riesgo legal real entre amigos es mínimo. Autoalojar es barato.

### O-06 · CONFIRMADO · bajo
- `package.json:4` dice `"version": "0.0.0"`. `vite.config.ts` no tiene `define` ni hay un `__APP_VERSION__`. Ajustes termina en los créditos (`Settings.tsx:320-330`) y no hay contacto. Para amigos el canal natural es WhatsApp; lo que realmente falta es poder saber qué deploy tenía cada uno.
