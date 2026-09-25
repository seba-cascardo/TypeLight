# Unidades opcionales · símbolos de código y teclado numérico — diseño

Fecha 2026-09-25 · sesión nocturna 2: Seba pidió «de lo que queda avanzá e implementá lo que te parezca correcto» (punto 36 del roadmap, `docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 5: «Teclado numérico y símbolos de código como unidades opcionales al final (M)»). Las decisiones son del agente y llevan su porqué; Seba las revisa al volver.

**Estado:** implementado completo (rama `opcionales`, mergeada fast-forward a `master` el 2026-09-25). Desvíos: en la Ruta, las prácticas por par de símbolos se leen «práctica» y las de lenguaje llevan su sigla (JS, Py, $_, </>, +=); en el e2e, Playwright emula el numérico con Bloq Num apagado, así que la tecla del numérico se simula con su `keydown` + el carácter.

## 0. Qué es

Dos unidades nuevas **al final de la ruta**, marcadas como opcionales: **Símbolos de código** (llaves, corchetes, barras, operadores y líneas de código real) y **Teclado numérico** (la mano derecha sola, con el 5 como fila guía). Seba programa: los símbolos de código son lo que más usa fuera de la prosa, y en los teclados en español la unidad «Signos» no enseña `[ ] { } < > \ | ~ ^` ni `` ` ``.

## 1. Qué significa «opcional»

- `Unit.optional` y `Lesson.optional` en `true`. Van después de Velocidad, en ese orden: Código, Teclado numérico.
- **No cuentan como camino principal**: el «N de M lecciones» de Inicio y la barra de progreso cuentan solo lecciones principales; `learned` (lo que usan Reto, Repaso, examen, juegos y Progreso) sale de la última lección **principal** completada, así que hacer una opcional antes de tiempo no mete llaves en el Reto.
- `nextLesson` busca primero en el camino principal; recién con el camino principal completo sugiere la primera opcional pendiente.
- **Desbloqueo**: la primera lección de cada unidad opcional está siempre abierta (el converso decide cuándo); dentro de la unidad, cada lección abre la siguiente (y rige el mismo «soft lock» de la unidad en curso).
- Ruta: las unidades opcionales aparecen bajo un rótulo «Opcionales · cuando quieras», con su blurb que dice cuándo convienen.
- Completar una lección opcional llena la tarjeta «Lección» de la rutina, como cualquier lección (es práctica).

## 2. Símbolos de código (`codigo`, meta 20 PPM, lila)

- **Teclas**: los pares `[ ]`, `{ }`, `< >`, `\ |`, `` ` ~ ``, `^` que el layout pueda tipear (`canType`) y que **no** se hayan enseñado ya en el camino principal. En US la unidad Signos ya enseñó los cuatro primeros pares: ahí quedan `` ` ~ `` y `^`. En ES, `` ` `` y `^` son teclas muertas sin forma literal en los datos del layout: quedan afuera. Cada par es un trío corto (Teclas → Práctica) con la explicación de `explainChar` (AltGr, Shift, tecla muerta).
- **Código real**: `src/engine/corpus/code.ts`, líneas escritas a mano (sin copiar de ningún proyecto), una línea por entrada, ASCII, un solo espacio entre tokens, etiquetadas por lenguaje: `js` (JavaScript/TypeScript), `py` (Python), `sh` (terminal y git), `sql`, `web` (HTML, CSS, JSON). Identificadores en español y en inglés mezclados, como en la vida real.
- `ExerciseSpec { kind: 'code'; pool; langs?; focus?; count? }` → `codeText(pool, count, { rng, langs, focus })`: líneas cuyo texto entero es tipeable con el pool (si no, no entra); con `focus`, prefiere las que contienen esos símbolos; unidas con un espacio. Sin líneas suficientes, cae a `symbolsText`.
- **Lecciones de práctica** después de las teclas: «Código: operadores» (`= + - * / % < > ! & |`), «Código: JavaScript», «Código: Python», «Código: terminal y SQL», «Código: HTML y CSS», y el repaso de la unidad con todo mezclado.
- Tip al principio de la unidad: en el código el error cuesta más que en la prosa; los símbolos se tipean sin mirar como cualquier letra; AltGr con el pulgar derecho.

## 3. Teclado numérico (`numpad`, meta 20 PPM, menta)

- **Teclas** (independientes del layout): `4 5 6` (fila guía; el 5 tiene la marca), `7 8 9`, `1 2 3`, `0`, y operadores `+ - * /`. Sin la tecla decimal: según el sistema da `.` o `,`, y la app no puede saber cuál.
- **Dedos** (mano derecha): índice 7 4 1 · medio / 8 5 2 · anular * 9 6 3 · meñique − + · pulgar 0. El espacio entre números lo da el pulgar izquierdo.
- **Se exige el teclado numérico**: en las lecciones `numpad`, un dígito u operador tipeado desde el teclado principal no entra (se bloquea en `keydown`) y aparece «Con el teclado numérico»; una tecla del numérico con Bloq Num apagado (flechas, Inicio, Fin…) muestra «Activá Bloq Num». Lógica pura en `src/app/lib/numpad.ts` (`numpadVerdict({ key, code })`).
- **No toca el modelo de teclas**: las sesiones de estas lecciones se graban (minutos, racha, rutina) pero **sin** muestras por tecla, bigramas ni palabras, para no mezclar el `4` del numérico con el `4` de la fila de números.
- **En pantalla**: `Numpad` (4 × 5, `Bloq Num / * −`, `7 8 9 +`, `4 5 6`, `1 2 3 Enter`, `0 .`) con los colores por dedo, la marca del 5, la próxima tecla iluminada y las teclas apretadas; las manos siguen debajo con el dedo de la mano derecha que toca.
- `ExerciseSpec { kind: 'numpad'; chars; tokens? }` → `numpadText(chars, tokens, { rng })`: grupos de 2 a 4 dígitos y, cuando hay operadores, cuentas cortas (`45+6`, `300/4`, `7*8-2`), nunca empezando con un operador.
- Lecciones: tip (postura, Bloq Num, el 5), Teclas 4 5 6 → 7 8 9 → 1 2 3 → 0 → operadores, «Práctica: montos», «Práctica: cuentas», repaso de la unidad. Las lecciones de teclas llevan tarjetas de intro propias (no `explainChar`, que describe el teclado principal).

## 4. Qué no cambia

Los juegos, el Reto, el examen, el Repaso y Progreso siguen mirando solo el camino principal. El store no cambia (el progreso de lección se guarda por id). La cuenta de huecos de juego (12) no cambia.

## 5. Verificación

- Unitarios: `nextLesson` prefiere el camino principal y después las opcionales; las unidades opcionales existen al final en los tres layouts, con los pares que correspondan a cada uno; `codeText` (solo líneas tipeables, `focus`, `langs`, respaldo); cada línea del corpus es ASCII sin dobles espacios; `numpadText` (solo los caracteres pedidos, sin operador al principio); `numpadVerdict`; toda lección opcional genera texto no vacío en los tres layouts.
- e2e: la Ruta muestra «Opcionales»; una lección de código se abre y se completa; en una lección del numérico, `Digit4` no entra y `Numpad4` sí; Inicio sigue contando solo las lecciones principales.
- Lint sin advertencias nuevas · build.
