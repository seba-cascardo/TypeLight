# TypeLight

Mecanografía con diez dedos, en español, tecla por tecla. Una app local que combina la progresividad de TypingClub (posición de los dedos, una tecla a la vez, explicaciones visuales) con la adaptatividad de keybr (repasos sobre tus teclas más flojas), más una rutina diaria de diez minutos.

## Correr

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

## Regenerar el corpus de palabras

```bash
python scripts/build-corpus.py <es_50k.txt> <dict.json>
```

- `es_50k.txt`: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (`content/2018/es/es_50k.txt`, CC-BY-SA 4.0).
- `dict.json`: [words/an-array-of-spanish-words](https://github.com/words/an-array-of-spanish-words) (`index.json`), usado como lista blanca para sacar nombres propios y basura de subtítulos.
