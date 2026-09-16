# Handoff — TypeLight: segunda etapa (juegos y métricas)

Fecha 2026-09-16 · rama `master` · preparado sobre `4a91e35`

## Alcance

**Sí:** la app (motor + UI + juego + tema + manos + tipografía) está implementada, testeada y commiteada en `C:\Projects\TypeLight`. Seba: "la app ya cumple su objetivo central y el apartado visual es correcto". Esta ventana cerró la tipografía (Gabarito + Lexend), el ancho para monitores grandes (`max-w-[86rem]`) y dejó un `TypeLight.bat` en su escritorio (`C:\Users\seba_\Desktop\TypeLight.bat`: si el 5173 responde solo abre el navegador; si no, `npm run dev` y abre cuando el puerto contesta).
**No:** no se empezó nada de la etapa siguiente (juegos nuevos, métricas). No hay deploy ni backend, no se optimizó bundle (480 KB de JS), no hay PWA. El árbol quedó limpio sobre `4a91e35`.

## Arrancá acá

**Primera acción:** abrir la etapa que Seba definió, en este orden y **proponiendo antes de codear** (con él funcionó dos veces mostrar 2-3 opciones concretas y que elija):

1. **Juegos/ejercicios nuevos.** Sus palabras: "Hay uno solo y se vuelve monótono, hace falta variedad, lograr que enganche y que no sea algo tan repetitivo/iterativo." Proponele 2-3 mecánicas concretas: qué entrena cada una (teclas nuevas, palabras completas, ritmo, texto real), dónde entra en la ruta (hoy `game(b, u, slug, title)` en `src/engine/curriculum/build.ts` inserta lecciones `kind: 'game'`, 11 en la ruta) y cómo se puntúa (estrellas). Si es visual, mostráselo renderizado (artifact o captura).
2. **Métricas de Progreso** (`src/app/routes/Stats.tsx`, ruta `/estadisticas`; motor en `src/engine/stats/index.ts`). Sus palabras: "dicen poco o mal/poco claro. El chart *Por día*: me gusta ver PPM, pero es engañoso porque si hago un ejercicio solo fácil ya me marca que fui rapidísimo, o sea es *engañable*; las métricas deben mostrar mejor cómo voy avanzando. Luego decidiremos cómo, hay que tomar ideas de Duolingo o apps así." Proponé métricas no engañables (p. ej. PPM solo sobre texto real / ponderado por dificultad o tamaño del pool, precisión y consistencia por lección, teclas flojas, tendencia) con un boceto de pantalla, y esperá su elección.

Verificá con: `npm test` (34 unitarios) · `npm run e2e` (5 Playwright; arranca su propio dev server en :5174) · `npm run build`.
Dev server: `npm run dev` (:5173). Capturas con progreso sembrado: `node scripts/shot.mjs <url> <out.png> [w h light|dark full selector]`.

Leé, en este orden:
- `docs/backlog.md` — la etapa nueva con las palabras de Seba, más ideas sueltas.
- `.serena/memories/typelight-architecture.md` — decisiones con porqué (incluida la restricción de métricas: nada "engañable", ponderar dificultad o medir solo texto real, mostrar tendencia), trampas del entorno, y lo que Seba rechazó (no volver a proponerlo).
- `src/app/components/RainGame.tsx` — el único juego: física por tiempo con rAF, carriles, agua, partículas, mascota; acepta `?dur=6000` para tests.
- `src/engine/curriculum/build.ts` — cómo se arma la ruta y dónde se insertan los juegos; `src/engine/curriculum/types.ts` para los `kind` de lección.
- `src/engine/stats/index.ts` — qué se calcula hoy (PPM, precisión, sesiones, racha); `src/app/store/index.ts` guarda `sessions` (`{at, kind, wpm, acc, chars, errors, seconds}`) y `lessons` por ID.
- `src/app/routes/Home.tsx` — la rutina diaria de 4 tarjetas (Calentamiento / Lección / Repaso / Reto), el corazón de la app: los juegos nuevos y las métricas tienen que alimentarla, no competirle.

**Lo que `## Descartado y confirmado` da por muerto no se reintenta mientras su condición de caducidad no se haya cumplido, aunque el plan lo liste como pendiente: este handoff es más reciente que el plan. Si la condición se cumplió, la entrada ya no vale y el plan manda.**

Contexto operativo: Seba usa Chrome a 125 % en un monitor 2560 de ancho; `html { font-size: clamp(16px, 0.55vw + 9px, 21px) }` y contenedor `max-w-[86rem]`, ambos con su OK ("bien la letra"). Mientras usa la app, cada edición tuya dispara HMR y puede resetear una lección a mitad de camino: avisale cuando termines una tanda antes de que pruebe. Otra sesión de Claude puede tener el dev server en :5173 (el hook lo avisa): las capturas con `scripts/shot.mjs` sirven igual porque apuntan a ese puerto; el navegador integrado no puede capturar archivos `file://` ni ver artifacts de claude.ai (no tiene sesión).

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

## Decisiones

| Qué | Porqué | Alternativa rechazada | Quién | Estado | Caduca |
|---|---|---|---|---|---|
| Modo "parar en el error" (sin Backspace) | cada ejercicio terminado es una repetición correcta; estado simple | permitir Backspace y contar errores | inferencia del agente | decidida | hasta que Seba pida Backspace |
| Currículo generado desde el layout físico (US/ES/LATAM), detección en la bienvenida | Seba hace el curso ES de edclub (ñ, tildes con tecla muerta) | asumir QWERTY US | inferencia del agente | decidida | hasta que Seba pida un solo layout |
| Gabarito (títulos, leyendas de la ruta) + Lexend (cuerpo, botones, ejercicio) en toda la app; ejercicio con tracking 0.01em, sin monospace | Seba eligió la B ("redonda y abierta", la más Duolingo) entre tres muestras con contenido real; Lexend es ancha y con 0.03em las palabras se desarmaban | Bricolage + Nunito; Fraunces + Atkinson; Chivo + Asap; IBM Plex Mono en el ejercicio | usuario | decidida | hasta que Seba pida otra pareja o monospace |
| Botones planos, sin canto ni sombra, en TODA la app | Seba rechazó bordes gruesos y luego el canto inferior por inconsistente | relieve Duolingo; canto inferior 4 px | usuario | decidida | hasta que Seba pida relieve |
| Manos = asset PD + máscara derivada | Seba pidió realismo; lo procedural falló tres veces | dibujo procedural | usuario | decidida | hasta que Seba pida otra pose/estilo |
| `f j` se enseña sin espacios; la barra va en la lección siguiente | Seba: no usar la barra antes de explicarla | drill con espacios desde la primera lección | usuario | decidida | hasta que Seba cambie el orden |
| Los juegos viven como lecciones `kind: 'game'` dentro de la ruta (hoy solo "Lluvia de teclas", 11 veces) | Seba pidió un juego visual cada x niveles | sección de juegos aparte de la ruta | usuario | decidida; **Seba pidió variedad, no reemplazo**: la Lluvia queda y se suman otros | hasta que Seba pida sacar los juegos de la ruta |
| Tema oscuro automático + grano + rebote + brillo en keycaps | Seba aprobó los seis retoques | — | usuario | decidida | hasta que Seba desactive alguno |
| Escala fluida de fuente (`clamp`) y contenedor `max-w-[86rem]` | Seba: "a 125 % se ve muy pequeño"; después "bien la letra, los objetos podrían ocupar más ancho" | ancho fijo 1024 px; `max-w-6xl` | usuario | decidida | hasta que Seba pida otro tamaño |
