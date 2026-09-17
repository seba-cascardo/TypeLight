# Plataformas de mecanografía al tacto: informe comparativo para el roadmap de TypeLight

Fecha: 2026-09-17. Fuentes: documentación oficial, código open source (keybr, Monkeytype, keyzen), Hacker News (API Algolia), Reddit r/typing (scrapeado vía Apify), blogs y reseñas. Todo lo que no pude verificar está marcado como **[no verificado]**. Las citas de usuarios son cortas y con link.

Convenciones: WPM = palabras por minuto (5 caracteres = 1 palabra). CPM = caracteres por minuto. "S/M/L" = esfuerzo chico / medio / grande estimado para TypeLight (React sin backend, progreso en localStorage).

---

## 1. Resumen ejecutivo (lo accionable para TypeLight)

1. **Parar en el error sin Backspace no es una rareza: es el default de keybr** (`stopOnError = true`, `forgiveErrors = true` en su código), el default de TIPP10 ("Block typing errors"), el único modo de Peter's Online Typing Course y el modo "Instant Death" que TypeRacer creó porque "improving your accuracy is the best way to improve your WPM". TypeLight está bien parado; lo que falta es *explicar* el porqué en la UI, como hacen esos sitios.
2. **La combinación canónica que repite la comunidad es "TypingClub para aprender qué dedo va a qué tecla → keybr para desbloquear letras hasta ~60 WPM por tecla → Monkeytype (English 1k + puntuación) para velocidad → TypeRacer / libros para texto real y resistencia".** Ninguna plataforma cubre las cuatro etapas sola; TypeLight puede cubrir tres (ruta + repaso adaptativo + reto/carrera) y le falta la cuarta: texto largo real.
3. **El algoritmo de keybr es simple y copiable**: 6 teclas iniciales ordenadas por frecuencia, tiempo-por-tecla suavizado con EMA (α = 0,1), `confianza = tiempoObjetivo / tiempoActual`, desbloquea una tecla nueva cuando *todas* las anteriores alguna vez superaron la velocidad objetivo (175 CPM = 35 WPM por default, rango 75–750), y enfoca la lección en la tecla de menor confianza. Predice lecciones restantes con regresión polinómica sobre las últimas 30 muestras. Detalle en la ficha.
4. **Lo que más frustra de keybr es lo que TypeLight ya evita**: pseudo-palabras ("fake words"), empezar por teclas fuera de la fila guía, y que "se ensaña" con Q/X/B. Lo que más elogian es lo que TypeLight todavía puede reforzar: analítica por tecla, heatmap de aciertos/errores, sensación tangible de progreso al desbloquear teclas.
5. **Monkeytype gana por sensación de tipeo (caret suave, sonidos, 400 temas) y por control del corpus y la duración**, no por el funbox. Sus métricas están bien definidas: WPM neto (solo palabras correctas), raw, precisión (% de teclas correctas), consistencia (coeficiente de variación del raw mapeado 0–100) y burst (raw de una sola palabra). Vale copiar **consistencia** y **burst** como métricas del reto.
6. **La comunidad tiene un consenso explícito sobre métricas engañables**: "15 segundos, English 200, todo minúsculas no es tu velocidad". Lo "impresionante" es lista ≥1k palabras, test ≥1 minuto, precisión ≥98 %, corrigiendo todos los errores. TypeLight ya restringe la velocidad de referencia a sesiones de referencia; conviene *mostrar ese criterio* como sello ("velocidad honesta") para que el usuario entienda por qué no infla.
7. **Los n-gramas son el puente entre "sé dónde está cada tecla" y "tipeo palabras como chords"**. Ngram Type (bigramas/trigramas top 50–200 con combinación × repetición y umbral de WPM/precisión para avanzar), Amphetype (trigramas lentos/"viscosos") y Typecelerate (patrones: letras, bigramas, trigramas, palabras, bordes de palabra, "spacegrams") lo hacen bien. TypeLight no tiene drills de n-gramas en español: es la feature de contenido más barata con más impacto.
8. **Meseta típica: 60–70 WPM.** El diagnóstico recurrente es precisión < 98 %, corpus chico, tests cortos, y "no leer adelante". Las recetas que funcionan: bajar la velocidad hasta 98–99 %, alternar bursts de 10 palabras / 15 s con tests de 60 s y 2 min de resistencia, y practicar palabras falladas hasta cero errores.
9. **"Practicar palabras falladas/lentas" (Monkeytype) es la feature más pedida y más usada**; la queja es que solo existe para el último test. TypeLight tiene datos por tecla; falta la lista histórica de *palabras* problemáticas y un botón para drillarlas.
10. **Texto largo real (libros) es la práctica de resistencia preferida por intermedios** (TypeLit, Entertrained, Amphetype) y la razón por la que muchos abandonan keybr ("got boring after a while since you are mindlessly typing"). Entertrained demuestra que se puede hacer 100 % local (IndexedDB, export/import JSON, sin cuenta).
11. **Sin backend igual se puede tener "competencia"**: fantasma (ya lo tiene TypeLight), PB por modo/longitud (Monkeytype), ranking personal semanal, "muerte súbita". Lo que no se puede: ligas y carreras en vivo (TypeRacer, Nitro Type) — y la comunidad de todos modos considera a Nitro Type/TypeRacer como diversión, no como entrenamiento.
12. **Gamificación que funciona en adultos**: racha, minutos/día con objetivo (keybr default 30 min), estrellas por lección (TypingClub 1–5, criterio que "valora precisión sobre velocidad"; 5 estrellas ≈ 2,5× el WPM meta con precisión casi perfecta), certificados con niveles (Ratatype: 200–250 / 250–300 / 300–350 CPM). La gamificación infantil (autos, cash, piratas) genera rechazo en r/typing ("cutesy animations and other time wasting stuff").
13. **Para español**, la oferta es pobre: sitios en español (mecanografia-online, ARTypist, Sense-lang) son cursos lineales sin adaptación; mecanografia.com es pago y para niños; Velocidactil es carreras. Las globales (Monkeytype, TypingClub, Typing.com, Ratatype, AgileFingers, 10FF, Typing Study) tienen listas o cursos en español, pero ninguna modela la ñ, las tildes con tecla muerta ni la diferencia ES/LatAm como TypeLight. Dato de un hispanohablante en r/typing: en teclado ES el meñique derecho "casi no tipea" en inglés porque la Ñ ocupa su posición; en español sí. Es un argumento para métricas por dedo.
14. **Exportar/importar progreso y PWA offline** son pedidos concretos ("I would personally like an offline version of monkeytype") y triviales para una app local. Riesgo real de TypeLight hoy: perder localStorage = perder todo.
15. **Ideas que nadie hace bien y TypeLight podría**: explicar *por qué* una palabra salió lenta (mano dominante, misma-dedo, fila inferior, doble letra), reposo por dedo ("hand health": excluir un dedo en la sesión libre), y una sola métrica de "confianza" por tecla que combine latencia y error con umbral configurable.

---

## 2. Tabla comparativa

