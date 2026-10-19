# Review: persistencia, migraciones y copias de seguridad

Área: `src/app/store/` (index, migrate, storage), `src/app/lib/backup*.ts`, `autoBackup.ts`, `idb.ts`, `components/BackupRestore.tsx`, `routes/Settings.tsx` (copia, importación y reinicio), `routes/Welcome.tsx` (rescate) y `main.tsx`. Base: rama `claude/typelight-comprehensive-review-466e4d` @ 616de67, zustand 5.0.15.

Los repros fueron tests temporales `src/**/zz-review-store-*.test.ts`, corridos con `npx vitest run` y ya borrados. Abajo, para cada repro, va el test resumido.

Leyenda de confianza: **repro** = lo reproduje con un test; **leyendo** = una cita del código lo prueba sin ambigüedad; **hipótesis** = falta confirmarlo, y digo con qué.

---

## P-01 · alto · Con dos pestañas abiertas, la vieja pisa el progreso de la nueva (en localStorage y en la copia automática)

- **Dónde:** `src/app/store/index.ts:192-310`: `persist` sin listener de `storage`, y no hay ningún `addEventListener('storage'`, `BroadcastChannel` ni `rehydrate` en `src/` (grep vacío). `src/app/lib/autoBackup.ts:213`: `getState` lee la memoria de esa pestaña.
- **Escenario:** a la mañana alguien abre TypeLight en la pestaña A y la deja abierta. A la tarde entra desde el marcador (pestaña B), hace la rutina y completa dos lecciones. B escribe `typelight.v1` con todo eso. Después vuelve a la pestaña A, que sigue con el estado de la mañana en memoria, y hace un ejercicio o toca un ajuste: zustand `persist` reescribe el estado **entero** de A (`setItem` → `partialize({...get()})`). Lo que se hizo en B desaparece, y en silencio: sesiones, lecciones, teclas, bigramas, racha y `days`. Unos 3 s después la copia automática de A sobrescribe también `typelight-progreso-<hoy>.json` con ese estado viejo, así que la copia del día tampoco tiene lo de B. Quedan los archivos de días anteriores.
- **A quién le pasa:** a cualquiera que tenga dos pestañas, y con amigos usuarios es muy plausible (una pestaña fija más el marcador). Pasa lo mismo con un deploy nuevo mientras una pestaña vieja sigue abierta: el bundle viejo escribe su estado.
- **Evidencia (repro):** sembré `typelight.v1` (v8), importé el store dos veces con `vi.resetModules()` (dos "pestañas" sobre el mismo localStorage), B grabó 2 sesiones y 1 lección, y A grabó 1 sesión. Resultado en localStorage: `sessions.length === 1` y `lessons` vacío. Pasó.
- **Confianza:** alta.
- **Arreglo sugerido:** `window.addEventListener('storage', e => { if (e.key === 'typelight.v1') useStore.persist.rehydrate() })`. El ejercicio en curso vive en estado de componente, así que no se pierde. Hacerlo **junto con P-05**: si no, una pestaña vieja rehidrataría datos de una versión más nueva y los re-etiquetaría. Alternativa más simple: avisar «TypeLight está abierta en otra pestaña» con `BroadcastChannel` o `navigator.locks`, y no escribir desde la pestaña que no tiene el lock.

## P-02 · medio · Safari borra todo el progreso tras 7 días sin abrir la app, y el recordatorio de copia llega recién a los 14 días activos

