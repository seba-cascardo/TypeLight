# Backlog

Pendientes acordados con Seba, en orden de llegada. Los "hechos" se borran de acá y quedan en git.

## Pendientes

Ninguno. La sesión nocturna 2 la revisó Seba el 2026-09-25 y aprobó los cinco ítems sin cambios.

## Ideas sueltas (sin compromiso)

- «Consistencia por bigrama» (punto 23, reemplazo de Ritmo parejo): quedó Fluidez (rollover) en su lugar; la desviación por bigrama no se muestra.
- Muerte súbita no está en la ruta (solo en «Jugar»); si Seba la quiere en la dieta, entra como hueco de juego como los demás.
- El texto propio no tiene historial: cada vez se pega de nuevo (a propósito: no es una biblioteca).
- Modo lectura: 3 de 8 cuentos de Quiroga (*La tortuga gigante*, *La guerra de los yacarés*, *La abeja haragana*) y 3 aguafuertes de Arlt quedaron afuera por tuteo. Si Seba los quiere igual, basta con relajar el filtro en `scripts/build-books.py`. Sumar libros = sumar una entrada a `BOOKS` del script (Lugones, Payró y Güiraldes también están en Wikisource).
- Teclado numérico: la tecla decimal no se enseña (según el sistema da `.` o `,` y la app no puede saber cuál).
- Al compás con palabras usa letras sueltas de palabras; «sílabas como notas» (una nota por sílaba) quedó sin hacer.
- El corpus de palabras sale de OpenSubtitles y la fuente (`es_50k.txt`) no está en el repo: `build-corpus.py --reclean` limpia el `words.ts` actual, pero regenerarlo de cero pide bajar la fuente otra vez.
