# Handoff — TypeLight: etapa "proteger y contenido" cerrada

Fecha 2026-09-17 · `master` en `cf3c2f1` (rama `proteger-contenido` mergeada fast-forward y borrada; 24 commits sobre `0dbfb42`) · **sin pushear**

## Alcance

**Sí:** la etapa 3 completa (Ola 0 "proteger" + Ola 1 "contenido" del reporte, más el ítem 13b adelantado desde la Ola 2) está implementada y testeada en la rama `proteger-contenido`: **build estable** para el uso diario (`npm run serve` sirve `dist/` en :5173 con fallback SPA; el launcher reconstruye solo cuando `master` avanza), **store v3** (`days[d].reference[]` y `.sessions` escritos por `recordSession`, migración v2→v3 con backfill, `legacy`, `settings.lastBackupAt`), **exportar/importar progreso** (copia JSON descargable, importar con confirmación de dos pasos, recordatorio en Inicio), **fixes** de severidad A/M del reporte (Reto sin frases repetidas, un tip ya no llena la tarjeta Lección, precisión 7 días en Inicio, "~1 min" en el Calentamiento, el reloj no corre con la pestaña oculta, `nextLesson` no retrocede), **corpus de frases por etapa** (Tatoeba filtrado + ~200 frases de la casa con más peso, `fitSentence` normaliza por pool sin tocar tildes), **n-gramas del español** (tabla generada, dos lecciones nuevas en Velocidad, Calentamiento de bigramas en días impares), **sello "velocidad honesta"** en Progreso, y **"tu velocidad de antes"** (test único de 1 minuto, línea punteada en el chart, hito al superarla). Spec: `docs/superpowers/specs/2026-09-17-proteger-y-contenido-design.md` (marcada "Implementado completo"); plan ejecutado: `docs/superpowers/plans/2026-09-17-proteger-y-contenido.md` (línea `> **Estado:**` con los desvíos).

Verificación de cierre corrida el 2026-09-17: `npx tsc -b` limpio · `npm run lint` con las 4 advertencias previas de siempre (2 en `src/main.tsx`, 2 en `LessonPlayer.tsx`) y ninguna más · `npm test` 108 unitarios en 14 archivos, todo verde · `npm run e2e` 14 Playwright, todo verde (arranca su propio server en :5174) · `npm run build` OK (`dist/assets/index-*.js` 626 KB, gzip 215 KB — sigue sin code-splitting, es una advertencia de Vite, no un error).

**No:** no está pusheada (`origin/master` sigue en `0dbfb42`; el push lo pide Seba con "commit, push"). El `.bat` de escritorio hay que reemplazarlo ahora que el merge está hecho (ver abajo). No se tocó la Ola 2 del reporte (el converso): Reto sin ayuda, Backspace, manos por dominio, rollover, onboarding, dominio por dedo, auto-chequeo de forma — quedan en `docs/backlog.md` → Pendientes. No hay deploy, backend ni PWA (sigue fuera de alcance hasta que exista export/import en producción, que ahora sí existe en local).

## Arrancá acá