- **Dónde:** `src/app/lib/backup.ts:108-111` (`backupDue`: sin copia, avisa con `activeDays >= 14`), `src/app/routes/Home.tsx:258` y `src/main.tsx:61`.
- **Escenario:** un amigo en Safari de macOS. Ahí la copia automática no existe (`showDirectoryPicker` no está), así que todo vive en localStorage. ITP de WebKit borra todo el almacenamiento escribible por script (localStorage, IndexedDB) de un sitio después de 7 días de uso de Safari sin interacción con ese sitio. Si deja de practicar una semana (vacaciones, cosa común en una app de hábito), vuelve y está todo en cero, sin aviso. El recordatorio «Tu progreso vive solo en este navegador» aparece a los 14 días **activos**, o sea, después de la ventana de riesgo.
- **Evidencia:** leyendo el código (el umbral de 14 días y que en Safari el estado es `unsupported`), más la política documentada de WebKit: *Full Third-Party Cookie Blocking and More*, webkit.org, 2020-03-24, sección «7-Day Cap on All Script-Writeable Storage». Las web apps agregadas al Dock o a la pantalla de inicio quedan exentas.
- **Confianza:** alta en la política. **Hipótesis:** que `navigator.storage.persist()` (Safari 17+) exima del tope de ITP; no lo verifiqué. Se confirma con la doc de WebKit «Updates to Storage Policy» (2023) o probándolo en un Mac.
- **Arreglo sugerido:** con `auto.state === 'unsupported'`, recordar la copia antes (a los 2–3 días activos y después cada semana) y, en Safari, decirlo explícito: «Safari borra los datos si pasás una semana sin entrar: bajá una copia».

## P-03 · bajo · La foto «antes de reiniciar» o «antes de importar» se puede pisar: con un doble clic queda vacía, y un segundo reinicio o importación en el mismo día la reemplaza

- **Dónde:** `src/app/lib/autoBackup.ts:120` (`serializeBackup(deps.getState(), now)` se evalúa cuando el trabajo **corre** en la cola, no cuando se encola), `:193` (`snapshot`), `src/app/routes/Settings.tsx:278-289` y `src/app/components/BackupRestore.tsx:43-52, 91`. El nombre de la foto es uno solo por día: `backupFiles.ts:16-17`.
- **Escenario A (doble clic):** copia automática activa. La persona hace doble clic en «Sí, borrar todo», y el segundo clic llega mientras se está escribiendo la primera foto (una carpeta de OneDrive o un disco lento). Pasa esto: el clic 1 encola la foto 1, el clic 2 encola la foto 2, la foto 1 escribe el estado bueno y el handler 1 corre `resetProgress()`. **Después** corre la foto 2, que serializa el estado ya vacío y sobrescribe `…-antes-de-reiniciar.json`. La red de seguridad del reinicio queda vacía. Con «Sí, reemplazar» (importar) pasa lo mismo: la foto «antes de importar» termina con el estado importado.
- **Escenario B:** reiniciar o importar dos veces el mismo día. La segunda foto pisa la primera, que era la que tenía el progreso real.
- **Pérdida acotada:** lo hecho hoy antes del reinicio, porque los archivos de días anteriores siguen ahí.
- **Evidencia (repro):** `createAutoBackup` con una carpeta en memoria (escritura de 50 ms) y el handler de Settings llamado dos veces. La foto quedó con `sessions: []`. Pasó.
- **Confianza:** alta en el mecanismo. Que el segundo clic caiga dentro de la ventana depende de cuánto tarde el disco.
- **Arreglo sugerido:** deshabilitar el botón mientras corre el `await`, y serializar el estado en el momento de encolar (`snapshot(reason)` captura `deps.getState()` antes del `enqueue`). Si ya existe la foto del día, sumarle un sufijo (`-2`) en vez de sobrescribirla.

## P-04 · bajo · Un `setItem` que falla rompe la acción en curso y nadie se entera; con los datos del sitio bloqueados, un usuario nuevo ve la pantalla de rescate y queda trabado en la Bienvenida