| Plataforma | Tipo | Modelo de aprendizaje | Error / Backspace | Feedback en vivo | Métricas destacadas | Hábito / gamificación | Español | Precio |
|---|---|---|---|---|---|---|---|---|
| **keybr** | Web, OSS | Adaptativo por tecla (confianza vs. velocidad objetivo), letras por frecuencia, 6 iniciales | Default: **para en el error, sin Backspace**; "forgive errors" recupera 1 char; opcional desactivar | Teclado en pantalla, tecla resaltada, sonidos | Tiempo/tecla (EMA), confianza, heatmap, predicción de lecciones restantes | Objetivo diario (30 min), rachas, perfil público, multiplayer | Sí (idioma y layout ES) | Gratis (pago único opcional) |
| **Monkeytype** | Web, OSS | No enseña; test configurable (tiempo/palabras/quotes/zen/custom) | Configurable: stop on error off/word/letter; confidence mode (sin Backspace); expert/master falla el test | Caret suave, keymap opcional, 16 sonidos, error sound | WPM/raw/acc/consistencia/burst, gráfico por test, PB por modo, historial | XP, rachas, leaderboards diario/semanal, tags, presets | Listas spanish / 1k / 10k (RAE), quotes; "lazy mode" quita tildes | Gratis (ads opcionales) |
| **TypingClub / edclub** | Web (edu) | Curso lineal Typing Jungle (701 lecciones), videos, "finger gym", juegos intercalados | Backspace permitido con penalización; error penaliza doble; docente puede hacer que el cursor frene al 1.º/2.º/3.º error | Manos y teclado, replay del intento | WPM, precisión, estrellas 1–5, puntaje; mínimo de estrellas para avanzar | Estrellas, badges, certificados, dashboards | Cursos en varios idiomas incl. español | Gratis con ads / escuelas pago |
| **Typing.com** | Web (edu) | Curso lineal (principiante→avanzado) + alfabetización digital + código + IA | Errores marcados, se sigue; Backspace configurable por docente | Teclado/manos | WPM, precisión, tests 1/3/5 min, certificados | Badges, certificados, juegos | Interfaz y curso en español (typing.com/es) | Gratis con ads |
| **Ratatype** | Web | 15 lecciones lineales (fila guía → dedos → combinaciones → shift → frases), no se puede saltear | Backspace para corregir; premios por ejercicio (estrella, "sin errores", "rápido") | Teclado color por dedo, manos | WPM, precisión; certificado plata/oro/platino por CPM | Certificados, clases | Sí (España) | Gratis / Plus |
| **TypeRacer** | Web, carreras | Ninguno; texto real (citas de libros/películas) | Debe corregir cada palabra antes de seguir; "Instant Death" universe: un typo te saca | Auto en pista | WPM (inglés) / CPM (otros), precisión, skill levels, historial | Multijugador en vivo, universos, premium | 50+ idiomas | Gratis / premium |
| **Nitro Type** | Web, juego | Ninguno; carreras | Precisión afecta velocidad del auto | Auto + nitros | WPM, precisión | Cash, autos, equipos, temporadas, Nitro Gold | [no verificado] | Gratis / $9,99 año |
| **TypeLit / Entertrained** | Web, libros | Tipear libros enteros | Entertrained: local, sin cuenta; TypeLit: premium para importar textos | Teclado opcional | WPM/precisión por sesión/capítulo, gráficos | Progreso por libro, modo lectura | Libros mayormente en inglés | Gratis / TypeLit premium |
| **Ngram Type** | Web, OSS | Bigramas/trigramas/tetragramas/palabras top 50–200; combinación × repetición | Marca errores; no avanza de lección sin WPM y precisión mínimos | Colores + sonido | WPM y precisión promedio por ronda (se resetea) | Ninguna | Forks FR/DE; custom text | Gratis |
| **TIPP10** | Desktop+web, GPL | 20 lecciones; "Intelligence": repite más los caracteres fallados | Default "Block typing errors" (frena hasta la tecla correcta); opción corregir con Backspace; beep | Teclado virtual, teclas coloreadas, trayectorias de dedos, metrónomo | Estadísticas por tecla/dedo | Ninguna | Traducción ES parcial | Gratis |
| **Klavaro** | Desktop, GPL | 4 módulos: básico, adaptabilidad, velocidad, fluidez | Fluidez: obliga a corregir | Teclado; editor de layouts | Gráficos de progreso | Ninguna | Sí | Gratis |
| **KTouch** | Desktop KDE, GPL | Cursos por layout; desbloqueo por umbral | Corregir con Backspace | Teclado con tecla y dedo indicados | Umbral default 98 % y 180 CPM | Ninguna | Sí | Gratis |
| **AgileFingers** | Web | Lecciones por dedo, textos, tests | El typo baja el puntaje aunque lo borres; precisión mínima default 90 % | Manos y teclado rediseñados | WPM, precisión, gráfico | Símbolos de animales por velocidad, 4 juegos, docentes | Sí | Gratis con pocos ads |
| **Typesy** | Web/desktop | 5000+ lecciones, videos, adaptativo | [no verificado] | Videos de manos | Progreso, nube | Avatares, juegos | [no verificado] | $9/mes |
| **TypingMaster** | Windows | 10 h de curso; **TypingMeter** analiza tu tipeo real y arma drills | [no verificado] | Teclado | Problemas por tecla/palabra en uso real | Juegos | [no verificado] | Trial / $29 año |
| **10FastFingers** | Web | Test top 200 / 1000 palabras | Marca errores | — | WPM (5 chars), keystrokes correctos/incorrectos | Logros, competencias, multiplayer | Sí | Gratis |
| **ZType** | Juego | Disparar palabras | Backspace deselecciona | — | Puntaje | Oleadas | Custom text | Gratis |
| **Keyzen** | Web, OSS | Palabras de 7 chars aleatorios; tecla nueva tras 5 aciertos seguidos en todas | El error no resetea la palabra | — | Aciertos consecutivos por tecla | — | — | Gratis |
| **typing.io** | Web | Código real (JS, C, Java…) | Incluye Backspace y símbolos en la métrica ("unproductive keystrokes") | — | WPM, keystrokes improductivos | — | — | Freemium |
| **Amphetype** | Desktop, OSS | Importar libros; generar lecciones de palabras/trigramas lentos | Configurable; se recomienda 99–100 % para avanzar | — | WPM, precisión, **viscosidad** por palabra/tecla/trigrama | — | Cualquier texto | Gratis |
| **Typecelerate** | Web | Debilidades por precisión o velocidad; patrones (letras, bigramas, trigramas, palabras, bordes, spacegrams); include/exclude regex | [no verificado] | Caret suave | PB por lista/longitud, perfiles y presets | — | 8 idiomas | Gratis |
| **Mecanografia-online.com** | Web (ES) | Filas → textos → test | [no verificado] | Videos | Test velocidad/precisión | — | Sí, ES + Dvorak/AZERTY/… | Gratis (donación) |
| **ARTypist** | Web (ES) | 19 unidades (fila guía → tildes → números) | [no verificado] | Teclado en pantalla | WPM, precisión, ranking, certificado verificable | Certificado | Sí (+ cat/eus/gal) | Gratis / premium |
| **Velocidactil** | Web (ES) | Carreras | [no verificado] | Auto | WPM/PPM, stats por idioma | Grupos, mensajes, Android | Sí, textos legales para oposiciones | Gratis |
| **Mecanografia.com** | Web (ES, niños) | 30 lecciones piratas, adapta a letras problemáticas | [no verificado] | — | Informes para padres | Medallas, tesoros | Sí | ~€75–80 |

---

## 3. Fichas por plataforma

### 3.1 keybr (profunda; código en github.com/aradzie/keybr.com)

**Modelo de aprendizaje.** Lección "guiada" que genera una lista de palabras según tus estadísticas por tecla. Del código (`packages/keybr-lesson/lib/guided.ts`, `key.ts`, `target.ts`, `settings.ts`, `packages/keybr-result/lib/keystats.ts`):

- Alfabeto inicial de **6 letras** (`minSize = 6`), ordenadas por frecuencia del idioma (opción `keyboardOrder` para ir por filas del teclado). `alphabetSize` (0–1) permite forzar más letras desde el arranque.
- Por cada tecla se guarda `timeToType` = **EMA con α = 0,1** de los tiempos de tecleo (`makeFilter(0.1)`), y `bestTimeToType` = el mínimo histórico de ese valor filtrado. Solo entran muestras con `timeToType > 0`; los errores (`missCount`) se cuentan aparte y **no** modifican directamente el EMA.
- `confianza = speedToTime(targetSpeed) / timeToType`; ≥ 1 significa "más rápido que el objetivo". `targetSpeed` default **175 CPM (35 WPM)**, rango 75–750.
- Reglas de inclusión, en orden: (1) completar el mínimo de 6; (2) completar el máximo si `alphabetSize` lo pide; (3) incluir toda tecla con `bestConfidence ≥ 1`; (4) agregar una tecla nueva solo cuando todas las previas están "alguna vez por encima del objetivo" (o, con `recoverKeys`, *ahora* por encima). **Foco** = la tecla incluida de menor confianza.
- Palabras: primero palabras reales del diccionario filtradas al alfabeto actual (hasta 1000); si hay menos de 15, rellena con **pseudo-palabras** del modelo fonético (`keybr-phonetic-model`): tabla de transiciones con prefijo variable, muestreo aleatorio ponderado por frecuencia, filtro de letras permitidas, la letra foco se fuerza en el prefijo, largo máximo 10 y probabilidad de espacio × 1,3^largo (palabras más cortas).
- Extras de lección: `capitals` 0–1, `punctuators` 0–1, `repeatWords` 1–10 ("doble palabra"), objetivo diario `dailyGoal` default **30 min** (0–120), progreso = minutos tipeados hoy / objetivo.
- **Learning rate**: regresión polinómica (grado 1/2/3 según cantidad) sobre las últimas 30 muestras; si R² ≥ 0,5 proyecta hasta 50 lecciones para estimar "lecciones restantes hasta el objetivo".
- Otros tipos de lección: lista de palabras (10–1000), libros (Alicia), texto propio (≤ 10 000 chars), números (Benford), código por sintaxis. Layouts: muchos, incluidos ES.