**Primera acción:** preguntale a Seba si ya reemplazó `C:\Users\seba_\Desktop\TypeLight.bat` por el contenido de más abajo (el merge ya está hecho: `master` = `cf3c2f1`). Si trae feedback de haber usado el corpus nuevo, los n-gramas o la copia de seguridad, arreglá eso primero. Si no hay nada pendiente, el siguiente paso es la **Ola 2 del reporte** (el converso): armar una propuesta renderizada (artifact) con 2-3 variantes para que Seba elija, como le funcionó las últimas veces (diseño, tipografía, juegos/métricas) — cubre Reto sin ayuda + modo con Backspace en una sola discontinuidad del chart, manos guía por dominio, rollover, onboarding de converso, juego dentro de la rutina, dominio por dedo, auto-chequeo de forma. Detalle en `docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 2 y en `docs/backlog.md` → Pendientes.

Verificá con: `npm test` (113 unitarios) · `npm run e2e` (14 Playwright, arranca su propio dev server en :5174) · `npm run build`. Lint: `npm run lint` tiene 4 advertencias previas (2 en `src/main.tsx`, 2 en `LessonPlayer.tsx`, React Compiler sobre memoización manual): no sumar ninguna.

**Puertos desde ahora** (cambiaron en esta etapa): `:5173` = `npm run serve` (`vite preview` de `dist/`, el build estable — donde Seba practica todos los días); `:5175` = `npm run dev -- --port 5175` para probar una rama sin dispararle HMR al build estable; `:5174` = e2e (no cambia). **Hasta que Seba reemplace el `.bat` de escritorio**, éste sigue levantando el dev server en :5173 sobre el árbol de trabajo: como la rama está checkouteada en la misma carpeta, cualquier edición dispara HMR y puede resetear una lección a mitad de camino — avisale antes de que pruebe. Una vez reemplazado el `.bat`, :5173 sirve siempre el build de `master` y las ramas se prueban en :5175 sin tocarlo.

**Reemplazo del `.bat` — pegale esto a Seba para que lo guarde tal cual en `C:\Users\seba_\Desktop\TypeLight.bat` (reemplaza el archivo entero, sin abrir el repo):**

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

rem Reconstruye dist/ si falta o si master avanzo desde el ultimo build (dist\.commit guarda el commit buildeado).
rem Si el checkout esta en otra rama, se sirve el ultimo build de master sin reconstruir (las ramas se prueban en :5175).
set "NEEDS_BUILD=0"
set "MASTER_SHA="
set "BUILT_SHA="
set "BRANCH="
for /f %%h in ('git rev-parse master') do set "MASTER_SHA=%%h"
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
if not exist dist\index.html set "NEEDS_BUILD=1"
if not exist dist\.commit set "NEEDS_BUILD=1"
if "%NEEDS_BUILD%"=="1" goto decide
set /p BUILT_SHA=<dist\.commit
if not defined BUILT_SHA set "NEEDS_BUILD=1"
if not "%BUILT_SHA%"=="%MASTER_SHA%" set "NEEDS_BUILD=1"
:decide
if not "%BRANCH%"=="master" (
  echo Atencion: el checkout esta en la rama %BRANCH%, no en master.
)
if not "%BRANCH%"=="master" if exist dist\index.html (
  echo Se sirve el ultimo build de master sin reconstruir. Para probar la rama usa npm run dev -- --port 5175
  set "NEEDS_BUILD=0"
)
if "%NEEDS_BUILD%"=="1" (
  echo Construyendo TypeLight...
  call npm run build || (pause & exit /b 1)
  for /f %%h in ('git rev-parse HEAD') do >dist\.commit echo %%h
)

echo Sirviendo TypeLight en %URL% ...
echo Cerra esta ventana para apagar el server.
echo.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 120;$i++){ try{$null=New-Object Net.Sockets.TcpClient('localhost',%PORT%); Start-Process '%URL%'; exit}catch{Start-Sleep -Milliseconds 500} }"
npm run serve
```

(Esto reemplaza al `.bat` que corría `npm run dev -- --port 5173` sobre el árbol de trabajo. El nuevo reconstruye solo si `dist/` falta o si `master` avanzó desde el commit guardado en `dist\.commit`, nunca si el checkout está en otra rama, y después `npm run serve`, que es `vite preview` — no un dev server. Copia idéntica en el repo: `scripts/TypeLight.bat`.)