- **Dónde:** `src/app/store/storage.ts:31-34` (`localStorage.setItem` sin try). Zustand corre `set(...); return setItem()`, así que la excepción sale de la acción **después** de cambiar la memoria. Además `src/app/routes/Welcome.tsx:97-101` (`setSettings` y después `navigate('/')`) y `:111-124`.
- **Escenarios:**
  1. **Datos del sitio bloqueados** (Chrome con «No permitir que los sitios guarden datos»: el getter de `localStorage` tira `SecurityError`). Un usuario **nuevo** ve «No pudimos leer tu progreso guardado. No lo borramos.», aunque nunca tuvo progreso. Si toca «Empezar de cero», cada escritura tira, `finish()` nunca llega a `navigate('/')` y queda trabado en «Empezar a practicar» sin ningún mensaje.
  2. **Cuota llena:** `recordSession` tira `QuotaExceededError` antes de `return at`. El código que la llama (resultados, `completeLesson`, `markRoutine`) no corre, y nada se guarda desde ahí.
  3. **Cuota llena justo al migrar:** el `setItem` posterior a la migración tira y el `.catch` de persist llama `blockWrites()`, pero el estado ya se hidrató (`onboarded: true`). La persona entra a Inicio, practica, y **todo se descarta** sin aviso; la copia automática también se frena, porque `isBlocked()` da true. Y como la versión guardada sigue vieja, en cada recarga se repite.
- **Por qué es bajo:** la cuota no es realista. Medí un año pesado (1000 sesiones con todos los campos opcionales, 110 teclas, 600 bigramas, 400 palabras, 365 días y 200 lecciones): **685 mil caracteres**, más ≤ 685 mil de `typelight.v1.antes-de-migrar`, contra unos 5 M de cuota. `JSON.stringify` tarda unos 6 ms. Los datos bloqueados son raros.
- **Evidencia (repro):** (1) con el getter de `localStorage` tirando, `isWriteBlocked()` dio true en un navegador vacío y, después de `unblockWrites()`, `setSettings({ onboarded: true })` tiró. (2) Con `setItem` mockeado para tirar, `recordSession` tiró `QuotaExceededError` y la sesión quedó en memoria. (3) Con un estado v7 y `setItem('typelight.v1')` tirando, quedó `onboarded === true` con `isWriteBlocked() === true`.
- **Confianza:** alta.
- **Arreglo sugerido:** en `guardedStorage.setItem`, envolver en try/catch y publicar un estado «no se pudo guardar», con un aviso en Inicio que ofrezca «Descargar copia». Distinguir «no hay localStorage» de «no se pudo leer» en `onRehydrateStorage`.

## P-05 · bajo · Un estado de una versión futura en localStorage se acepta tal cual y se re-etiqueta como v8

- **Dónde:** `src/app/store/migrate.ts:96` (`return version >= 8 ? persisted : s`). Zustand llama a `migrate` siempre que `version !== options.version`, también cuando la guardada es **mayor**, y después reescribe con `version: 8`.
- **Escenario:** hoy hace falta que un build viejo cargue datos nuevos (un `index.html` cacheado de Pages tras un deploy). Con el arreglo de P-01 (rehidratar con el evento `storage`) pasaría siempre: la pestaña con el bundle viejo leería el v9, lo aceptaría y lo escribiría como v8. Después el build nuevo correría la migración v8→v9 sobre datos que ya son v9, y esa migración suele inicializar campos (`reading: {}`, `bigrams: {}`), o sea que los borraría.
- **Evidencia (repro):** `{ version: 9, state: { …, futureField } }` → sin bloqueo, guardado como `version: 8`, `futureField` conservado y `antes-de-migrar` escrito.
- **Confianza:** alta.
- **Arreglo sugerido:** en `migrate`, `if (version > 8) throw new Error('newer')`. Eso cae en `blockWrites()` y el texto queda en el rescate. Del lado del backup ya se rechaza bien (`backup.ts:92`).

## P-06 · bajo · Importar una copia mete claves ajenas al store: puede pisar acciones y queda persistido para siempre

