# Handoff — TypeLight: app de mecanografía, primer día

Fecha 2026-09-16 · rama `master` · preparado sobre el commit `feat: Gabarito + Lexend; wider container for big screens` (hijo de `ad8602d`)

## Alcance

**Sí:** la app completa (motor + UI + juego + tema + manos) está implementada, testeada y commiteada en `C:\Projects\TypeLight`. Esta ventana cerró las iteraciones visuales con Seba (botones, manos, escala) y dejó un backlog.
**No:** no hay deploy ni backend, no se optimizó bundle, no hay PWA.

## Arrancá acá

**Tipografía resuelta (2026-09-16):** Seba eligió **Gabarito (títulos) + Lexend (cuerpo y ejercicio)** entre tres parejas mostradas con contenido real (artifact `https://claude.ai/artifact/FktdvPVBNM2jv5sbBqN4vR`; el de opciones de diseño sigue en `https://claude.ai/artifact/9cMngx7ziSqwUc85ThXgPh`). Rechazadas: Fraunces + Atkinson Hyperlegible Next, Chivo + Asap. El ejercicio bajó a tracking 0.01em porque Lexend es ancha. También confirmó la escala fluida de letra ("bien la letra") y pidió más ancho: contenedor `max-w-[86rem]`.

**Primera acción:** no hay pendiente de diseño. `docs/backlog.md` solo tiene ideas sueltas sin compromiso; preguntale a Seba qué sigue (probablemente probar la app en uso real y reportar). Hay un `TypeLight.bat` en su escritorio que levanta el dev server y abre el navegador.

Verificá con: `npm test` (34 unitarios) · `npm run e2e` (5 Playwright; arranca su propio dev server en :5174) · `npm run build`.
Dev server: `npm run dev` (:5173). Capturas contra el dev server con progreso sembrado: `node scripts/shot.mjs <url> <out.png> [w h light|dark full selector]` (ver README).

Leé, en este orden:
- `docs/backlog.md` — ideas sueltas (sin compromiso).
- `.serena/memories/typelight-architecture.md` — decisiones con porqué, trampas del entorno, y lo que Seba rechazó (no volver a proponerlo).
- `src/index.css` — tokens (`@theme`), fuentes actuales (`--font-display`, `--font-body`), tema oscuro, estilos `.keycap`/`.kb-key`/`.type-char`.
- `index.html` — el `<link>` de Google Fonts (Gabarito + Lexend).
- `src/app/components/TypingArea.tsx` — cómo se renderiza el texto a tipear (una `<span class="type-char">` por carácter, `min-width: 0.55em`, tracking 0.01em).

**Lo que `## Descartado y confirmado` da por muerto no se reintenta mientras su condición de caducidad no se haya cumplido, aunque el plan lo liste como pendiente: este handoff es más reciente que el plan. Si la condición se cumplió, la entrada ya no vale y el plan manda.**

Contexto operativo: Seba usa Chrome a 125 % en un monitor grande; `font-size: clamp(16px, 0.55vw + 9px, 21px)` en `html` y contenedor `max-w-[86rem]`, ambos con su OK. Mientras Seba usa la app, cada edición tuya dispara HMR y puede resetear una lección a mitad de camino: avisale cuando termines una tanda antes de que pruebe.

## Descartado y confirmado