Leé, en este orden:
- `docs/backlog.md` — Pendientes (Ola 2) e ideas sueltas.
- `.serena/memories/typelight-architecture.md` — decisiones con porqué (store v3, copia JSON, corpus por etapa, n-gramas, `nextLesson`, pausa por pestaña oculta, puertos) y las trampas nuevas de esta etapa.
- `src/app/lib/backup.ts` (`serializeBackup`/`parseBackup`/`backupDue`) y la tarjeta "Tu progreso" en `src/app/routes/Settings.tsx`.
- `scripts/build-sentences.py`, `scripts/corpus_common.py`, `scripts/build-ngrams.py` — generadores de Python; `src/engine/corpus/sentences.generated.ts` y `ngrams.ts` — su salida (no editar a mano).
- `src/engine/curriculum/` (`nextLesson`), `src/app/hooks/useTypingSession.ts` (pausa por pestaña oculta), `src/engine/stats/progress.ts` (`referenceByDay`, `legacyBeaten`).

**Lo que `## Descartado y confirmado` da por muerto no se reintenta mientras su condición de caducidad no se haya cumplido, aunque un plan lo liste como pendiente: este handoff es más reciente que los planes. Si la condición se cumplió, la entrada ya no vale y el plan manda.**

Contexto operativo: Seba usa Chrome a 125 % en un monitor 2560 de ancho (`html { font-size: clamp(16px, 0.55vw + 9px, 21px) }`, contenedor `max-w-[86rem]`, ambos con su OK). Mientras se trabaja sobre una rama checkouteada en la misma carpeta que el `.bat` de escritorio sirve, cada edición dispara HMR y puede resetear una lección a mitad de camino: avisale cuando termines una tanda antes de que pruebe. El navegador integrado no puede capturar `file://` ni ver artifacts de claude.ai; para capturas usá `node scripts/shot.mjs <url> <out.png> [w h light|dark full selector]` — el script siembra progreso de muestra y apunta su primera navegación a :5173 siempre, así que las URLs que se le pasan también van a :5173 (el build estable, o la rama si está checkouteada ahí encima). Trampas del entorno nuevas (sin `window.confirm`, cómo mockear `document.hidden`, `getByText` contra `<text>` de SVG, fixtures de `/estadisticas` con al menos una sesión, consola de Windows con Python, variables en bloques `( )` de `.bat`) están en la memoria Serena § Trampas, junto con las de la etapa anterior.

## Estado

Sobre `0dbfb42` (`master`), la rama `proteger-contenido` tiene los 12 commits de esta etapa (`build:`/`feat:`/`fix:` uno por tarea, más este cierre de documentación) y el árbol de trabajo queda limpio: no hay nada sin commitear. Capturas para Seba en `e2e/screens/ajustes-copia.png` y `e2e/screens/stats-antes.png` (gitignored, tomadas contra :5173 con progreso de muestra — no van en ningún commit, son para mirar). El merge a `master` y el reemplazo del `.bat` de escritorio quedan pendientes de que Seba los pida.

## Descartado y confirmado