- **Dónde:** `src/app/store/index.ts:350-352`: `importState` pasa el objeto entero a `useStore.setState`. `src/app/lib/backup.ts:44` sólo exige que **estén** las claves, no que **sean sólo** esas. `partialize` es la identidad (`index.ts:297-309`), así que persist guarda cualquier clave extra.
- **Escenario:** una copia editada a mano o generada por otra herramienta trae `"state": { …, "recordSession": 0 }`. Se importa sin error, y desde ahí terminar cualquier ejercicio tira `recordSession is not a function`. Como el valor queda en `typelight.v1` y el `merge` de la hidratación lo vuelve a poner encima de la acción, **sigue roto después de recargar**, y ni «Reiniciar progreso» lo arregla, porque `initialProgress` no toca esa clave. Variante: `settings.layoutId: "toString"` pasa el chequeo, porque `'toString' in LAYOUTS` es true (`backup.ts:48`).
- **Evidencia (repro):** `parseBackup` dio `ok`, `importState` dejó `typeof recordSession === 'number'`, la clave quedó en localStorage y, al reimportar el módulo, seguía en `number`.
- **Confianza:** alta; sólo pasa con un archivo manipulado.
- **Arreglo sugerido:** `importState(state)` → `useStore.setState(persistedState(state as State))`, que toma sólo `PERSISTED_KEYS`; `partialize: persistedState` en persist; y `Object.hasOwn(LAYOUTS, layoutId)`.

## P-07 · bajo · En la pantalla de rescate, «Empezar de cero» sobrescribe el archivo del día en la carpeta sin hacer antes una foto

- **Dónde:** `src/app/routes/Welcome.tsx:118` (`onClick={unblockWrites}`) y `src/app/lib/autoBackup.ts:115-120`: `write` sólo mira `isBlocked()`, y el nombre es `prefix + dayKey(now)`.
- **Escenario:** falla la carga, por ejemplo por una migración futura con un bug. La persona tenía la copia automática activa y hoy ya había practicado, así que `typelight-progreso-<hoy>.json` tiene el estado bueno más reciente. Toca «Empezar de cero», hace la bienvenida y, 3 s después del primer `setSettings`, la copia automática escribe el estado nuevo, casi vacío, sobre el archivo de hoy. Se pierde lo hecho hoy (ayer sigue). **Hipótesis agravante:** si la falla vino de `migrateState`, restaurar esa misma copia desde «Restaurar desde una copia…» también falla, porque `parseBackup` corre la misma migración, y el mensaje dice «No parece una copia de TypeLight.» (`backup.ts:96-100`). Así, «Empezar de cero» queda como la única salida visible. Se confirma con un test que mockee `migrateState` para que tire y llame a `parseBackup` con una copia válida.
- **Confianza:** alta en la sobrescritura (leyendo); la agravante es hipótesis.
- **Arreglo sugerido:** después de un arranque bloqueado, que la primera escritura de la copia automática copie antes el archivo de hoy a `…-antes-de-reiniciar` (o que use otro nombre ese día). Si `parseBackup` falla al migrar, mostrar un mensaje distinto («la copia es válida pero esta versión no la pudo convertir»).

## P-08 · bajo · Dos orígenes con la misma carpeta se pisan el archivo del día (afecta a Seba, no a los amigos)

- **Dónde:** `src/app/lib/backupFiles.ts:12-17`: el prefijo depende sólo de `import.meta.env.DEV`, así que `localhost:5173` (el build estable de Seba) y `seba-cascardo.github.io` usan los dos `typelight-progreso-`.
- **Escenario:** Seba prueba la versión de Pages, que tiene otro localStorage, y elige la misma carpeta de copias. Cada origen sobrescribe `typelight-progreso-<hoy>.json` con su propio estado y los dos rotan los mismos archivos. Restaurar «la más nueva» puede traer el estado del otro origen. Los datos de cada localStorage siguen intactos; lo que pierde fiabilidad es la carpeta.
- **Confianza:** alta (leyendo).
- **Arreglo sugerido:** meter el origen en el prefijo cuando no es el de producción (`location.hostname !== 'seba-cascardo.github.io'` → `typelight-local-progreso-`), o avisar si la carpeta tiene archivos con `exportedAt` de otro origen.

---

## Mejoras

