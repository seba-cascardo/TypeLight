# Review engine1: motor de tipeo, layouts, generadores, corpus, currículo y lectura

Alcance: `src/engine/{typing,layouts,generator,corpus,curriculum,reading}`, `src/app/lib/{accents,fingers,numpad}.ts`. Leí `.serena/memories/typelight-architecture.md` antes. Los repros fueron tests temporales `src/engine/zz-review-engine1-*.test.ts` (ya borrados; `git status` limpio).

Barrido automático que corrí (no encontró nada, ver «Revisado sin hallazgos»): las 182/180/165 lecciones de LATAM/ES/US × 15 semillas × cada ejercicio → texto no vacío, sin `undefined`, sin dobles espacios, cada carácter tipeable en ese layout (`canType`) y dentro del `pool` de la lección; los IDs de lección son únicos.

---

## E1-01 · alto · Después del tip de bienvenida, Calentamiento, Repaso, Reto y Examen quedan con texto vacío

- **Dónde:** `src/engine/curriculum/build.ts:133` (el primer tip se crea con `pool: []`) + `src/app/hooks/useCurriculum.ts:31-32` + `src/app/routes/Practice.tsx:276-288`.
- **Escenario:** usuario nuevo. Lee el tip «intro», la primera lección (índice 0, `kind: 'tip'`). `completeTip` la marca con 3 estrellas (`LessonPlayer.tsx:165`: `completeLesson(lesson.id, 3, 0, 1)`). `useProgress` toma `last` = la última lección completada del camino principal, que es ese tip, y `learned = last.pool = []`. Si después vuelve a Inicio antes de terminar «Teclas f y j» y abre cualquier tarjeta de la rutina:
  - Calentamiento: `learned.length < 6` → `drillText([], 8, { joined: true })` → `''`
  - Repaso: `learned.length < 5` → `drillText([])` → `''`
  - Reto: `joined = !learned.includes(' ')` → `drillText([], 12)` → `''`
  - Examen: `joined` → `drillText([], 40)` → `''`

  `createSession('')` no termina nunca: `typeChar` sale por `pos >= target.length` sin grabar ningún keystroke, así que `startedAt` nunca se fija (y el reloj del Reto, que es con tiempo, tampoco debería arrancar). Le pasa a cualquier amigo nuevo que lea la bienvenida y vaya primero a Inicio. Pasa justo en los primeros minutos de uso.
- **Evidencia (repro):** en los tres layouts `lesson0 guia-tip-intro tip pool [] drillText(pool,8,joined)= ""`; `createSession('')` + `typeChar('a')` → `finishedAt null, keystrokes 0`. El `pool` de Practice ya tiene un fallback (`learned.length >= 2 ? learned : ['f', 'j']`), pero las ramas `drillText(learned, …)` usan `learned` crudo.
- **Confianza:** repro del motor + verificado leyendo la cadena de la app. Qué muestra la pantalla exactamente es hipótesis (se confirma abriendo `/practica/calentamiento` con sólo el tip hecho).
- **Arreglo:** en `useProgress`, no contar como `last` las lecciones `tip` (o las de `pool` vacío), así `learned` cae al default `lessons[1].pool`. Como red, que `Practice` use el mismo fallback `['f','j']` en las ramas de drill. Opcional: en `generateExercise`/`drillText`, no devolver nunca `''` (el comentario de `generateExercise` dice «Never returns an empty string»).

## E1-02 · medio · Las frases generadas de Tatoeba traen tuteo, una amenaza, un suicidio y un nombre propio, aunque el filtro dice que los saca

- **Dónde:** `src/engine/corpus/sentences.generated.ts` (filtro en `scripts/build-sentences.py:25-34`, una lista fija de formas de tú).
- **Escenario:** se usan en todo texto corrido (Reto, examen, Velocidad, Carrera, repasos de Mayúsculas y Tildes) con peso 1 contra 3 de las frases de la casa: ~1500 generadas contra ~200 de la casa, o sea cerca de 2 de cada 3 frases. La memoria del proyecto dice «sin tuteo» y el corpus dice «sin vulgaridades», pero la lista de tuteo sólo cubre presentes frecuentes y deja pasar:
  - Imperativos de tú: l.4 «Abre la ventana…», l.602-603 «Haz el favor…», «Haz una oración…», l.1377 «Toma esta autopista…», l.1433 «Ven, deja que te muestre…».
  - Presentes de tú que no están en la lista: l.5 «Acabas de despertar…», l.597 «¿Lo hueles?», l.632 «si concuerdas», l.670 «¿le echas más leña?», l.1045 «No te levantas…», l.1238 «me avisas», l.1249 «¿me lo envías?».
  - Contenido delicado para pasarle a amigos: l.1230 «Si la hieres de alguna manera, te mataré.», l.466 «…la habitación en la que se suicidó la autora.».
  - Un nombre propio que pasó por ir al principio de la frase: l.617 «Henar tiene que…». Un error ortográfico: l.8 «que tu me recomendaste» (tendría que ser tú).
