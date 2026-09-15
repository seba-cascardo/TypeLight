# TypeLight — conocimiento durable del proyecto

## Qué es
App web local (Vite + React 19 + TS + Tailwind v4 + zustand persist) para aprender mecanografía en español. Sin backend. `npm run dev` en :5173. Tests: `npm test` (Vitest, motor) y `npm run e2e` (Playwright, arranca su propio dev server en :5174).

## Decisiones con su porqué
- **Motor puro en `src/engine/`, sin React**: todo lo testeable (layouts, generadores, sesión de tipeo, stats, currículo) vive ahí. La UI solo renderiza. Mantener esa frontera.
- **Modo "parar en el error"** (`engine/typing`): una tecla equivocada cuenta como error y el cursor no avanza. No hay Backspace. Elegido porque cada ejercicio terminado es una repetición 100 % correcta (memoria muscular) y simplifica el estado.
- **Consciente del layout**: `engine/layouts/data.ts` define US, ES (España, ISO) y LATAM con `KeyboardEvent.code`, shift, AltGr y teclas muertas (´ ¨ ` ^). `resolveChar` devuelve la secuencia física de teclas (á = tecla muerta + a). El currículo se genera desde el layout (`curriculumFor(layout)`), por eso la unidad "Tildes" solo existe en teclados en español y la tecla al lado de la L es `;` o `ñ` según el caso.
- **IDs de lección estables**: `${unitId}-${codepoints}-${keys|review|practice}`; el progreso se guarda por ID, así que cambiar de layout conserva lo que coincide.
- **Captura de teclado por `<input>` oculto** (`TypingArea`): se escucha `input`/`compositionend`, no `keydown`, para que las teclas muertas y los IME compongan como en cualquier campo de texto. `keydown` solo para Escape (reiniciar) y bloquear Enter/Backspace.
- **Corpus**: `engine/corpus/words.ts` es generado por `scripts/build-corpus.py` (OpenSubtitles es_50k filtrado contra un diccionario + blocklist de vulgaridades, violencia, nombres en inglés y formas de vosotros). No editar a mano. Las frases (`sentences.ts`) sí son a mano, rioplatenses.
- **Generadores con RNG con semilla** (`makeRng(seed)`) para tests deterministas; en producción se usa semilla aleatoria por intento.
- **Diseño "keycaps retro"**: tokens en `src/index.css` (`@theme`). Todo botón es `.keycap` con borde inferior grueso; sin sombras. Fuentes: Bricolage Grotesque (display), Nunito Sans (cuerpo y texto a tipear; Seba pidió explícitamente NO usar monospace en los ejercicios). Las animaciones no usan `fill-mode: both` a propósito (las capturas de pantalla las congelaban en frame 0).
- **Manos** (`Hands.tsx`): ASSET REAL, no dibujo procedural. Base: dibujo anatómico a tinta del dorso de una mano derecha, dominio público (Wikimedia "Hand external anatomy, dorsum.svg"), guardado como path en `src/app/assets/handDorsum.ts` (257×349). Debajo va una silueta trazada a mano (polígono suavizado Catmull-Rom en `OUTLINE`) rellena de piel; el dedo activo recibe un tinte (línea gruesa con round caps, multiply) recortado a la silueta + un marcador en la yema. Mano izquierda = espejo. Seba rechazó TRES versiones procedurales ("creepy, malformadas"): no volver a dibujar manos a mano; si hace falta otra pose, buscar otro asset libre. Van debajo del teclado a ancho completo.
- **Botones**: PLANOS. Relleno sólido, sin bordes ni canto inferior ni sombra (Seba rechazó primero los bordes gruesos Duolingo y después el canto inferior por inconsistente). `keycap-ghost` = contorno fino. El relieve 3D queda solo en las teclas del teclado en pantalla (`.kb-key`).
- **Tema**: `settings.theme` = auto | light | dark. Tokens oscuros ("Noche de teclado") en `index.css` bajo `prefers-color-scheme` y `[data-theme]`; `ThemeSync` en `main.tsx` estampa `data-theme`. De noche las teclas son grafito con la leyenda del color del dedo (`.kb-key.has-finger` + `--finger`).
- **Retoques aprobados por Seba**: grano de papel (`body::before` con feTurbulence), brillo en keycaps, rebote al tipear (`@keyframes keypress`), manos grandes, tema automático, juego con carriles/agua/partículas/mascota.
- **Juego "Lluvia de teclas"** (`RainGame.tsx`): lecciones kind `game` insertadas en el currículo (`game(b,u,slug,title)`), ~11 en la ruta. Física por tiempo con rAF; en pestañas ocultas rAF se pausa (los tests usan `?dur=6000`).
- **Orden fila guía**: `Teclas f y j` se enseña SIN espacios (drill `joined`), después `La barra espaciadora` (mete ' ' en el pool), y recién ahí repaso/práctica. Los generadores/práctica miran `pool.includes(' ')`.
- **Teclado en pantalla** (`Keyboard.tsx`): mide su ancho con ResizeObserver y fija la altura de tecla = 1 unidad de ancho (tope 48 px), para que se vea proporcional en cualquier ancho. Intenté `aspect-ratio` y `cqw` y ambos fallaron dentro de flex.

## Trampas
- En este entorno Bash, los heredocs con backticks en el contenido rompen el parser del tool: para archivos con template strings usar el Write tool o un script Python.
- Playwright: el key name es `Enter`, no `Return`.
- `tsconfig.app.json` usa `paths` sin `baseUrl` (TS 6 deprecó `baseUrl`).
