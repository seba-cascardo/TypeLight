# TypeLight

Mecanografía con diez dedos, en español, tecla por tecla. Una app local que combina la progresividad de TypingClub (posición de los dedos, una tecla a la vez, explicaciones visuales) con la adaptatividad de keybr (repasos sobre tus teclas más flojas), más una rutina diaria de diez minutos.

## Usarla

Abrí **<https://seba-cascardo.github.io/TypeLight/>** en Chrome o Edge de escritorio. No hace falta instalar nada ni crear una cuenta: el progreso de cada persona queda en su propio navegador. Para no perderlo, en **Ajustes** elegí una carpeta tuya y la app guarda ahí una copia sola cada vez que practicás (en otros navegadores, descargá la copia a mano desde el mismo lugar).

## Correr en tu máquina

```bash
npm install
npm run dev
```

Abrí <http://localhost:5173>. Todo el progreso se guarda en el navegador (`localStorage`), no hay backend.

Otros comandos:

| Comando            | Qué hace                                             |
| ------------------ | ---------------------------------------------------- |
| `npm test`         | Tests del motor (layouts, generadores, tipeo, stats) |
| `npm run e2e`      | Flujo completo en Chromium con Playwright            |
| `npm run build`    | Build estático en `dist/` (se sirve desde cualquier host) |
| `npm run lint`     | oxlint                                               |
| `node scripts/shot.mjs <url> <out.png> [w h light|dark full selector]` | Captura de pantalla contra el dev server con progreso sembrado |

## Cómo está armado

```
src/engine/      lógica pura, sin React, testeada con Vitest
  layouts/       teclados US, Español (España), Español (Latinoamérica): teclas, dedos, shift, AltGr, teclas muertas
  corpus/        6000 palabras por frecuencia (filtradas contra diccionario) + frases escritas a mano
  generator/     texto de ejercicios: drill, repaso, palabras reales/pseudo, frases, números, símbolos, adaptativo
  typing/        máquina de estados de una sesión: errores, latencias, PPM, precisión
  stats/         EMA por tecla, teclas débiles, estrellas, racha
  curriculum/    plan de lecciones generado a partir del layout + explicaciones por tecla
src/app/         React 19 + react-router + zustand (persist) + Tailwind v4
  routes/        Bienvenida, Hoy, Ruta, Lección, Práctica, Progreso, Ajustes
  components/    Keycap (todo botón es una tecla), Keyboard, Hands, TypingArea, KeyGuide
```

Detalles de diseño y decisiones: [`docs/superpowers/specs/2026-09-15-typelight-design.md`](docs/superpowers/specs/2026-09-15-typelight-design.md).

## Método

1. **Fila guía primero**, después superior, inferior, mayúsculas, tildes (solo teclados en español), números, signos, velocidad.
2. **Cada tecla nueva = Teclas → Repaso → Práctica**, con tarjetas que explican qué dedo se mueve y hacia dónde.
3. **Parar en el error**: la letra se marca en rojo y no avanzás hasta acertar. Cada ejercicio terminado es una repetición correcta.
4. **Precisión antes que velocidad**: ★ terminar · ★★ ≥ 95 % · ★★★ ≥ 97 % y la meta de PPM de la unidad.
5. **Rutina diaria**: Calentamiento (1 min) → Lección (5 min) → Repaso adaptativo con tus 3 teclas más lentas (2 min) → Reto de un minuto. Racha por días consecutivos.
6. **Juego "Lluvia de teclas"** cada pocas lecciones: caen keycaps con las letras aprendidas, en el color del dedo que las presiona.
7. **Tema**: papel de día, "noche de teclado" cuando el sistema está en oscuro (o fijo desde Ajustes).

## Créditos

- Manos guía: dibujo anatómico del dorso de la mano de [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hand_external_anatomy,_dorsum.svg) (dominio público). La silueta de piel (`src/app/assets/hand-mask.png`) se deriva del dibujo con `scripts/build-hand-mask.py` (necesita `e2e/screens/hand-raster.png`: el SVG rasterizado a 1028×1396 sobre blanco).
- Palabras: ver abajo.

## Regenerar el corpus de palabras

```bash
python scripts/build-corpus.py <es_50k.txt> <dict.json>
```

- `es_50k.txt`: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (`content/2018/es/es_50k.txt`, CC-BY-SA 4.0).
- `dict.json`: [words/an-array-of-spanish-words](https://github.com/words/an-array-of-spanish-words) (`index.json`), usado como lista blanca para sacar nombres propios y basura de subtítulos.

## Regenerar las frases y los n-gramas

```bash
python scripts/build-sentences.py   # scripts/spa_sentences.tsv.bz2 + dict.json -> src/engine/corpus/sentences.generated.ts
python scripts/build-ngrams.py      # sin inputs, lee words.ts -> src/engine/corpus/ngrams.ts
```

- `spa_sentences.tsv.bz2`: [descarga de Tatoeba](https://downloads.tatoeba.org/exports/per_language/spa/spa_sentences.tsv.bz2) (CC BY 2.0 FR), filtrado contra `dict.json` y contra formas de tuteo/vosotros y vocabulario peninsular (`scripts/corpus_common.py`).
- `build-ngrams.py` no necesita descargar nada: arma la tabla de bigramas y trigramas a partir de `words.ts`, ya en el repo.

## Licencia y créditos

El código es [MIT](LICENSE). El contenido de terceros conserva su licencia, con el crédito en el encabezado de cada archivo:

- Palabras por frecuencia (`src/engine/corpus/words.ts`): OpenSubtitles 2018 vía [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords), CC BY-SA 4.0.
- Frases (`src/engine/corpus/sentences.generated.ts`): [Tatoeba](https://tatoeba.org), CC BY 2.0 FR.
- Textos del modo lectura: Horacio Quiroga y Roberto Arlt, dominio público, desde [es.wikisource.org](https://es.wikisource.org).
- Mascota: «Toon Head» de [Johan Melin](https://www.johanmelin.com), CC BY 4.0.
- Manos: «Hand external anatomy, dorsum» de [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hand_external_anatomy,_dorsum.svg), dominio público.