- **Evidencia:** grep sobre el archivo (líneas citadas). Una heurística de «pronombre + verbo en -as/-es» dio además `hueles, concuerdas, echas, levantas, avisas, hieres, envías`.
- **Confianza:** verificado leyendo (los datos están en el repo).
- **Arreglo:** en `build-sentences.py`, sumar los imperativos de tú (abre, haz, toma, ven, ten, pon, di, sal…) y una regla para pronombre + verbo en -as/-es, más `mat(ar|é|aré)`, `suicid`, `hier(e|o)` a la blocklist. Regenerar y releer una muestra. Sacar los nombres también al principio de la frase (chequear la primera palabra contra la lista de nombres).

## E1-03 · bajo · El título de la tarjeta de un símbolo con Shift dice «? mayúscula», «¿ mayúscula», «( mayúscula»

- **Dónde:** `src/engine/curriculum/explain.ts:77-83`.
- **Escenario:** en Signos (y en cualquier carácter con Shift que no es una letra), la tarjeta de introducción se titula `${ch} mayúscula`. Pasa en los tres layouts: ES `? ¿ ! ( ) : ; _ = * " $ % & /`; LATAM `¡ " ! ( )…`; US `? " ! ( ) _ + …`. El cuerpo además dice «siempre la mano contraria a la que escribe **la letra**».
- **Evidencia (repro):** `es "¿" | ¿ mayúscula | La ¿ lleva Shift…`; `latam "\"" | " mayúscula`; `us "?" | ? mayúscula`.
- **Confianza:** repro.
- **Arreglo:** «mayúscula» sólo si `/\p{Lu}/u.test(ch)`; si no, un título como «`${ch}` con Shift».

## E1-04 · bajo · La tarjeta de Á/É/Í/Ó/Ú no dice que la vocal va con Shift

- **Dónde:** `src/engine/curriculum/explain.ts:67-74`.
- **Escenario:** en la lección «Teclas Á, É, Í, Ó y Ú» (ES y LATAM), la secuencia es tilde muerta (sin Shift) + Shift+vocal, pero la tarjeta dice «Primero presioná la tecla de tilde (´)… Después presioná la A con el meñique izquierdo y aparece la Á», sin Shift ni cuál de los dos. Con Ü, en cambio, el Shift va en la tecla muerta y sí se menciona.
- **Evidencia (repro):** `es "Á" | La Á, en dos toques | … Después presioná la A con el meñique izquierdo y aparece la Á.`
- **Confianza:** repro.
- **Arreglo:** si `last.shift`, agregar «con el Shift {lado}», igual que la rama de mayúsculas.

## E1-05 · bajo · Los corpus de frases con números y con símbolos son muy chicos: en US hay 5 y 4 frases

- **Dónde:** `src/engine/corpus/sentences.ts` (`NUMBER_SENTENCES` 18, `SYMBOL_SENTENCES` 20), usado por `build.ts:287-288, 305-306, 331`.
- **Escenario:** en US, `fitSentence` deja 5 de 18 frases con números y 4 de 20 con símbolos (las demás tienen tildes, ñ o ¿¡). Los Textos 2, 3, 5, 6 y 8 de Velocidad y los repasos de Números y Signos piden 2-3 frases de ese corpus, así que un usuario US ve casi siempre las mismas. En ES/LATAM entran las 18 y 20, pero se repiten igual entre lecciones.
- **Evidencia (repro):** `us numeros-unit-review numbers fits 5 of 18`, `us signos-unit-review symbols fits 4 of 20`, `latam … numbers fits 18 of 18`.
- **Confianza:** repro.
- **Arreglo:** escribir más frases de la casa (con al menos ~20 sin tildes, para US), o mezclar con `numbersText`/`symbolsText` cuando quedan menos de N frases.

## E1-06 · bajo · Hipótesis: en LATAM, `^` y `` ` `` (AltGr) son teclas muertas en Windows y el layout las trata como directas

