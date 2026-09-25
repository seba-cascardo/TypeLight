# Modo lectura — diseño

Fecha 2026-09-25 · sesión nocturna 2: Seba pidió «de lo que queda avanzá e implementá lo que te parezca correcto» (punto 35 del roadmap, `docs/research/2026-09-17-auditoria-y-roadmap.md` §5 Ola 5: «Modo lectura: libros rioplatenses de dominio público, tipear por párrafos, "stop on word" solo acá (L)»). Decisiones del agente con su porqué; Seba las revisa al volver.

**Estado:** en implementación (rama `lectura`).

## 0. Qué es

La cuarta etapa del camino que recorre r/typing (TypingClub → keybr → Monkeytype → libros): resistencia sobre texto real y largo. Una biblioteca chica de autores rioplatenses de dominio público, que se tipea página a página y guarda por dónde ibas. Es práctica, no medición: no toca la referencia, la rutina ni el Reto.

## 1. Los libros

- **Horacio Quiroga, _Cuentos de la selva_ (1918)** y **Roberto Arlt, _Aguafuertes porteñas_ (1928-1933)**, de es.wikisource.org. Dominio público en Argentina y Uruguay (Quiroga murió en 1937, Arlt en 1942; 70 años). Quiroga es cuento corto y amable; Arlt es Buenos Aires con voseo, lunfardo y humor: los dos son lectura que da ganas de seguir.
- `scripts/build-books.py` baja las páginas renderizadas por la API de MediaWiki (con reintento ante el límite de pedidos y una caché fuera de git), saca los párrafos y genera `src/engine/corpus/books.ts`. Adaptaciones mecánicas y documentadas: puntuación tipográfica a ASCII (— → -, «» y “” → "), los acentos de 1918 que la RAE sacó en 1952 (fué, vió, dió, á, ó…), restos de OCR, y la capitular de Quiroga (en la edición escaneada es una imagen).
- **Sin tuteo**, como el resto del corpus: se dejan afuera los textos con formas de «tú» que el voseo no comparte (tú, ti, contigo, eres, tienes, quieres…; «estás», «vas», «ves» y «das» son también voseo y no cuentan). Quedan 5 de 8 cuentos de Quiroga y 41 de 44 aguafuertes.
- **Páginas** de 150 a ~480 caracteres (hasta ~670 si un diálogo corto se junta con el párrafo siguiente), cortadas en fin de oración, o en `;`/`,` si una oración sola no entra.
- En teclados que no pueden tipear la ñ o las tildes (US), la página se translitera (á → a, ñ → n) en vez de perder letras.

## 2. «Stop on word»: el modo `word` del motor

Como el modo `free` del Reto (el error pasa, Backspace repara, las letras de más quedan colgadas), pero:
- el **espacio no avanza** mientras la palabra tenga un error o una letra de más; ese espacio rechazado no cuenta como error de la barra (el error ya se contó en la letra);
- un espacio a mitad de palabra es un error que pasa, no un salto a la palabra siguiente;
- el texto **no termina** con la última palabra mal: hay que repararla.

Es el punto medio de la comunidad avanzada entre «parar en la letra» (lecciones) y «el error pasa» (Reto): se lee de corrido y cada palabra queda bien antes de seguir. Solo se usa acá.

## 3. Pantallas

- **Biblioteca** (`/lectura`): una tarjeta por libro (título, autor, año, capítulos, barra de progreso por páginas, «Empezar» o «Seguir leyendo»), una línea sobre cómo funciona el modo y los créditos (Wikisource, dominio público).
- **Lector** (`/lectura/:bookId`): capítulo y página («Las medias de los flamencos · página 3 de 12»), un selector para saltar de capítulo, el texto en modo `word` sin teclado ni manos ni reloj. Al terminar la página: velocidad, al primer intento, reparados, y «Seguir (Enter)» a la siguiente. La posición se guarda al terminar cada página; salir a mitad de página la repite la próxima vez. Al terminar el libro, vuelve a la biblioteca con «Libro terminado».
- Entrada desde Inicio, en la tarjeta «Últimos números», junto a «Tipear un texto propio».

## 4. Datos

- Store **v8**: `reading: Record<bookId, { chapter, page, at }>` (la próxima página a tipear y cuándo se leyó; el libro más reciente es el de `at` mayor). Migración v7 → v8: `reading = {}`. Se borra con «Reiniciar progreso». Backup v8.
- Cada página grabada es una sesión `kind: 'reading'` con `mode: 'word'`, métricas de reparación, teclas, bigramas y palabras (es texto real), **sin** referencia ni bloque de rutina.
- Motor puro en `src/engine/reading/`: `readingText(page, layout)`, `nextSpot(book, spot)`, `bookProgress(book, spot)`, `lastRead(reading)`.

## 5. Verificación

Unitarios: modo `word` (error que pasa, espacio retenido sin error de barra, reparación, letra de más, espacio a mitad de palabra, final con la palabra mal); `nextSpot`/`bookProgress`/`lastRead`/`readingText`; el corpus (páginas dentro del rango, sin formas de tú, ASCII salvo letras españolas y ¿¡); migración v8 y backup v8. e2e: biblioteca con los dos libros; una página tipeada con un error, el espacio retenido, Backspace, «Seguir» y la posición guardada; Inicio enlaza a la biblioteca. Lint sin advertencias nuevas · build.