- **M-01 · `merge` superficial y `settings` (`index.ts:297-309`, por defecto `{...current, ...persisted}`):** un campo nuevo de `Settings` agregado sin migración queda `undefined` para quien ya tenga datos v8. Hasta ahora sólo afectaba a Seba; con amigos usuarios, cada olvido es un bug en producción (por ejemplo, `weeklyGoal` undefined deja `weekDays >= undefined` en false). Hoy pasa con `theme`: un estado nacido en v1 no lo tiene, y el código se defiende con `?? 'auto'`. Propuesta: `merge: (p, c) => ({ ...c, ...p, settings: { ...c.settings, ...p?.settings } })`. El test `store.test.ts:11` cubre sólo las claves de primer nivel.
- **M-02 · Dos constantes de versión:** `BACKUP_VERSION = 8` (`backup.ts:6`) y `version: 8` (`index.ts:299`). En el historial siempre subieron en el mismo commit (65dece3 … 07d0150), pero si algún día se desfasan, `parseBackup` re-migraría copias ya migradas: `toV5` reinicia `streak.best` y `weeklyGoal`, y `toV6` vacía `bigrams` y `words`. Conviene exportar una sola constante desde el store.
- **M-03 · `requestPersistence` sólo al cargar con `onboarded` (`main.tsx:61`):** la primera sesión de un usuario nuevo corre sin pedir persistencia. Llamarla también en `Welcome.finish()`.
- **M-04 · El rescate no tiene salida:** `typelight.v1.rescate` sólo se recupera con las devtools. Un botón «Descargar lo que no se pudo leer» en la pantalla de rescate cuesta poco y cierra el círculo para un amigo.
- **M-05 · `choose()` se traga el error de `idbSet` (`autoBackup.ts:172-176`, `:203-206`):** si IndexedDB falla, la persona elige la carpeta y no pasa nada visible. Se podría usar la carpeta en esta sesión aunque no se recuerde, y avisarlo.

## Revisado sin hallazgos

- **Migraciones v0→v8:** fixture v1 real (la forma de 9f72899) etiquetada v0..v4 → se hidrata, conserva sesiones, lecciones y onboarding, y re-exporta una copia que `parseBackup` acepta. Una copia de la era v3 (la forma de 65dece3) también se importa. Cada `toVn` es aditivo sobre lo que esa versión no tenía. Detalle menor sin impacto práctico: `toV3` rellena `seconds: 0` en los días v1, así que `activeDays` subcuenta la historia anterior a v2, que fue un solo día de Seba.
- **`guardedStorage` + `blockWrites`:** con JSON ilegible o una migración que tira, `typelight.v1` no se pisa y se guarda el rescate; `lastRaw` se fija antes del parse. Estados `null`, string o sin `version` caen en defaults sin perder nada que existiera.
- **`parseBackup`:** JSON malformado, archivo de otra app, versión futura (la rechaza con mensaje claro) y forma inválida, todo rechazado. `__proto__` en el JSON no contamina `Object.prototype`: las migraciones usan spread y `fromEntries`, y como mucho cambia el prototipo del objeto de estado, sin efecto visible.
- **Copia automática:** cola serializada (sin escrituras concurrentes dentro de una pestaña); una rotación que falla no deshace la copia; la rotación borra sólo nombres propios, guarda los 30 días más recientes **con copia** y separa el prefijo de dev; un permiso revocado o una carpeta borrada pausan con el motivo correcto y el banner de Inicio ofrece reconectar; `requestPermission` es el primer `await` del clic; flush al ocultar la pestaña (las últimas ≤ 3 s pueden no llegar a la carpeta al cerrar, pero están en localStorage).
- **Firefox y Safari sin `showDirectoryPicker`:** estado `unsupported` con texto claro y sin tocar IndexedDB. **IndexedDB no disponible:** `init` cae en `off`.
- **Tamaño:** ver P-04 (685 mil caracteres en un año pesado; 1000 sesiones son el 70 %).
- **`resetProgress`:** conserva `settings` y la medición `legacy` sin sus marcas; foto previa en la carpeta (salvo P-03).