**Manejo del error.** `packages/keybr-textinput/lib/settings.ts`: `stopOnError = true` ("text input stops advancing until the right key at the cursor position is pressed, no delete key is used"), `forgiveErrors = true` (perdona un carácter equivocado o uno salteado si lo que sigue coincide; lo registra como typo), `spaceSkipsWords = true`. En el hilo de HN de 2015 el consejo más votado era desactivar "stop cursor on error" porque el Backspace "acts like weird double-backspace" (HN 9578491) — es decir, el modo estricto confunde si no se explica.

**Feedback.** Teclado en pantalla con tecla siguiente, sonidos, indicador de tecla/dedo, heatmap de aciertos/errores en el perfil.

**Métricas.** Velocidad y precisión por lección, por tecla (tiempo, confianza, aciertos/errores), historial, racha de precisión, perfil público compartible.

**Hábito.** Objetivo diario, calendario, rachas, multiplayer de carreras, perfil.

**Contenido / español.** Diccionario y modelo fonético por idioma (español incluido). Sin frases; palabras sueltas.

**Usuarios.** Elogios: "targets your weak keys… forces you to practice those repeatedly" (HN 9577837); "I especially like the analytics, and the heatmap" (HN 9578182); "Keybr builds the muscle memory, monkey type is good for building speed" (r/typing 159emep); "I like the way it limits you to small groups of characters and won't let you progress until it detects a confidence level" (r/typing 1eunqii, kool-keys). Críticas: pseudo-palabras ("mindlessly typing… got boring"), "starts being useless after a certain speed", empezar con teclas fuera de la fila guía, "ruthless" con Q/X/B ("2 months of Q"), objetivo 35 WPM demasiado bajo, y "unlocking more letters while stuck felt counter-productive" (1i96zs9).

**Diferencial para TypeLight.** Umbral de velocidad por tecla explícito y configurable + estado "verde/rojo" por tecla + predicción de lecciones restantes. El "forgive errors" es una idea fina: en modo estricto, si tipeás una letra de más pero la siguiente es correcta, no te clava.

### 3.2 Monkeytype (profunda; OSS en github.com/monkeytypegame/monkeytype)

**Modelo.** No enseña: es un banco de pruebas. Modos tiempo (15/30/60/120/custom), palabras (10/25/50/100), quotes (short/medium/long/thicc), zen, custom. Listas por idioma y tamaño (english, 1k, 5k, 10k, 25k…; **spanish, spanish_1k, spanish_10k** — spanish_1k está basada en frecuencias del corpus de la RAE, corregida a mano), ~60–70 lenguajes de programación (`code_*`), quotes en español.