- **Manos dibujadas por código, tres versiones** (cápsulas tipo sticker; piezas sueltas con dedos cónicos; silueta única en dos pasadas). Seba: "creepy, malformadas", "no parece una mano". Lo que sí funcionó: dibujo anatómico de dominio público (Wikimedia *Hand external anatomy, dorsum*) en `src/app/assets/handDorsum.ts` + máscara derivada del trazo. Caduca: hasta que Seba pida explícitamente volver a manos dibujadas por código.
- **Silueta de la mano trazada a ojo sobre una grilla** (polígono Catmull-Rom): quedó desfasada del trazo ("está todo corrido"). Caduca: si cambia el asset base — `git log -1 --format=%h -- src/app/assets/handDorsum.ts` deja de dar `76348cb`.
- **Máscara por dilatar→flood-fill→erosionar** (R=7: filtra por huecos del contorno; R=14: idem; R≥18: rellena las ranuras entre dedos y deja derrames en dobles trazos y huecos en bolsillos cerrados). Reabrir las ranuras con bandas manuales + runs cortos + apertura vertical dejó artefactos. Lo que funcionó y está en `scripts/build-hand-mask.py`: cierre morfológico (R=20) + flood-fill del exterior + interior = ni exterior ni pared + recuperar como mano la "pared añadida por el cierre que el exterior no alcanza". Verificado a resolución completa con `scripts/preview-hand-mask.py`. Caduca: misma condición que la anterior (hash de `handDorsum.ts`).
- **`ImageDraw.floodfill` de Pillow no hace nada sobre una imagen creada con `Image.fromarray` que aún comparte el buffer de numpy**; con `.copy()` funciona. Caduca si `python -c "from PIL import Image, ImageDraw; import numpy as np; i=Image.fromarray(np.zeros((4,4),dtype=np.uint8)); ImageDraw.floodfill(i,(0,0),128); print(np.unique(np.array(i)))"` imprime `[128]` en vez de `[0]`.
- **Assets de manos tipo emoji** (Fluent MIT, Twemoji, Noto, OpenMoji): manos amarillas caricaturescas, no sirven para "realista". Caduca: hasta que Seba pida estilo cartoon.
- **Heredocs en el tool Bash con backticks (o ciertos `'`) adentro rompen el parser del tool** ("unexpected EOF while looking for matching"), aunque el heredoc esté entre comillas. Salida: escribir el archivo con el tool Write o un script Python. Caduca si `bash -c "cat <<'EOF'
\`x\`
EOF"` corre sin error desde el tool Bash.
- **Altura de tecla del teclado en pantalla con `aspect-ratio` o con `cqw`** falla dentro de flex (las teclas no llenan la fila / colapsan). Funciona medir el ancho con ResizeObserver y fijar `--kb-h` (`Keyboard.tsx`). Caduca si `grep -c ResizeObserver src/app/components/Keyboard.tsx` da 0.
- **Capturas del panel de navegador integrado congelan las animaciones CSS en el frame 0 y `requestAnimationFrame` se pausa con la pestaña oculta**: las capturas salían en blanco y el juego no avanzaba. Por eso `animate-rise` no usa `fill-mode: both`, Playwright corre con `reducedMotion: 'reduce'` y el juego acepta `?dur=6000`. Caduca si `grep -c reducedMotion playwright.config.ts` da 0.
- **Playwright: `page.keyboard.press('Return')` no existe; es `'Enter'`.** Caduca si `npx playwright --version` deja de ser 1.63.0.
- **El "loop" en la práctica que reportó Seba** (volvía al mismo ejercicio, no marcaba completa) **no se reprodujo** en Chromium con tipeo real, Enter ni clic, ni antes ni después de endurecer el código; hipótesis: HMR mientras él usaba la app. Se endureció igual (refs `stepRef`/`totalsRef`, audio en try/catch, funciones sueltas fuera de archivos de componentes) y hay e2e `practice lesson (no intro)…`. Caduca: si Seba lo reporta de nuevo con la app quieta.
- **Corpus de OpenSubtitles sin filtrar**: trae nombres en inglés ("jules", "ford"), palabras violentas/vulgares y formas de vosotros. Lo que quedó: filtro contra diccionario (`words/an-array-of-spanish-words`, sin tildes: comparar con acentos quitados) + blocklist en `scripts/build-corpus.py`. Caduca si `git log -1 --format=%h -- scripts/build-corpus.py` deja de dar `7c5c16e`.

## Decisiones

| Qué | Porqué | Alternativa rechazada | Quién | Estado | Caduca |
|---|---|---|---|---|---|
| Modo "parar en el error" (sin Backspace) | cada ejercicio terminado es una repetición correcta; estado simple | permitir Backspace y contar errores | inferencia del agente | decidida | hasta que Seba pida Backspace |
| Currículo generado desde el layout físico (US/ES/LATAM), detección en la bienvenida | Seba hace el curso ES de edclub (ñ, tildes con tecla muerta) | asumir QWERTY US | inferencia del agente | decidida | hasta que Seba pida un solo layout |
| Texto a tipear en Nunito Sans (sin monospace) | Seba: "no me gusta, unificar con el resto" | IBM Plex Mono | usuario | decidida | hasta que Seba pida monospace |
| Botones planos, sin canto ni sombra, en TODA la app | Seba rechazó bordes gruesos y luego el canto inferior por inconsistente | relieve Duolingo; canto inferior 4 px | usuario | decidida | hasta que Seba pida relieve |
| Manos = asset PD + máscara derivada | Seba pidió realismo; lo procedural falló tres veces | dibujo procedural | usuario | decidida | hasta que Seba pida otra pose/estilo |
| `f j` se enseña sin espacios; la barra va en la lección siguiente | Seba: no usar la barra antes de explicarla | drill con espacios desde la primera lección | usuario | decidida | hasta que Seba cambie el orden |
| Juego "Lluvia de teclas" cada pocas lecciones (11 en la ruta) | Seba pidió un juego visual cada x niveles | ninguno; otro tipo de juego | usuario | decidida | hasta que Seba pida otro juego |
| Tema oscuro automático + grano + rebote + brillo en keycaps | Seba aprobó los seis retoques | — | usuario | decidida | hasta que Seba desactive alguno |
| Escala fluida de fuente (`clamp`) y contenedor `max-w-[86rem]` | Seba: "a 125 % se ve muy pequeño"; después "bien la letra, los objetos podrían ocupar más ancho" | ancho fijo 1024 px; `max-w-6xl` | usuario | decidida | hasta que Seba pida otro tamaño |
| Gabarito + Lexend en toda la app | Seba eligió la B ("redonda y abierta") entre tres muestras con contenido real | Bricolage + Nunito; Fraunces + Atkinson; Chivo + Asap | usuario | decidida | hasta que Seba pida otra pareja |