- **Dónde:** `src/engine/layouts/data.ts:215-216` (`Quote … altGr: '^'`, `Backslash … altGr: '`'`).
- **Escenario:** si en el layout «Latinoamericano» de Windows AltGr+{ y AltGr+} son muertas (circunflejo y grave), la unidad opcional Código y su drill de `` ` ~ `` y `^` muestran una sola pulsación, pero sale el carácter recién con la tecla siguiente. Seguido de vocal compone (`` ` `` + a → à, error); seguido de espacio, el espacio se consume. Revisé `corpus/code.ts`: ninguna línea tiene `` ` `` o `^` seguidos de vocal, así que el daño práctico se reduce a una guía que no avisa. En ES ya se modelan como muertas, y por eso ES no tiene `` ` `` ni `^` (`canType` = null): ahí las líneas con backticks quedan fuera, que es coherente.
- **Confianza:** hipótesis. La búsqueda web no fue concluyente. Lo confirma la página de Microsoft del layout «Latin American» (las teclas muertas van resaltadas) o probarlo en Windows: AltGr+{ y después «a».
- **Arreglo:** si se confirma, `altGr` → un `altGrDead` (y sumar `circumflex`/`grave` a `dead`); ojo, cambia `slugOf` y con eso los IDs de esas lecciones opcionales.

## E1-07 · bajo · `words.ts` trae «pene», «vagina», «mataré», «mato», «man» y formas de tú, aunque el comentario dice «sin violencia, sin inglés»

- **Dónde:** `src/engine/corpus/words.ts` (generado por `build-corpus.py`).
- **Escenario:** el rango (posición en la lista de frecuencia) de cada una: mataré 2108, pene 2374, mato 2557, man 3159, vagina 4728. `candidateWords(pool, 1500)` toma las primeras 1500 tipeables con el pool, así que con pools parciales se llega más profundo. `patternText` usa 3000. Pueden salir en Globos, Repaso o patrones. Además: tú 52, estás 50, tienes 73, eres 79, quieres 99 (frecuentes; para un rioplatense suenan a doblaje).
- **Confianza:** verificado leyendo (scan del arreglo).
- **Arreglo:** sumarlas a `BLOCK` en `corpus_common.py` y `--reclean`. El tuteo en palabras sueltas lo decide Seba (cuestiono la decisión por los usuarios rioplatenses, no lo reporto como bug).

## E1-08 · bajo · En modo `free`, la última letra termina el texto aunque esté mal, y un espacio en la última palabra también

- **Dónde:** `src/engine/typing/index.ts:146-151` y `155-164`.
- **Escenario:** en el Reto, Mi texto u otro modo `free`, si la última tecla sale mal (o se aprieta espacio a mitad de la última palabra), la sesión termina al instante y Backspace ya no puede reparar. Va contra la promesa del modo: el error pasa y se repara con Backspace. El modo `word` ya lo resuelve.
- **Evidencia (repro):** `createSession('ab cd','free')` + `'ab cx'` → `finished true, correct 4`.
- **Confianza:** repro. Puede ser decisión, pero no está documentada.
- **Arreglo:** en `free`, terminar sólo si la última posición quedó bien, o con un espacio/Enter final. Si no, dejarla como está y documentarla.

## E1-09 · bajo · Erratas en el libro de Quiroga y en un título de Arlt

- **Dónde:** `src/engine/corpus/books.ts:30` («se habían **pegade** escamas»; el original dice «pegado»), `books.ts:540` («Dialogo de lechería»: los acentos se modernizaron en el resto, pero acá falta la tilde de «Diálogo»).
- **Confianza:** verificado leyendo; lo confirma una mirada a es.wikisource. Cambiar el título rompe `resolveSpot` por título para quien esté en ese capítulo: lo manda al comienzo del libro.
- **Arreglo:** corregir en `build-books.py` (una lista de reemplazos) y regenerar. Para el título, aceptar el reinicio o buscar también por título normalizado sin tildes.

## E1-10 · mejora · `wordSamples` promedia las repeticiones de una palabra con `(a+b)/2`

- **Dónde:** `src/engine/typing/index.ts:378-383`.
- **Escenario:** si una palabra aparece 3 veces, la última pesa 50 % y la primera 25 %: un sesgo menor en `store.words`.
- **Arreglo:** acumular la suma y la cantidad de latencias y dividir al final.

## E1-11 · mejora · Hipótesis: quien tiene US-Internacional y elige «Inglés (US)» choca con las comillas muertas

- **Dónde:** `src/engine/layouts/data.ts:85-130` (US sin teclas muertas).
- **Escenario:** en Argentina es común el US-Internacional, donde `'` y `"` son muertas. El primer par de Signos en US es `'` `"`, y `symbolsText` arma `'palabra'`: `'` + vocal → á (error). Ese usuario además podría tipear tildes, pero la app le da el currículo sin tildes.
- **Confianza:** hipótesis sobre el uso real. Lo confirma preguntar qué teclado tienen los amigos.
- **Arreglo:** un cuarto layout «US internacional» (`'` y `"` muertas, con `´`/`¨` vía `'`/`"`), o una nota en el selector.

## E1-12 · mejora · `pseudoWord`/`weightedIndex` con arreglo vacío devuelven el texto «undefinedundefined…»

- **Dónde:** `src/engine/generator/rng.ts:533-541` (devuelve `-1` con `weights` vacío) y `generator/index.ts:107-111`.
- **Escenario:** un pool sin minúsculas (p. ej. `learned = []` de E1-01, que en `Play`/`SuddenGame` se pasa directo a `challengeText`) genera literalmente «undefined». Hoy está tapado por el fallback del pool de Practice; queda latente.
- **Evidencia (repro):** `pseudoWord([])` → `undefinedundefinedundefined`; `challengeText(poolOf([]))` → `undefinedundefined…`.
- **Arreglo:** `pseudoWord` con `letters` vacío → `''` (y filtrar los tokens vacíos), o un `assert` en `weightedIndex`.

---

## Revisado sin hallazgos

- **Motor de tipeo** (`typing/index.ts`): `stop`, `free` y `word`. Avance, error, `erred`, `lastWrong`; extras con tope de 5, que en `word` bloquean el espacio y se borran con Backspace; salto por espacio a mitad de palabra (posiciones en `null`, `erred`); espacio al inicio de palabra (tecla suelta); `word` al final con la última palabra mal (rechaza visible, Backspace vuelve); Backspace por encima de una palabra ya cerrada y de una salteada. Métricas: sin `NaN` ni división por cero (`seconds = 0` → `wpm = 0`, `accuracy = 1` sin intentos, `kspc` con `max(1, pos)`); `blocked`/`backspace` fuera de `attempts()`; `repairMetrics.erred` limitado a `i < pos`. `bigramSamples`/`wordSamples`/`deadKeyStats`/`cleanRun`/`rhythm` con Backspace y bloqueos: correctos. `typeText` con cadenas de varios caracteres (`´t` de Windows) y `afterPause` sólo en la primera.
- **Layouts:** ES y LATAM contra Windows (º ª \ | @ # ~ ¬ ' ? ¡ ¿ ` ^ + * ] ñ ´ ¨ { ç } < > , ; . : - _ en ES; | ° ¬ " # ' ? \ ¿ ¡ @(AltGr+Q) ´ ¨ + * ~ ñ { [ } ] < > en LATAM); `resolveChar` de á/Á/ü/Ü (muerta + vocal, con el Shift en la tecla muerta para la diéresis); `Backslash` como el código de la tecla ISO junto a Enter; la asignación de dedos; `fingersFor` (Shift opuesto + pulgar para AltGr). macOS no se modela (Opt en vez de AltGr), pero sólo afecta la guía; la captura es por `input`, así que el carácter producido llega igual.
- **Generadores:** con 15 semillas por ejercicio en todo el currículo de los tres layouts, nada vacío, nada intipeable, nada fuera del pool. `ngramText`/`patternText`/`symbolsText`/`codeText`/`numpadText` terminan siempre (bucles acotados o con progreso garantizado). `fitSentence` nunca toca tildes y quita ¿?/¡! en pares; el guion de palabras compuestas sólo se perdería en US antes de Signos, donde esas frases ya quedan fuera por tildes. RNG mulberry32 y `seedOf` FNV-1a deterministas.
- **Currículo:** IDs únicos por layout y estables por codepoints; la unidad Tildes sólo en ES/LATAM; los pares de Signos tipeables en cada layout; `nextLesson` (sin progreso → tip de bienvenida; todo el camino principal → primera opcional); `lessonAfter` cruza a la unidad opcional después del último juego de Velocidad (coherente con «las opcionales recién con el camino completo»). `warmupGame` y `wordsReady`.
- **Lectura:** `readingText` en ES/LATAM deja las páginas intactas (ningún carácter intipeable); en US translitera tildes/ñ/ü y quita ¿¡ (documentado; ojo que «año/años» pasa a «ano/anos», 60 veces en Arlt: es la consecuencia de la decisión, no un bug). `resolveSpot` (título primero, índice sólo sin título, página recortada); no hay títulos de capítulo repetidos ni capítulos vacíos. `nextSpot`, `bookProgress`, `lastRead`. Las páginas miden 66-622 caracteres (la memoria dice 150-480; es una diferencia de doc, sin impacto).
- **`app/lib`:** `accents.ts` (sólo clases de color), `fingers.ts` (`handsOpacityFor` con piso del 30 %, `typingFinger`), `numpad.ts` (`numpadVerdict`: Bloq Num apagado → `numlock`, dígitos y operadores del teclado principal → `use-pad`; `NumpadDecimal` sin `ch`, coherente porque ninguna lección pide `.`).