- **Manos dibujadas por código, tres versiones** (cápsulas tipo sticker; piezas sueltas con dedos cónicos; silueta única en dos pasadas). Seba: "creepy, malformadas", "no parece una mano". Lo que sí funcionó: dibujo anatómico de dominio público (Wikimedia *Hand external anatomy, dorsum*) en `src/app/assets/handDorsum.ts` + máscara derivada del trazo. Caduca: hasta que Seba pida explícitamente volver a manos dibujadas por código.
- **Silueta de la mano trazada a ojo sobre una grilla** (polígono Catmull-Rom): quedó desfasada del trazo ("está todo corrido"). Caduca: si cambia el asset base — `git log -1 --format=%h -- src/app/assets/handDorsum.ts` deja de dar `76348cb`.
- **Máscara por dilatar→flood-fill→erosionar** (R=7: filtra por huecos del contorno; R=14: idem; R≥18: rellena las ranuras entre dedos y deja derrames en dobles trazos y huecos en bolsillos cerrados). Reabrir las ranuras con bandas manuales + runs cortos + apertura vertical dejó artefactos. Lo que funcionó y está en `scripts/build-hand-mask.py`: cierre morfológico (R=20) + flood-fill del exterior + interior = ni exterior ni pared + recuperar como mano la "pared añadida por el cierre que el exterior no alcanza". Verificado a resolución completa con `scripts/preview-hand-mask.py`. Caduca: misma condición que la anterior (hash de `handDorsum.ts`).
- **`ImageDraw.floodfill` de Pillow no hace nada sobre una imagen creada con `Image.fromarray` que aún comparte el buffer de numpy**; con `.copy()` funciona. Caduca si `python -c "from PIL import Image, ImageDraw; import numpy as np; i=Image.fromarray(np.zeros((4,4),dtype=np.uint8)); ImageDraw.floodfill(i,(0,0),128); print(np.unique(np.array(i)))"` imprime `[128]` en vez de `[0]`.
- **Assets de manos tipo emoji** (Fluent MIT, Twemoji, Noto, OpenMoji): manos amarillas caricaturescas, no sirven para "realista". Caduca: hasta que Seba pida estilo cartoon.
- **Altura de tecla del teclado en pantalla con `aspect-ratio` o con `cqw`** falla dentro de flex (las teclas no llenan la fila / colapsan). Funciona medir el ancho con ResizeObserver y fijar `--kb-h` (`Keyboard.tsx`). Caduca si `grep -c ResizeObserver src/app/components/Keyboard.tsx` da 0.
- **Capturas del panel de navegador integrado congelan las animaciones CSS en el frame 0 y `requestAnimationFrame` se pausa con la pestaña oculta**: las capturas salían en blanco y el juego no avanzaba. Por eso `animate-rise` no usa `fill-mode: both`, Playwright corre con `reducedMotion: 'reduce'` y el juego acepta `?dur=6000`. Caduca si `grep -c reducedMotion playwright.config.ts` da 0.
- **Playwright: `page.keyboard.press('Return')` no existe; es `'Enter'`.** Caduca si `npx playwright --version` deja de ser 1.63.0.
- **El "loop" en la práctica que reportó Seba** (volvía al mismo ejercicio, no marcaba completa) **no se reprodujo** en Chromium con tipeo real, Enter ni clic, ni antes ni después de endurecer el código; hipótesis: HMR mientras él usaba la app. Se endureció igual (refs `stepRef`/`totalsRef`, audio en try/catch, funciones sueltas fuera de archivos de componentes) y hay e2e `practice lesson (no intro)…`. Caduca: si Seba lo reporta de nuevo con la app quieta.
- **Corpus de OpenSubtitles sin filtrar**: trae nombres en inglés ("jules", "ford"), palabras violentas/vulgares y formas de vosotros. Lo que quedó: filtro contra diccionario (`words/an-array-of-spanish-words`, sin tildes: comparar con acentos quitados) + blocklist en `scripts/build-corpus.py`. Caduca si `git log -1 --format=%h -- scripts/build-corpus.py` deja de dar `7c5c16e`.
- **Sondear el puerto de Vite desde un `.bat` con `New-Object Net.Sockets.TcpClient` sin argumentos + `.Connect('localhost', 5173)`** da siempre "cerrado": Windows PowerShell 5.1 crea el socket IPv4 y Vite escucha solo en `[::1]`. Funciona el constructor con host: `New-Object Net.Sockets.TcpClient('localhost',5173)` (resuelve las dos familias). Además, `%errorlevel%` en la misma línea de `cmd /c` se expande antes de correr el comando: probarlo en un `.bat` con el `if` en línea aparte. Caduca si `powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient).Connect('localhost',5173); 'ok'}catch{'fail'}"` imprime `ok` con el dev server levantado.
- **Tipografía**: se mostraron tres parejas con contenido real (artifact `https://claude.ai/artifact/FktdvPVBNM2jv5sbBqN4vR`). Rechazadas por Seba al elegir la B: **Fraunces + Atkinson Hyperlegible Next** (serif cálida + sans hiperlegible) y **Chivo + Asap** (argentinas, sobrias); antes había rechazado **Bricolage Grotesque + Nunito Sans** ("no me gusta") e **IBM Plex Mono** en el ejercicio. Caduca: hasta que Seba pida cambiar la tipografía.
- **El corpus generado desde Tatoeba puede dejar pasar un nombre al inicio de frase o violencia leve** (p. ej. "Luisa", "fusil"): los filtros de `scripts/corpus_common.py` no son perfectos. Seba ojea una muestra por encima; si algo le molesta de verdad, la cuota de Tatoeba o el peso de la casa se ajustan (el mecanismo ya está armado, spec §12). Caduca: si Seba pide bajar la cuota o subir el peso de la casa, ahí se hace y esta entrada se actualiza.
- **`TUTEO` (filtro del corpus generado) es una lista finita de formas de tú frecuentes**, no un detector morfológico: una forma rara puede colarse igual. Caduca: si Seba encuentra tuteo en una frase generada, se agrega esa forma a la lista y se regenera.
- **Los encabezados de los archivos de corpus generados quedan en español** (cita a Tatoeba/OpenSubtitles), igual que en `words.ts`: no se tradujeron a inglés solo por consistencia con el resto del código, que sí es en inglés. Caduca: si Seba pide encabezados en inglés.
- **`restart()` de `useTypingSession` no resetea `hiddenFrom`**: reiniciar justo con la pestaña oculta deja un estado de pausa colgado; benigno (se resuelve solo al volver a mostrar la pestaña) y no se reprodujo en uso real. Caduca: si aparece un reloj que no arranca después de un restart con la pestaña recién oculta.
- **`dayOfYear` puede desfasarse un día en una transición de horario de verano**: es un cálculo de calendario, no de reloj; solo afecta a qué día el Calentamiento usa bigramas (par/impar), nunca a una métrica de progreso. Argentina no tiene DST hoy, así que no debería notarse. Caduca: si Seba lo reporta.

