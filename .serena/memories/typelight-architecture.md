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
- **Teclado en pantalla** (`Keyboard.tsx`): mide su ancho con ResizeObserver y fija la altura de tecla = 1 unidad de ancho (tope 48 px), para que se vea proporcional en cualquier ancho. Intenté `aspect-ratio` y `cqw` y ambos fallaron dentro de flex.

## Trampas
- En este entorno Bash, los heredocs con backticks en el contenido rompen el parser del tool: para archivos con template strings usar el Write tool o un script Python.
- Playwright: el key name es `Enter`, no `Return`.
- `tsconfig.app.json` usa `paths` sin `baseUrl` (TS 6 deprecó `baseUrl`).
