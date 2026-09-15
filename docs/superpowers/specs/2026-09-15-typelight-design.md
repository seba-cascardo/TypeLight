# TypeLight — spec de diseño

Fecha: 2026-09-15. Autor: Claude (Opus 5), a pedido de Seba, sin gates de aprobación (instrucción explícita: "avanzá sin preguntarme").

## 1. Qué es

App web local, single-user, para aprender mecanografía al tacto **en español**, con la progresividad de TypingClub (posición de dedos enseñada tecla por tecla) y la adaptatividad de keybr (drills sobre las teclas más débiles). Con niveles, explicaciones visuales, ejercicios y una rutina diaria.

Usuario: Seba, hispanohablante rioplatense, hace el curso en español de edclub (program-54 → "El mundo de la mecanografía", teclado español).

## 2. Investigación (resumen)

Fuentes: TypingClub (curso EN e ES, tabla de contenidos completa), keybr (algoritmo adaptativo), typingfirst (método "científico": n-gramas, precisión antes que velocidad), lista de frecuencia `hermitdave/FrequencyWords` es_50k (OpenSubtitles 2018).

Técnicas que la app implementa:
1. **Fila guía primero, expansión por fuerza de dedo**: f j → espacio → d k → s l → a ñ/; → g h → fila superior (r u, e i, w o, q y, t p) → inferior (v m, c ,, x ., z -//, b n) → mayúsculas → acentos (layouts ES) → números (4 7, 3 8, 2 9, 1 0, 5 6) → signos → velocidad.
2. **Cada tecla nueva = 3 pasos**: Introducción visual (teclado + manos + texto) → Repaso (mezcla con lo aprendido) → Práctica (palabras reales).
3. **Precisión antes que velocidad**: estrellas dependen de precisión (≥95 %, ≥97 %) y recién después de PPM.
4. **Adaptativo por tecla** (keybr): EMA de latencia y errores por tecla; el "Repaso" genera texto sesgado hacia las 3 teclas más débiles.
5. **Palabras reales cuando se puede, pseudo-palabras cuando no**: se filtra la lista de frecuencia por las teclas ya aprendidas; si hay pocas, se generan sílabas pronunciables (CV/CVC).
6. **Sesiones cortas y diarias** (10–15 min): rutina de 4 bloques con racha.
7. **No mirar el teclado**: teclado en pantalla con la próxima tecla y el dedo resaltados; manos guía.
8. **Consciente del layout**: US QWERTY, Español (España) ISO, Español (Latinoamérica). Las teclas muertas (´ ¨) se enseñan como secuencia de dos pasos.

## 3. Stack

- Vite 6 + React 19 + TypeScript (strict).
- Tailwind CSS v4 (config CSS-first, tokens propios; nada de UI kit).
- Zustand + persist (localStorage) para progreso/ajustes.
- react-router v7 (modo librería).
- motion (framer) para micro-interacciones, respetando `prefers-reduced-motion`.
- Vitest + Testing Library para el motor. Playwright para un smoke e2e.
- Sin backend. `npm run dev` y listo. Build estático desplegable en cualquier host.

Por qué no otra cosa: no hay necesidad de auth ni sync; un backend solo agregaría fricción. Electron/Tauri tampoco: el navegador captura teclado perfectamente. Web+PWA es el punto óptimo.

## 4. Arquitectura

```
src/
  engine/              # lógica pura, testeada, sin React
    layouts/           # definiciones de teclado (US, ES, LATAM): teclas, dedos, shift, dead keys
    curriculum/        # plan de lecciones (unidades → lecciones → pasos) generado desde el layout
    generator/         # generadores de texto: drill, review, words, sentences, adaptive
    typing/            # reducer de sesión de tipeo: keystrokes, errores, backspace, métricas
    stats/             # EMA por tecla, estrellas, racha, rutina diaria
    corpus/            # palabras (frecuencia) y frases en español
  app/                 # React: rutas, store, componentes, estilos
    routes/            # Bienvenida, Inicio, Ruta, Leccion, Practica, Estadisticas, Ajustes
    components/        # Keycap (botón), Keyboard, Hands, TypingArea, ProgressRing, etc.
    store/             # zustand persist
```

### Motor de tipeo
- Captura vía `<input>` oculto enfocado: `beforeinput`/`input` (soporta dead keys y composición) + `keydown` para Backspace/Escape.
- Estado: `target: string`, `typed: Keystroke[]` (char, correct, t), `pos`, `startedAt`, `finishedAt`.
- Backspace permitido; los errores igual cuentan para la precisión.
- Métricas: PPM bruto = (chars correctos/5)/min; precisión = keystrokes correctos / keystrokes totales; latencia por tecla = Δt desde el keystroke anterior (tope 2 s).

### Estrellas
- ★ completar; ★★ precisión ≥ 95 %; ★★★ precisión ≥ 97 % y PPM ≥ meta de la unidad.
- Metas PPM por unidad: fila guía 10, superior 12, inferior 15, mayúsculas 18, acentos 18, números 15, signos 15, velocidad 25→45.

### Rutina diaria
Bloques: **Calentamiento** (45 s, fila guía / teclas aprendidas) → **Lección** (siguiente de la ruta) → **Repaso adaptativo** (60 s, teclas débiles) → **Reto** (60 s, texto con todo lo aprendido, mide PPM). Racha = días consecutivos con ≥ 1 bloque hecho; "rutina completa" = 4/4.

### Persistencia (zustand persist, key `typelight.v1`)
`settings {layoutId, sound, name, onboarded}`, `lessons {[id]: {stars, bestWpm, bestAcc, attempts, completedAt}}`, `keys {[char]: {latencyEma, errorEma, samples}}`, `sessions [{at, kind, lessonId?, wpm, acc, chars, errors, seconds}]`, `streak {count, lastDay}`, `routine {day, done: {...}}`.

## 5. Diseño visual

Identidad: **set de keycaps retro** (beige de los 80 con teclas de acento). No es "cream + serif + terracota": es plástico cálido, sans redondeada, y colores de teclas de función.

Tokens:
- Papel `#F1ECDF`, keycap `#FFFDF7`, tinta `#1E2124`, tinta suave `#5B6068`, línea `#D9D1BC`.
- Enter-verde `#3FAE5A` (borde `#2E8A45`) = acción primaria. Mod-azul `#3D7BF7` (borde `#2B5FD0`) = secundaria/info. Esc-coral `#F26B4E` = error/racha. Sol `#F5C33B` = estrellas.
- Dedos (espejados): meñique coral-rosa `#F6A5B0`, anular sol `#F8D66B`, medio menta `#9EDDB1`, índice cielo `#9CCBF5`, pulgar lavanda `#C9C2F7`.
- Tipografías: display **Bricolage Grotesque** (800, tracking −0.02em), cuerpo y texto a tipear **Nunito Sans** (sin monospace: Seba lo pidió unificado).
- Radio 12 px botones / 16 px tarjetas; sombras: ninguna, profundidad con borde inferior 3–4 px (keycap). Presión = translateY(3px).

Firma: **todo botón es una tecla**; la rutina de hoy es una fila de 4 keycaps grandes; la ruta es un teclado de lecciones; el teclado en pantalla con manos es el héroe de la lección.

## 6. Rutas

- `/bienvenida` — nombre + detección/elección de layout (pedir "apretá la tecla a la derecha de la L").
- `/` — Inicio: rutina de hoy (4 keycaps), racha, PPM reciente, próxima lección.
- `/ruta` — unidades y lecciones con estrellas; bloqueo secuencial suave (se puede saltar hacia adelante dentro de la unidad actual, pero no de unidad).
- `/leccion/:id` — intro visual → pasos de ejercicio → resultados con estrellas.
- `/practica/calentamiento | repaso | reto` — ejercicios de rutina.
- `/estadisticas` — PPM y precisión en el tiempo, mapa de calor por tecla en el teclado.
- `/ajustes` — layout, sonido, nombre, reiniciar progreso.

## 7. Testing

- Vitest: layouts (char→tecla, dead keys, dedos), generadores (solo teclas permitidas, longitudes), reducer de tipeo (correcto/incorrecto/backspace/métricas), estrellas, racha, rutina.
- Playwright: flujo completo bienvenida → lección 1 → tipear → resultado.