**Manejo del error (settings verbatim del clon estático vntype.web.app/settings).**
- Difficulty: "Normal is the classic type test experience. Expert fails the test if you submit (press space) an incorrect word. Master fails if you press a single incorrect key".
- Stop on error: "Letter mode will stop input when pressing any incorrect letters. Word mode will not allow you to continue to the next word until you correct all mistakes."
- Confidence mode: "you will not be able to go back to previous words to fix mistakes. When turned up to the max, you won't be able to backspace at all."
- Min WPM / Min accuracy / Min burst ("flex" baja el umbral para palabras largas): fallan el test automáticamente.
- Freedom mode (borrar palabras correctas), Strict space, Opposite shift mode ("force you to use opposite shift keys… incorrect one will count as an error"), Blind mode ("No errors… highlighted. Helps you to focus on raw speed"), Lazy mode (reemplaza tildes/diacríticos; hubo discusión #1937 sobre si la ñ debía quedar — se implementó en PR #1946 que la ñ se conserve porque es letra con tecla propia, no diacrítico).

**Feedback.** Caret suave (la comunidad lo señala como el detalle que hace que "se sienta bien"), keymap opcional (estático/reactivo/siguiente tecla), 16 sonidos de tecla + 4 de error, live WPM/progress, tape mode, hide extra letters, indicate typos.

**Métricas (definiciones).** WPM = caracteres de palabras correctas (incl. espacios) / 5 normalizado a 60 s; raw = igual pero incluyendo palabras incorrectas; acc = % de teclas correctas; char = correctas/incorrectas/extra/faltantes; **consistency** = coeficiente de variación del raw WPM mapeado a 0–100; **burst** = raw de una sola palabra. Gráfico WPM/raw/errores por segundo, heatmap de teclas, historial (límite ~1000 tests en cuenta gratis), PB por modo × duración × idioma × dificultad × puntuación × números, "practice missed words / slow words".

**Hábito.** XP por test con bonus diario y rachas, leaderboards diario (con XP) / semanal / all-time, tags, presets, challenges, Discord.

**Usuarios.** "Monkeytype is by far the best typing website to date… the way the website *feels*" (r/typing 1d6nq66, VanessaDoesVanNuys); lo decisivo son "the ability to customize the word selection and the test duration" (159emep, Gary_Internet). Críticas: "too much going on… doesn't feel user-friendly" (1d6nq66), sin guía ("reminds me of a Rubik's cube"), sin multiplayer ("tribe" congelado hace años), 1000 tests de historial, quieren "practice words I've had trouble with all time and not just from the test I just took", y una versión offline. Un artículo (TypingFastest) considera el quick restart "the single most common way people sabotage their own practice" y aconseja ocultar el WPM en vivo.

**Diferencial.** Definiciones limpias de consistencia y burst; presets; "stop on word" como término medio; sonidos de error.

### 3.3 TypingClub / edclub (profunda)

**Modelo.** Cursos lineales: Typing Jungle (**701 lecciones**), Typing Basics (100), cursos temáticos (sight words, ficción, Greek & Latin roots), Dvorak, una mano, y cursos en otros idiomas (español incluido — un usuario hispanohablante hizo el curso ES y el EN). Cada lección arranca con un video corto; hay "finger gym" de calentamiento y juegos intercalados en cada sección.

**Puntaje.** 1–5 estrellas por lección; "The scoring system is optimized to value accuracy over speed"; **puntaje perfecto ≈ 2,5× el WPM meta de la lección con precisión casi perfecta**; hay "platinum/blue stamps" por máximo puntaje. Mínimo de estrellas para avanzar (default 1; el docente puede subirlo y fijar precisión mínima).

**Error.** Backspace permitido, pero "there is a small penalty… if the error is made in the first place" y "a double-penalty in the score's accounting for every error". Para clases existe **"On-error behavior"**: el docente decide si el cursor frena al 1.º, 2.º o 3.º error, forzando corrección. Consejo de un docente (blog Dover DLC): ignorar el Backspace al principio porque corregir baja más el puntaje que dejar el typo.

**Feedback.** Manos y teclado en pantalla (se recomienda apagarlos cuando se pueda), sonidos "clicky", **replay en video del intento** para ver dónde te equivocaste.

**Hábito.** Estrellas, badges, certificados, dashboards, "daily practice logs".

**Usuarios.** Muy usado como puerta de entrada ("It starts from the basics", "explaining which fingers should press which keys" es lo único que hace mejor que keybr según Gary_Internet). Posts de logro tipo "Finished TypingClub with five stars on all the lessons". Quejas: "getting frustrated… due to getting mistakes several times and… slow progress (random word scrambles didn't help)" (1eunqii); "there's a required WPM to continue, and I can't reach that" (107779i); bug al registrarse que hace perder el progreso (1oio4hs); "cutesy animations and other time wasting stuff" (159emep). Dolor recurrente: el salto a mayúsculas/Shift hunde la precisión incluso en lecciones anteriores (1ix2ky6).

**Diferencial.** Replay del intento; on-error behavior graduable; puntaje que penaliza doble el error (aunque permita Backspace).

### 3.4 Typing.com (media)

Curso lineal (principiante/intermedio/avanzado) + "cross-curricular", ciudadanía digital, código (HTML/CSS/JS), alfabetización en IA, escritura creativa; tests de 1/3/5 min, certificados, badges, juegos (incluye ZType embebido). Interfaz y curso **en español** (typing.com/es), portugués, UK. Docente puede **desactivar el Backspace**; por default los errores quedan marcados y se sigue. Relato de 10 semanas (dev.to, nineismine): "Lack of enforcement for error correction… false sense of security", "Excessive drilling of isolated key patterns that don't reflect real typing", "Your brain is better at remembering… whole words". Misma empresa (Teaching.com) que Nitro Type. Gratis con ads; sin PII para alumnos.

### 3.5 Ratatype (media)

15 lecciones (fila guía 9 ej. → índices 19 → medio/anular 13 → meñiques 11 → repeticiones → criptogramas de vocales/alfabeto → combinaciones "th/er/in/ed" 17 → números y puntuación → Shift → frases/proverbios), hasta 25 ejercicios por lección, **no se puede saltear**. Por ejercicio: estrella (completado), diana (sin errores), rayo (velocidad). Backspace para corregir ("don't rely on looking at your hands"). Certificado por CPM: plata 200–250, oro 250–300, platino 300–350; tests de 1 a 5 min; 10 idiomas incl. español (España). Teclado coloreado por dedo, consejos de ergonomía (45–70 cm, codos, pausas). Clases con Google Classroom.

### 3.6 TypeRacer (media)

Carreras en vivo con texto real (libros, películas, canciones); se escribe palabra por palabra y **los errores se deben corregir antes de pasar a la siguiente palabra**; WPM en inglés y CPM en otros idiomas (50+). Skill levels para emparejar; "universos" temáticos (código, literatura, **Instant Death** donde "a single typo will kick you out of the race" — creado porque "the typing masters all agree that improving your accuracy is the best way to improve your WPM"). Premium. Comunidad: "realistic samples and pressure" pero "feels slippery… the website is ugly… you have to pay for a better experience" (1d6nq66). Guía intermedia de r/typing (hcy00y) basada en TypeRacer: leer palabras como chords, espaciar rápido, evitar pausas, leer adelante, saber cuándo frenar ("titanium").

### 3.7 Nitro Type (breve)

Carreras de autos donde "the speed [is] determined by the accuracy of the typed words"; cash y loot para autos/garage, equipos (requieren $50 000 y 50 carreras), temporadas que resetean a nivel 0, Nitro Gold $9,99/año (+20 % cash), dashboards docentes. Es el modelo "kids gamificado"; en r/typing se lo menciona como diversión, no como entrenamiento.

### 3.8 TypeLit.io y Entertrained (media)

TypeLit: tipear libros clásicos, niveles, importar textos propios con suscripción. **Entertrained** (Show HN 41205226, r/typing 1ef4nbx): 100 libros de dominio público/CC, modo tipear y modo leer, Shift+Enter saltea un párrafo, teclado opcional, personalización de fuentes/espaciado, estadísticas con gráficos, **sin cuenta: progreso en IndexedDB con export/import de "save"**, SolidJS. Los usuarios lo usan para resistencia ("40+ min typing part of a book to gain stamina"). También typersguild.com (subir tu propio epub). No hay libros en español destacados.

### 3.9 Ngram Type (media; github.com/ranelpadon/ngram-type)

Fuente: n-gramas más frecuentes del inglés (bigramas TH HE IN…, trigramas THE AND ING…, tetragramas, top 50/100/150/200 palabras; hay forks FR y DE; "Custom" acepta tu propia lista). Generador: `Combination` (cuántos n-gramas distintos por lección) × `Repetition` (cuántas veces se repite el patrón): "Combination=2, Repetition=3 → the and the and the and". Umbrales: "You could not proceed to next lesson unless you have met those minimum performance" (WPM y precisión), y el promedio "will be reset every round… so that old/historical averages will not affect the new ones". Sonido/color en error, timer automático, settings en el navegador. Consejo del autor: "If you always aim for 100% Accuracy at the expense of speed, eventually your speed will catch up". Usuario: "this site is brain training not finger training… After drilling ngrams for a few sessions, you go back to monkeytype, and magically you got faster" (1i96zs9). DreymaR (Colemak) lo recomienda y advierte que keybr "can produce unrealistic results for rare letters", mejor solo para la fila guía inicial.

### 3.10 TIPP10 (media; GPL, desktop + online)

20 lecciones; **"Intelligence"**: "The lesson texts react instantly to your typing mistakes by repeating mistyped letters more frequently" (a nivel de líneas). Parámetros de lección: duración por tiempo o por cantidad de caracteres; **"Block typing errors": "the dictation stops each time you make a typing error and waits for you to find the right key"**, alternativa "corrección con Backspace" (recomendada solo para avanzados por acercarse al mundo real), señal audible; asistencia: teclado virtual, teclas coloreadas, fila guía, **trayectorias de movimiento del dedo**, línea de separación izquierda/derecha, instrucción en la barra de estado; **metrónomo** en pulsos por minuto; ticker con velocidad de desplazamiento. Estadísticas por tecla y dedo. Layouts QWERTY/QWERTZ/Dvorak/NEO; traducción ES parcial. Queja HN (34503536): la versión online exige registro con mail de confirmación ("too high threshold").

### 3.11 Klavaro, KTouch, GNU Typist (breve)

- **Klavaro**: cuatro módulos — básico (secuencias aleatorias para memorizar posiciones, independiente de layout), adaptabilidad (todo el teclado, strings aleatorios), velocidad (texto en cualquier idioma), fluidez ("Spelling errors must be corrected before proceeding", énfasis en ritmo uniforme). Editor de layouts; gráficos; UI deliberadamente sin "gauges" para que el principiante no mire la pantalla.
- **KTouch**: cursos por layout con teclas que se van agregando; desbloqueo por **98 % de precisión y 180 CPM** por default (ajustable); teclado con tecla y dedo indicados; editor de cursos; estadísticas.
- **GNU Typist**: lecciones en archivos `.typ`; **máximo 3 % de error** por default para pasar (`--max-error`); usuarios se autoimponen "3 veces seguidas bajo 3 %".

### 3.12 AgileFingers (media)

Lecciones por dedo, textos, tests y 4 juegos (Rebellious Robot, Sheep Rescue, Word-jumper, Star Words); manos y teclado rediseñados; "**a typo lowers your score even after you erase it with Backspace**"; precisión mínima configurable (default 90 %); símbolos de animales según velocidad; gráfico de precisión reciente; clases para docentes; español y muchos layouts; gratis con pocos ads. Un usuario lo usaba "agilefingers + monkeytype" y lo cambió por keybr por la "tangible sense of progress by unlocking keys" (1pcw374).

### 3.13 Typesy y TypingMaster (breve)

- **Typesy**: suscripción $9/mes (family $67), 5000+ lecciones, videos de manos, adaptativo, sincronización en nube, avatares/juegos; reseñas lo llaman "el más completo de escritorio"; detalle de error handling **[no verificado]**.
- **TypingMaster** (Windows): ~10 h de curso adaptativo; **TypingMeter**: widget que "records your keystrokes, tracks and analyzes your writing patterns, and identifies the keys and words that repeatedly cause difficulties" en tu uso real de la computadora y sugiere drills; tests 1–60 min; "Custom Review". Esta idea (medir el tipeo real, no solo el del tutor) no la hace ninguna web.

### 3.14 10FastFingers, keyhero, TypeTest.io (breve)

- **10FF**: test de 1 min con top 200 (o 1000 en avanzado) palabras en 53+ idiomas (español incluido), WPM = keystrokes/5, keystrokes correctos/incorrectos, logros, competencias, multiplayer, custom test 10 s–10 min. Se lo critica por ser 302 palabras fijas.
- **keyhero** / **TypeTest.io**: tests con historial, leaderboard diario; TypeTest permite configurar "input on error" y lista de palabras.

### 3.15 Juegos: ZType, Epistory, Typing of the Dead, Textorcist (breve)

- **ZType** (phoboslab): naves = palabras; se "engancha" una nave por su inicial y cada letra dispara; Backspace deselecciona; Enter = EMP; oleadas crecientes; **texto propio** (URL/lista). Entrena reflejo por tecla y lectura de primera letra — es el pariente de "Globos de palabras".
- **Epistory**: aventura donde todo se hace tipeando; **dificultad dinámica** ("if you're typing words faster, it will make the words more difficult… takes a few deaths… to slow down to your level").
- **Typing of the Dead / Overkill**: arcade con dificultad fija; **Textorcist**: bullet hell + tipeo, muy difícil, sin adaptación.

### 3.16 Keyzen, typing.io, Amphetype, Typecelerate, TypeQuicker, Typing Bolt, KeyLearn (breve)

- **Keyzen** (código): palabras de 7 chars aleatorios de las teclas desbloqueadas; cada tecla lleva `in_a_row` (aciertos consecutivos), un error lo resetea a 0; se agrega tecla nueva cuando todas superan `consecutive = 5`; el error no interrumpe la palabra; orden qwerty `' jfkdlsahgyturieowpqbnvmcxz…'` y después símbolos. Pensado para programadores.
- **typing.io**: código real open source (JS, Ruby, C, C++, Java, PHP, Perl, Haskell, Scala); incluye símbolos y Backspace en la métrica ("unproductive keystrokes") para no inflar.
- **Amphetype**: importar libros (Gutenberg), estadísticas de WPM/precisión/**viscosidad** (lo contrario de fluidez: cuánto rompe el flujo cada tecla/trigrama/palabra), generador de lecciones desde palabras/trigramas lentos o fallados (copias × tamaño), umbrales recomendados "average −10 WPM, 99–100 % accuracy" para repetir. Nota de su comunidad: los mejores *no* son metronómicos — aceleran en palabras fáciles y frenan en difíciles.
- **Typecelerate** (post del autor, 1jadjwx): control de sub-grupos de listas (p. ej. "bottom 800 words of english-1k"), elegir si practicar debilidades de **precisión o de velocidad** y con qué patrón (letras, bigramas, trigramas, palabras, bordes de palabra, "spacegrams"), include/exclude con regex, "cuántos tests considerar para calcular debilidades", perfiles/presets, PB sin favorecer una lista, **excluir dedos/mano para descansar** ("hand health"), 12 temas, 8 idiomas.
- **TypeQuicker** (pago; post HN 44141636): manos ilustradas por un ilustrador, "TargetPractice" genera con un LLM frases naturales que contienen tus secuencias débiles; analíticas por secuencia/palabra. Su artículo: "it takes 10-15 minutes a day to see good results", "if… accuracy is less than 95%, slow down".
- **Typing Bolt**: "Bolt AI" adapta a teclas débiles, muestra dedo por letra, certificados, carreras; detalle **[no verificado]**.
- **KeyLearn** (AGPL, 2025): clon moderno de keybr con 41 idiomas y 116 layouts, modo adulto minimalista / modo niño con héroe y manos animadas, perfiles por hogar, importar datos desde keybr, 3 modos de test (Zen/Coach/Arcade), análisis de uso de teclas y bigramas del layout, diseñador de temas.

### 3.17 Otros cursos lineales: Typing Study, Sense-lang, Peter's, Dance Mat (breve)

- **Typing Study** (typingstudy.com): 15 lecciones (fila guía → e/i → … → puntuación → mayúsculas → números → todo), test, juegos, **teclado numérico**, muchos layouts incl. **español y latinoamericano**, gratis.
- **Sense-lang**: 16 lecciones de 2 caracteres al teclado completo + "mi texto", teclado animado y manos gráficas, juegos (Stairs, Typing Alien, Long Jump, Kayak), test con "errors distribution"; español; ads de Google.
- **Peter's Online Typing Course** (typing-lessons.org): 31 lecciones gratis y sin ads; **el error suena y no avanza**; criterio de dominio: "type three reloaded screens… in a row in under 60 seconds each, with no errors"; lemas: "Speed comes from certainty", "100% correct practice", ritmo constante, no mirar el teclado.
- **BBC Dance Mat Typing**: 4 niveles × 3 etapas con animales que narran; sigue online en HTML5 (el Flash murió en 2021); para chicos.

### 3.18 Oferta en español (fichas breves)

- **Mecanografia-online.com**: gratis (donaciones), en español; ejercicios por filas → textos → tests (alfabeto A–Z y test general); layouts QWERTY ES, QWERTY PT, QWERTZ, AZERTY, Dvorak, Colemak, Workman; videos; "comprueba tu progreso paso a paso". Sin adaptación ni juegos.
- **ARTypist** (artypist.com/es): 19 unidades "de la fila guía a las tildes, números y símbolos", cada una con explicación visual y ejercicios (la unidad 5 muestra 14); teclado en pantalla; test WPM/precisión con rankings; certificado "a tu nombre, imprimible y con un código que cualquiera puede verificar"; cuenta gratis guarda progreso; ES/EN/català/euskara/galego; versión escuelas; premium.
- **Velocidactil.es**: carreras estilo TypeRacer en español (y EN/FR/DE/IT/PT/CA/GL), textos legales para oposiciones, "modo noticias del día", textos propios públicos/privados, grupos, mensajes, sonidos, app Android, login con Facebook.
- **Mecanografia.com**: curso pago (~€75–80 licencia individual, prueba de un mes con garantía) para chicos de 7–13: 30 lecciones con el "Capitán Cuarenta", medallas, tesoros y juegos; "aprende de los errores del alumno y adapta los ejercicios a las letras problemáticas"; informes para padres tras cada lección; certificado; versión colegios.
- **Typing.com/es**: interfaz y currículo completos en español (mecanografía, interdisciplinaria, ciudadanía digital, programación, IA, escritura creativa); layouts ES/LatAm **[no verificado]**.
- **TypingClub**: curso en español (testimonio de usuario) con la misma mecánica de estrellas.
- **Ratatype**: curso "Spanish (Spain)". **AgileFingers**, **Sense-lang**, **Typing Study** (con layout latinoamericano), **10FastFingers**, **Monkeytype** (listas + quotes): soporte de español como idioma más.
- **Vedoque** (juegos infantiles en español, citado por Genbeta) **[no verificado en detalle]**.
- No encontré comunidad de usuarios hispanohablante activa sobre mecanografía en Reddit (búsquedas en r/argentina, r/askspain, etc. no devolvieron hilos útiles); lo que hay son listas de blogs (Genbeta, ADSLZone, InternetPasoAPaso). El único testimonio rico fue en r/typing (1io8gr6): nativo español, 90–100 WPM en ES vs 70–80 en EN, "practicing english helped me focus more on my accuracy", y la observación de la Ñ y el meñique derecho.

---

## 4. Patrones transversales

### Lo que hace toda plataforma buena
1. **Precisión antes que velocidad, con umbral explícito**: 98 % (KTouch, guías de r/typing), 97 % (GNU Typist 3 % error), 99–100 % para repetir (Amphetype), "100% correct practice" (Peter's). Todas lo *dicen*; pocas lo *hacen cumplir* como TypeLight.
2. **Una métrica por tecla y una lección que se arma sola desde ella** (keybr, TIPP10 Intelligence, Typing Bolt, TypingMaster, Typecelerate, KeyLearn). El desbloqueo progresivo con criterio numérico visible (keybr, Keyzen, KTouch) es lo que da "tangible sense of progress".
3. **Control del corpus**: tamaño de lista (200 → 1k → 10k), puntuación/mayúsculas como toggles, texto propio. Es el motivo principal por el que Monkeytype "gana" en r/typing.
4. **Control de la duración** (10 palabras / 15 s / 60 s / 2 min) y la recomendación de **alternar** bursts con resistencia.
5. **Sensación**: caret suave, sonidos de tecla y de error, tema oscuro. Se menciona una y otra vez.
6. **Teclado y manos en pantalla para principiantes, apagables** (TypingClub, TIPP10, AgileFingers, Ratatype, Sense-lang); y consenso de que no hay más "teoría" que el mapa dedo-tecla — "there is no typing website… that will teach you anything in addition to what is covered in that [94 s] video" (Gary_Internet).
7. **Post-test accionable**: palabras falladas/lentas para repetir (Monkeytype, Amphetype, TypingMaster, Typecelerate).
8. **Objetivo diario en minutos + calendario/racha** (keybr, Monkeytype XP, TypingClub logs).

### Lo que casi nadie hace (oportunidades)
1. **Explicar la debilidad**: nadie dice "sos lento en palabras dominadas por la mano derecha / fila inferior / mismo dedo consecutivo". Un usuario lo pidió con detalle (1d6nq66, UnhappyDescription50: describir cada palabra por "cualidades" — letras, trigramas, doble letra, mano dominante, dedo, fila — y ponderar las cualidades donde fallás).
2. **Modelar el idioma de verdad**: ñ, tildes con tecla muerta, ¿ ¡, layouts ES/LatAm. Monkeytype las *quita* (lazy mode); keybr/Typing.com las tratan como cualquier letra. Nadie mide la latencia de la tecla muerta.
3. **Frases reales cortas y coloquiales como unidad de práctica** (TypeLight ya lo tiene con OpenSubtitles + rioplatense). Las demás oscilan entre palabras sueltas (keybr, Monkeytype) y libros enteros (TypeLit).
4. **Ritmo**: solo TIPP10 (metrónomo) y Klavaro (fluidez) lo trabajan; TypeLight ya tiene "Al compás". Nadie mide "pausas" aunque la guía intermedia de r/typing dice que "pauses effect typing speed just as much as errors".
5. **Salud de la mano**: solo Typecelerate permite excluir dedos; en r/typing abundan posts de meñique, muñeca y RSI.
6. **Medir el tipeo real fuera del tutor** (solo TypingMaster, desktop). No es viable en web sin extensión, pero sí lo es "sesión libre con texto que pegás".
7. **Local-first honesto**: solo Entertrained (IndexedDB + export/import). Todos los demás dependen de cuenta.
8. **Juegos con propósito declarado**: los juegos de las plataformas edu son relleno; los de TypeLight tienen una habilidad objetivo cada uno. Vale mantenerlo y decirlo en la UI.

---

## 5. Qué dicen los usuarios (síntesis)

### Qué elogian
- keybr: "The smartest way…" se traduce en "it keeps punishing me with the keys I am the worst with… It is effective, but I hate it" (r/typing 1eunqii, 16 votos). "Keybr trains you. monkeytype for practice" (159emep).
- Monkeytype: sensación y personalización; "I only use Monkeytype for recording my results" (1d6nq66) — es el patrón de "una app para aprender, otra para medir".
- TypingClub: claridad de dedos, estrellas como meta ("go back and get platinum stars on all of them").
- Entertrained/TypeLit: resistencia y placer de leer.

### Qué critican / por qué abandonan
- Aburrimiento con palabras falsas o drills aislados ("mindlessly typing", "drills don't reflect real typing").
- Sentirse bloqueado: WPM mínimo para avanzar (TypingClub), teclas nuevas que aparecen cuando todavía estás en rojo (keybr), "2 months of Q".
- Pérdida de progreso (bug de registro en TypingClub; historial limitado en Monkeytype).
- Sobrecarga de settings sin guía (Monkeytype "Rubik's cube").
- Interfaz vieja / pagar por experiencia (TypeRacer); registro obligatorio (TIPP10 online).
- Dolor físico: meñiques (P ; /), muñeca, "hover" de palmas; dudas tipo "which finger for C" (dos hilos con 97 y 166 votos).
- La transición a Shift/mayúsculas y a puntuación/números arruina la precisión ganada.
- Frustración de "aprendí a tipear bien y bajé de 74 a 20 WPM" (1krzq02, 118 votos) — el valle de reaprendizaje dura ~1–2 semanas según varios relatos ("It took about 6 to 7 days… to forget the way I typed before", 1f166fj).

### Combinaciones que usan
- "TypingClub → keybr (green on all letters) → monkeytype" (159emep, AlienFeverr). "monkeytype - raw speed. typeracer - realistic samples and pressure. keybr - improving weaknesses. I use all 3" (1n25hze, funbike). "Typelit for endurance, keybr for random letters, Monkeytype main, TypeRacer for fun" (1n25hze, KenKenkiota). HN: "Typing Club for beginners, then Keybr for fluency, then Monkeytype for speed" (46722734).

### Sobre "parar en el error" vs Backspace
- "When building accuracy - **yes**. When focusing on rhythm and speed - **no**… at high levels of typing, it honestly slows down execution" (1kuzstx, VanessaDoesVanNuys).
- "I always ctrl backspace… and retype the word" (1kuzstx); "A website that automatically backspaces the whole word if I typed any wrong alphabet" (1d6nq66) — la idea de *rehacer la palabra entera* aparece varias veces (también en Amphetype).
- "accuracy constraints should be a default setting that nobody can disable" (159emep, Gary_Internet).
- Evidencia: Dhakal et al. (CHI 2018, 136 M keystrokes): "Faster typists make generally less errors"; los pares de letras alternando manos/dedos predicen más la velocidad que las repeticiones; rollover frecuente en rápidos. Feit et al. (CHI 2016, "How We Type"): lo que distingue a los rápidos es "a letter is consistently pressed by the same finger", manos quietas y "active preparation of upcoming keystrokes"; con 5 dedos se puede ser tan rápido como con 10. La literatura de motor learning es ambigua sobre bloquear vs. permitir errores (hay teorías de "desirable difficulties"); no encontré un estudio específico que compare stop-on-error vs Backspace en tutores de tipeo.

### Sobre mesetas ("stuck at X wpm")
- "Can't get past 60-65 wpm… 95-100% accuracy… 25 words all lower case" (1uf5b59): respuesta típica: precisión real, listas más grandes, tests más largos, stop on word, no reiniciar a mitad.
- "That's not your actual speed. It's literally 'words per minute'. You have to type a whole minute" (1rb4dlg).
- "Cherry picking the average of your best speeds from a 15 second test with all lower case letters is not your actual typing speed" (1oth67l, 56 votos).
- Rutinas: "Do 10w training then try and do that on 15s… 2 min tests… e10k… Focus accuracy sometimes and pushing the limits sometimes" (1kuzstx, FakerMS); ngram drills (1i96zs9); "slowing down and focusing on form… builds smoothness which in turn builds speed" (1rb4dlg).
- Contrapunto honesto: "The idea that everyone can type 90+ WPM with practice is false" (1i8yots, fizbin, décadas en 50–60).

### Wishlist explícita (1d6nq66 "What would you like to see in a typing website?")
Versión offline; multiplayer con buena UI; practicar palabras problemáticas de *todo el historial*; más de 1000 tests de historial; detección de debilidades por "cualidades" de palabra y lecciones que no contaminen la métrica promedio; auto-borrar la palabra entera al errar; lenguajes de programación específicos; una guía moderna integrada.

---

## 6. Features candidatas para TypeLight

Criterios de encaje: (R) rutina diaria, (E) parar en el error, (M) métricas no engañables, (L) local sin backend.

| # | Feature | Quién la hace bien | Encaje con TypeLight | Esfuerzo |
|---|---|---|---|---|
| 1 | **Confianza por tecla con objetivo configurable** (`confianza = tiempoObjetivo / EMA`, estado verde/amarillo/rojo, objetivo default ~35 WPM ajustable 15–150) | keybr | Encaja: formaliza el repaso adaptativo actual y da "tangible sense of progress". Mostrar en Dominio por tecla. (R)(M) | M |
| 2 | **Predicción "te faltan ~N rutinas para el objetivo"** (regresión sobre últimas 30 sesiones de referencia, solo si R² ≥ 0,5) | keybr | Encaja; motivador barato. Ojo con mostrarla solo con datos suficientes. (R)(M) | S |
| 3 | **Drills de n-gramas en español** (bigramas/trigramas top 50/100/200 del corpus propio; combinación × repetición; umbral de precisión 100 % por parar-en-error y WPM mínimo) | Ngram Type, Amphetype, Typecelerate | Encaja perfecto como tipo de lección `ngram` en unidades "velocidad/patrones" y en calentamiento. (R)(E) | M |
| 4 | **Palabras problemáticas históricas + "practicar falladas/lentas" tras el reto** (lista por palabra con latencia media y errores, botón para drill) | Monkeytype, Amphetype, TypingMaster | Encaja; TypeLight ya loguea por tecla, falta por palabra. Los drills no cuentan como referencia. (M) | M |
| 5 | **"Cualidades" de palabra para explicar debilidades** (mano dominante, fila, dedo, mismo-dedo consecutivo, doble letra, tecla muerta) y ranking de qué cualidad te frena | Nadie (pedido en r/typing) | Encaja y es diferencial. Base para elegir repaso y para el texto de la mascota ("hoy la fila inferior te cuesta"). (R)(M) | M/L |
| 6 | **Consistencia y burst en el reto** (CV del raw por segundo → 0–100; burst = mejor palabra; pausas > 500 ms contadas) | Monkeytype, Amphetype (viscosidad) | Encaja; suma a Progreso "ritmo". (M) | S |
| 7 | **Exportar/importar progreso (JSON) + PWA instalable/offline** | Entertrained (IndexedDB + save), pedido en r/typing | Encaja: mitiga el riesgo de perder localStorage. (L) | S (export) / M (PWA) |
| 8 | **Textos largos en español de dominio público** (modo "leer tipeando": Quiroga, Martín Fierro, Gutenberg ES; saltear párrafo; progreso por capítulo) | TypeLit, Entertrained | Encaja como práctica de resistencia post-rutina, no como referencia (o sí, mediana por día de tramos ≥1 min). Parar-en-error en libro puede frustrar: ofrecer "stop on word" solo acá. (R) | L |
| 9 | **Muerte súbita como juego/reto** (un error termina; puntaje = caracteres correctos) | TypeRacer Instant Death, Monkeytype master | Encaja con (E); juego 5 barato con estrellas por longitud. | S |
| 10 | **Racha de precisión** (mayor cantidad de caracteres seguidos sin error, histórica y del día) | keybr | Encaja; es la métrica natural de un sistema sin Backspace. (E)(M) | S |
| 11 | **Replay del intento** (reproducir keystrokes con tiempos, ver dónde frenaste) | TypingClub | Encaja; útil para ver pausas. Guardar solo el último reto. | M |
| 12 | **Metrónomo/ticker opcional en lecciones `practice`** (pulsos por minuto = objetivo −10 %) | TIPP10, Klavaro | Encaja; extiende "Al compás" a la ruta. | S |
| 13 | **Ajustes de dificultad mínimos**: objetivo de velocidad, precisión mínima para 3 estrellas, largo del reto (1/2 min), "modo blind" en Jugar | keybr, AgileFingers, Monkeytype | Encaja si son pocos y explicados; evitar el "Rubik's cube". | S |
| 14 | **Hand health: excluir un dedo/mano en Jugar** (y aviso de descanso por minutos seguidos) | Typecelerate | Encaja bien con manos guía anatómicas. | S/M |
| 15 | **Métricas de tecla muerta y ñ** (latencia de tilde = tiempo desde la tecla muerta hasta la vocal; error de "tilde suelta") | Nadie | Diferencial ES; encaja con layouts ES/LatAm. | M |
| 16 | **Sello "velocidad honesta"** en Progreso: explicar por qué solo cuentan reto/textos/carrera, mediana por día, y comparar con "tu mejor 15 s" | Consenso r/typing; Monkeytype PB por modo | Encaja; puro copy + UI. (M) | S |
| 17 | **Onboarding de 90 segundos** (mapa dedo-tecla, postura, "no mires", qué es parar-en-error y por qué) | TypingClub videos, Gary_Internet | Encaja; reduce el rechazo inicial al modo estricto. | S |
| 18 | **Certificado/hito local** por niveles CPM (bronce/plata/oro/platino) con los criterios honestos del punto 16 | Ratatype, ARTypist | Encaja como badge; sin verificación externa. | S |
| 19 | **"Forgive errors" a lo keybr** (si tipeás una letra de más pero la siguiente es la correcta, se perdona y se cuenta como error sin frenar) | keybr | Dudoso: rompe la promesa "repetición 100 % correcta". Solo si se registra como error y no en sesiones de referencia. | S |
| 20 | **Stop-on-word (retipear la palabra entera al errar)** como modo alternativo en Jugar/libros | Monkeytype, Amphetype, pedido en r/typing | Encaja parcialmente: mantiene "sin Backspace" (se borra sola la palabra) y da flujo en textos largos. No en la rutina. | M |
| 21 | **Frases generadas para tus secuencias débiles** | TypeQuicker (LLM) | Sin backend no hay LLM; alternativa: buscar en el corpus frases que contengan tus bigramas débiles (índice invertido precomputado). | M |
| 22 | **Teclado numérico y símbolos de código** | Typing Study, typing.io, Keyzen | Encaja como unidades opcionales al final de la ruta; símbolos varían mucho entre ES/LatAm/US. | M |
| 23 | **Temporadas / ligas / carreras en vivo** | Nitro Type, TypeRacer | No encaja (L). Sustituto: "fantasma semanal" (tu mejor de la semana pasada) y récords por modo. | S (sustituto) |
| 24 | **Medir tipeo real fuera de la app** | TypingMaster | No encaja en web. Sustituto: "texto propio" (pegar un mail y tipearlo) sin contar como referencia. | S |

Prioridad sugerida (impacto × esfuerzo): 7 → 16 → 3 → 4 → 1 → 6 → 10 → 9 → 5 → 8.

---

## 7. Fuentes consultadas

Código y documentación oficial
- keybr (repo): https://github.com/aradzie/keybr.com — archivos leídos: `packages/keybr-lesson/lib/guided.ts`, `key.ts`, `target.ts`, `settings.ts`, `learningrate.ts`, `dailygoal.ts`; `packages/keybr-result/lib/keystats.ts`; `packages/keybr-textinput/lib/settings.ts`, `textinput.ts`; `packages/keybr-phonetic-model/lib/phoneticmodel.ts`
- keybr help: https://www.keybr.com/help
- Monkeytype settings (clon estático con textos originales): https://vntype.web.app/settings ; features overview: https://mintlify.wiki/monkeytypegame/monkeytype/features ; repo: https://github.com/monkeytypegame/monkeytype ; lista spanish_1k: https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/static/languages/spanish_1k.json ; discusión ñ en lazy mode: https://github.com/monkeytypegame/monkeytype/discussions/1937 ; min burst: https://github.com/monkeytypegame/monkeytype/discussions/1564
- Monkeytype settings que suben WPM (TypingFastest): https://typingfastest.com/blog/monkeytype-settings-that-raise-your-wpm
- TypingClub: https://www.typingclub.com/ ; docs de estrellas mínimas: https://m.typingclub.com/docs/class-management/class-settings/minimum-star-requirement.html ; on-error behavior: https://m.typingclub.com/docs/class-management/class-settings/on-error-behavior.html ; badges: https://s.typingclub.com/docs/reports/badges.html ; PDF "how is speed calculated": https://static.typingclub.com/m//edclubdocs/media/pdf/how-is-speed-calculated.pdf ; reseña 2026: https://sloah.com/blog/2026/09/typingclub-edclub-review ; Educators Technology: https://www.educatorstechnology.com/2023/01/typingclub-learn-touch-typing-through.html ; tips docente: https://doverdlc.blogspot.com/2016/03/typing-club-tips.html
- Typing.com: https://www.typing.com/ ; https://www.typing.com/es ; soporte: https://www.typing.com/support
- Ratatype: https://www.ratatype.com/learn/ ; certificado: https://www.ratatype.com/typing-certificate/ ; currículo: https://www.ratatype.com/faq/Ratatype-Curriculum/
- TypeRacer blog "Accuracy Matters": https://blog.typeracer.com/2010/03/29/accuracy-matters/ ; skill levels: https://typeracer.fandom.com/wiki/Skill_Levels
- Nitro Type (Educators Technology): https://www.educatorstechnology.com/2022/12/nitro-type-learn-typing-through.html ; wiki: https://nitro.fandom.com/wiki/Seasons
- TypeLit: https://www.typelit.io/ ; Entertrained: https://entertrained.app/ ; Show HN: https://news.ycombinator.com/item?id=41205226 ; reseña: https://ellanew.com/2024/08/31/touch-typing-classic-books
- Ngram Type: https://github.com/ranelpadon/ngram-type ; https://ranelpadon.github.io/ngram-type/
- DreymaR (Colemak) training: https://dreymar.colemak.org/training.html
- TIPP10: https://www.tipp10.com/en/index/ ; parámetros de lección: https://online.tipp10.com/doc/html/en/content/parameters.html ; settings: https://online.tipp10.com/doc/html/en/content/settings.html
- Klavaro: https://klavaro.sourceforge.io/en/index.html
- KTouch: https://apps.kde.org/ktouch/ ; handbook: https://docs.kde.org/trunk5/en/ktouch/ktouch/ktouch.pdf
- GNU Typist: https://www.gnu.org/software/gtypist/doc/gtypist.html ; https://colemak.com/GNU_Typist
- AgileFingers: https://agilefingers.com/
- Typesy (reseñas): https://www.speedreadinglounge.com/typesy-review ; https://typiq-app.com/en/blog/best-typing-software-2026.html ; https://www.speedreadinglounge.com/typing-software-review
- TypingMaster: https://www.typingmaster.com/typing-tutor/
- 10FastFingers: https://10fastfingers.com/typing-test/english
- ZType: https://zty.pe/ ; https://en.wikipedia.org/wiki/Z-Type
- Keyzen (código): https://raw.githubusercontent.com/wwwtyro/keyzen/master/keyzen.js ; fork Colemak-DH: https://github.com/ranelpadon/keyzen-colemak-dh
- typing.io: https://typing.io/
- Amphetype: https://github.com/alexjj/amphetype ; https://github.com/ralismark/amphetype ; metodología: https://forum.colemak.com/topic/2201-training-with-amphetype/
- Typecelerate: https://www.typecelerate.com/ (features según post del autor en r/typing 1jadjwx)
- TypeQuicker: https://www.typequicker.com/blog/learn-touch-typing
- Typing Bolt: https://www.typingbolt.com/ ; reseñas: https://aitoptools.com/tool/typing-bolt-%E2%9A%A1/
- KeyLearn: https://github.com/abhijathk/KeyLearn
- Typing Study: https://www.typingstudy.com/
- Sense-lang: http://sense-lang.org/typing/tutor/keyboarding.php?lang=es
- Peter's Online Typing Course: https://www.typing-lessons.org/
- Dance Mat Typing (guías): https://www.dancemattypingguide.com/ ; https://typinggameskids.com/blog/dance-mat-typing-alternatives/
- TypeTest.io: https://typetest.io/ ; keyhero: https://keyhero.com/practice-typing/different-typing-sites/
- Epistory / Typing of the Dead / Textorcist: https://www.gamespew.com/2024/09/best-typing-games-on-steam/ ; https://www.gamingscan.com/best-typing-games/
- Awesome keyboard typing list: https://github.com/osufiles/Awesome-keyboard-typing

Español
- Mecanografía Online: https://www.mecanografia-online.com/
- ARTypist: https://www.artypist.com/es/
- Velocidactil: https://www.velocidactil.es/
- Mecanografia.com: https://www.mecanografia.com/
- Genbeta "Las mejores webs para aprender mecanografía": https://www.genbeta.com/web/mejores-webs-para-aprender-mecanografia
- Otras listas: https://www.adslzone.net/listas/mejores-webs/aprender-mecanografia/ ; https://internetpasoapaso.com/mejores-paginas-webs-aprender-mecanografia/

Comunidad (Hacker News, vía API Algolia)
- "Improve your touch typing" (keybr, 413 pts): https://news.ycombinator.com/item?id=9577799
- "Learn touch typing – it's worth it" (2025): https://news.ycombinator.com/item?id=44141636
- "TIPP10 – Free Touch Typing Tutor": https://news.ycombinator.com/item?id=34501655
- Comentarios citados: 9577837, 9578182, 9578491, 9578236, 9579069, 9578859, 44142624, 46722734, 32830017, 34503536, 44142461, 44142724

Comunidad (Reddit r/typing, scrapeado 2026-09-17)
- Keybr is hands down the best website…: https://www.reddit.com/r/typing/comments/1eunqii/
- Monkeytype or Keybr? POLL: https://www.reddit.com/r/typing/comments/159emep/
- Most effective practice routines: to "stop on word" or not?: https://www.reddit.com/r/typing/comments/1kuzstx/
- What would you like to see in a typing website?: https://www.reddit.com/r/typing/comments/1d6nq66/
- Keybr is the only solution: https://www.reddit.com/r/typing/comments/1pcw374/
- My experience with keybr: https://www.reddit.com/r/typing/comments/1i96zs9/
- Which website helped you most?: https://www.reddit.com/r/typing/comments/1n25hze/
- Feeling stuck at about 60-70 wpm: https://www.reddit.com/r/typing/comments/1i8yots/
- Can't get past 60-65 wpm: https://www.reddit.com/r/typing/comments/1uf5b59/
- How to get faster typing speed?: https://www.reddit.com/r/typing/comments/1rb4dlg/
- Guide to Intermediate Typing: https://www.reddit.com/r/typing/comments/hcy00y/
- Want to get faster? … Check here first!: https://www.reddit.com/r/typing/comments/ujht2z/
- Cherry picking… 15 second test… is not your actual typing speed: https://www.reddit.com/r/typing/comments/1oth67l/
- 896 trigrams in 200 words: https://www.reddit.com/r/typing/comments/172umsd/
- Gary Internet's Monkeytype Guide: https://www.reddit.com/r/typing/comments/sioz2o/
- Typecelerate (post del autor): https://www.reddit.com/r/typing/comments/1jadjwx/
- Entertrained (post del autor): https://www.reddit.com/r/typing/comments/1ef4nbx/
- Yes, learn to Touch Type (reaprender de 7 a 10 dedos): https://www.reddit.com/r/typing/comments/1f166fj/
- Multilingual typists (nativo español, Ñ y meñique): https://www.reddit.com/r/typing/comments/1io8gr6/
- Learned how to actually touch type and went from 74 wpm to 20: https://www.reddit.com/r/typing/comments/1krzq02/
- Feel like I've hit my first major bump (Shift): https://www.reddit.com/r/typing/comments/1ix2ky6/
- Which finger do you use to press the C key: https://www.reddit.com/r/typing/comments/1moe4zf/
- Otros citados: 1o2v3aq, 1oio4hs, 107779i, 1p5v2yc, vh945d, 1n8asge, 1i97ak3, 1biz4bh, ot1mkz, 1mhcb7n, 1qzezpu (r/MechanicalKeyboards "Top 3 typing sites")

Investigación
- Dhakal, Feit, Kristensson, Oulasvirta (CHI 2018) "Observations on Typing from 136 Million Keystrokes": https://userinterfaces.aalto.fi/136Mkeystrokes/
- Feit, Weir, Oulasvirta (CHI 2016) "How We Type": https://userinterfaces.aalto.fi/how-we-type/
- Pinet & Nozari (2020, J. Memory and Language) "The role of visual feedback in detecting and correcting typing errors: A signal detection approach" (autoría según mi recuerdo; el fetch solo devolvió el título): https://www.sciencedirect.com/science/article/abs/pii/S0749596X20301078
- Relato de 10 semanas (dev.to): https://dev.to/nineismine/what-i-learned-in-10-weeks-of-trying-to-teach-myself-how-to-touch-type-c51

Notas de método
- Reddit bloquea el fetch directo; usé Apify (harshmaur/reddit-scraper) para posts y comentarios de r/typing. Los hilos de subreddits hispanohablantes no arrojaron discusión útil sobre mecanografía.
- Las páginas de ayuda de edclub/TypingClub y varias landings (Typesy, Typing Bolt, Typecelerate, Nitro Type) son SPA que no devuelven texto; sus datos vienen de snippets de buscador, posts de los autores o reseñas, y están marcados como [no verificado] cuando no pude confirmarlos.