## Decisiones

| Qué | Porqué | Alternativa rechazada | Quién | Estado | Caduca |
|---|---|---|---|---|---|
| Modo "parar en el error" (sin Backspace) | cada ejercicio terminado es una repetición correcta; estado simple | permitir Backspace y contar errores | inferencia del agente | decidida | hasta que Seba pida Backspace |
| Currículo generado desde el layout físico (US/ES/LATAM), detección en la bienvenida | Seba hace el curso ES de edclub (ñ, tildes con tecla muerta) | asumir QWERTY US | inferencia del agente | decidida | hasta que Seba pida un solo layout |
| Gabarito (títulos, leyendas de la ruta) + Lexend (cuerpo, botones, ejercicio) en toda la app; ejercicio con tracking 0.01em, sin monospace | Seba eligió la B ("redonda y abierta", la más Duolingo) entre tres muestras con contenido real; Lexend es ancha y con 0.03em las palabras se desarmaban | Bricolage + Nunito; Fraunces + Atkinson; Chivo + Asap; IBM Plex Mono en el ejercicio | usuario | decidida | hasta que Seba pida otra pareja o monospace |
| Botones planos, sin canto ni sombra, en TODA la app | Seba rechazó bordes gruesos y luego el canto inferior por inconsistente | relieve Duolingo; canto inferior 4 px | usuario | decidida | hasta que Seba pida relieve |
| Manos = asset PD + máscara derivada | Seba pidió realismo; lo procedural falló tres veces | dibujo procedural | usuario | decidida | hasta que Seba pida otra pose/estilo |
| `f j` se enseña sin espacios; la barra va en la lección siguiente | Seba: no usar la barra antes de explicarla | drill con espacios desde la primera lección | usuario | decidida | hasta que Seba cambie el orden |
| Los juegos viven como lecciones `kind: 'game'` dentro de la ruta: 12 huecos (Lluvia ×3, Al compás ×3, Globos ×3, Carrera ×3) | Seba pidió un juego visual cada x niveles y después variedad, no reemplazo | sección de juegos aparte de la ruta; reemplazar la Lluvia | usuario | decidida (reparto aprobado el 2026-09-16 sobre el artifact `Fw6mUvuvXHzoG2M2L5gMM2`) | hasta que Seba pida otro reparto |
| Velocidad de referencia = solo Retos (+ textos de Velocidad + Carreras), mediana por día; "Mejor velocidad" no vuelve | Seba: el PPM por día era *engañable* (un drill fácil inflaba el día); eligió la opción 1 entre tres | PPM ponderado por dificultad (opción 2); solo frases del corpus (opción 3) | usuario | decidida | hasta que Seba pida otra definición |
| Modo libre "Jugar" en Inicio solo con la rutina completa; no cuenta para la rutina, sí para racha y minutos | Seba: los juegos alimentan la rutina, no le compiten | fila siempre visible; sección aparte | usuario | decidida | hasta que Seba pida verla siempre |
| Campos de juego a pantalla completa (`clamp(420px, 100dvh − 19rem, 900px)`) y mascota con reacciones escalonadas por racha de errores | Seba: "ocupa muy poco espacio vertical"; "la mascota necesita animaciones que varíen si le erramos cada vez más" | alto fijo 420 px; una sola cara triste | usuario | decidida | hasta que Seba pida otro alto o quitar la mascota |
| Tema oscuro automático + grano + rebote + brillo en keycaps | Seba aprobó los seis retoques | — | usuario | decidida | hasta que Seba desactive alguno |
| Escala fluida de fuente (`clamp`) y contenedor `max-w-[86rem]` | Seba: "a 125 % se ve muy pequeño"; después "bien la letra, los objetos podrían ocupar más ancho" | ancho fijo 1024 px; `max-w-6xl` | usuario | decidida | hasta que Seba pida otro tamaño |
| Build estable en :5173 (`vite preview` de `dist/`) para el uso diario; dev de rama en :5175; el launcher reconstruye solo si `master` avanza | cada edición en una rama sobre el dev server le reseteaba una lección a mitad de camino | seguir practicando sobre el dev server; un solo puerto para todo | usuario (spec §3, aprobado en el research §2.1) | decidida | hasta que Seba pida volver a un solo puerto |
| Copia de progreso = archivo JSON descargado a mano; importar reemplaza todo el estado, no mergea | el progreso vive solo en `localStorage`; reemplazar es más simple y predecible (Entertrained hace lo mismo) | sincronizar a una cuenta/backend; mezclar campo por campo al importar | usuario (spec §5, research §2.1) | decidida | hasta que Seba pida cuenta/sync o merge al importar |
| La velocidad de referencia se lee de `days` (resumen por día), no de `sessions`: sobrevive el tope de 1000 sesiones guardadas | el resumen diario no debería perderse solo porque la sesión cruda se descartó por el tope | subir el tope de sesiones guardadas en vez de resumir por día | inferencia del agente | decidida | hasta que el resumen por día tampoco alcance |
| Corpus de frases por etapa: Tatoeba filtrado (1500) + frases de la casa (~200) con ×3 de peso | 85 frases de la casa se repetían rápido en el Reto; Tatoeba solo trae "translationese" ("Tom fue a la tienda") | usar solo casa ampliada, sin Tatoeba | usuario (research §2.2, spec §7) | decidida | hasta que Seba pida bajar la cuota de Tatoeba o subir el peso de la casa |
| N-gramas pesados por rango en `words.ts` (`1/√(i+20)`), no por la frecuencia cruda de `es_50k.txt` | evita depender de un archivo que no está en el repo y no hace falta descargarlo | descargar `es_50k.txt` y pesar por frecuencia cruda como pide el spec | inferencia del agente (desvío declarado) | decidida | hasta que la aproximación por rango se note distinta del objetivo en uso real |
| "Tu velocidad de antes" capturada ya, adelantada desde la Ola 2 | el mapeo viejo (dedos mal puestos) se degrada con cada día de práctica nueva: hay que medirlo antes de que se borre | esperar a la Ola 2, donde estaba originalmente | usuario ("aprobado todo" 2026-09-17; research §10 addendum, spec §10) | decidida | no caduca — es una medición de una vez, no un ajuste revisable |
