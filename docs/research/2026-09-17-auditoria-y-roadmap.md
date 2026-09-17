# TypeLight — auditoría, investigación y roadmap

Fecha: 2026-09-17 · sobre `master` en `0dbfb42` · autora: Clara (Opus 5), a pedido de Seba ("no hay nada en el backlog, quiero ideas para que sea la mejor app para aprender mecanografía").

Qué se hizo: lectura del handoff, memorias, specs y planes; auditoría del motor y de las rutas (`src/engine/**`, `src/app/**`); la app corriendo en `:5173` con progreso sembrado en un navegador aparte; tres investigaciones en paralelo con fuentes verificadas (plataformas competidoras, ciencia del aprendizaje motor, diseño de hábito), que quedan como anexos:

- [Anexo A · Plataformas](2026-09-17-anexo-plataformas.md) — 24 plataformas, código de keybr y Monkeytype leído, r/typing y HN, oferta en español, 24 features candidatas.
- [Anexo B · Ciencia del aprendizaje](2026-09-17-anexo-aprendizaje.md) — 81 referencias con DOI y estado de verificación; tabla "decisión actual vs. evidencia".
- [Anexo C · Hábito y engagement](2026-09-17-anexo-habito.md) — 65 fuentes con nivel de evidencia; Duolingo en detalle; top 10 para los días 30/60/90.

Nada de esto toca `docs/backlog.md`: los pendientes se acuerdan con Seba después de leer esto.

---

## 0. Posición

**TypeLight ya es una buena app de mecanografía. No es todavía la mejor app para que *vos* pases de mirar el teclado a tipear al tacto y sigas practicando en la semana tres.** Esa es la pregunta que importa, y reencuadra todo lo que sigue: "la mejor app" en abstracto pide multijugador, cuentas, certificados y deploy; "la mejor app para tu conversión" pide cinco cosas concretas, casi todas más baratas.

1. **Proteger lo que ya hay.** Todo el progreso vive en el `localStorage` de un perfil de Chrome, sin exportar ni importar. Es la única pérdida irreversible posible en la app y cuesta una tarde arreglarla. Va primero, sin discusión.
2. **Contenido.** Hay 85 frases. Ninguna se puede tipear antes de Mayúsculas (60 % de la ruta), 21 hasta Tildes. El Reto —la métrica "honesta"— hoy es palabras sueltas la mayor parte del camino y después recicla las mismas frases. El corpus es el cuello de botella de la velocidad de referencia, de la Carrera, de los Globos y del aburrimiento.
3. **El aprendiz es un converso, no un principiante.** *(Corregido el 2026-09-17 con el dato de Seba: ya tipeaba sin mirar, pero con los dedos mal — sin volver a la fila guía, casi sin meñique, poco anular. Ver §10.)* La evidencia más importante que encontré (Logan, Ulrich & Lindsey 2016; Feit 2016; Yechiam 2003) dice que el tipista no estándar no aprende teclas: *desaprende un mapeo* automático que a corto plazo le rinde más. Bajo presión de velocidad vuelven los dedos viejos, porque los dedos viejos pagan hoy. El antídoto es que el mapeo nuevo pague: velocidad objetivo baja al principio, dedos flojos visibles en Progreso, y una vara explícita —tu velocidad de antes— que el mapeo nuevo tiene que superar. El Reto, además, hoy se mide *con la próxima tecla resaltada en pantalla*: es velocidad asistida.
4. **Tres métricas que faltan y una que está mal.** Faltan rollover (el predictor de velocidad más fuerte conocido, r = 0,73 en 168.000 personas), velocidad a ciegas y dominio por bigrama. "Ritmo parejo" mide isocronía global, y los expertos no son isócronos: son consistentes *por bigrama*.
5. **La capa de hábito es fina justo donde se rompe.** Hay racha, calendario y rutina, pero no hay ancla ("después de X, practico"), ni perdón de un día, ni resumen semanal, ni récords honestos, ni aviso de que las primeras semanas vas a ser *más lento* que antes. Con la métrica anti-inflado que vos mismo pediste, ese bajón sin aviso parece castigo.

Dos partes de mí empujaban distinto y lo digo porque la decisión es tuya: una quería ir directo al modelo de habilidad v2 (bigramas, olvido, rollover) porque es lo que compone a largo plazo; otra frenó: el modelo v2 solo paga si en el mes dos seguís practicando, y eso depende de contenido y hábito, no de un algoritmo mejor. Gana la segunda en el orden, no en el fondo: **proteger → contenido → converso → hábito → modelo v2**. Todo lo estructural queda dentro del mes; nada requiere backend.

Lo que **no** haría, aunque lo hagan todos: ligas, corazones, XP, gemas, cuentas, notificaciones de culpa, y volver a dibujar manos. Los anexos explican por qué cada una resta.

---

## 1. Fortalezas (lo que ya está bien y hay que cuidar)

Verificadas en código, en pantalla y contra la investigación.

| Fortaleza | Por qué importa | Quién más lo hace |
|---|---|---|
| **Consciente del layout de verdad** (US / ES / LATAM con teclas muertas y AltGr; `resolveChar` devuelve la secuencia física; la unidad Tildes solo existe en teclados en español) | Ninguna plataforma global modela la ñ, las tildes con tecla muerta ni ES vs. LatAm; Monkeytype directamente *quita* las tildes ("lazy mode"). Es el diferencial más claro de la app. | Nadie |
| **Parar en el error, sin Backspace** | Es el default de keybr (`stopOnError = true`), de TIPP10 ("Block typing errors"), de Peter's y del "Instant Death" de TypeRacer. La evidencia (Anexo B §3.5) dice que no daña y que garantiza repeticiones correctas del mapeo nuevo. Además hace que la precisión sea de facto "al primer intento" (los errores cuentan como pulsaciones), que es la que importa. | keybr, TIPP10 |
| **Rutina diaria corta de cuatro bloques** | Baddeley & Longman 1978 (1 h/día > 2 h × 2/día), Walker 2002 (dormir da +20 % velocidad), práctica distribuida. Es la decisión estructural más respaldada de toda la app. | keybr (objetivo diario), nadie con esa forma |
| **Métricas anti-inflado** (referencia solo de Retos/Textos/Carreras, mediana diaria, precisión ponderada por caracteres, nada se mueve con un drill fácil) | Coincide con Soderstrom & Bjork 2015 (rendimiento ≠ aprendizaje) y con el consenso de r/typing ("15 s en minúsculas no es tu velocidad"). Falta *decirlo* en la UI como sello. | Monkeytype (PB por modo), nadie con mediana diaria |
| **Motor puro y testeado** (`src/engine`, 81 unitarios, 10 e2e, build verde; frontera engine/UI limpia) | Todo lo de este documento se puede implementar sin tocar la UI hasta el final. | — |
| **Captura por `<input>` oculto** | Las teclas muertas componen como en cualquier campo; ningún juego web en español lo hace bien. | — |
| **Currículo explicable** (cada tecla con dedo, movimiento y fila generados desde el layout; teclado + manos reales) | Es lo único que TypingClub hace mejor que keybr según su propia comunidad. | TypingClub |
| **Cuatro juegos con propósito declarado** (reflejo, cadencia, palabras, velocidad sostenida) | Los juegos de las plataformas edu son relleno; los de TypeLight entrenan algo cada uno. Y dos de ellos (Lluvia, Globos) son sin querer la intervención anti-melioration de Yechiam 2003: obligan a mirar la pantalla. | ZType (pariente de Globos) |
| **"Jugar" solo con la rutina completa** | Es *temptation bundling* (Milkman 2014, RCT). Bien puesto. | — |
| **Estética coherente y aprobada** (keycaps retro, Gabarito + Lexend, tema oscuro, grano, sonido con try/catch) | La comunidad repite que "cómo se siente" es lo que retiene en Monkeytype. | Monkeytype |
| **Corpus de palabras filtrado** (6000, OpenSubtitles contra diccionario + blocklist) y frases rioplatenses a mano | Calidad alta; la cantidad es el problema (ver §2). La variedad de `wordsText` es buena: 76 palabras únicas en 80 con pool completo (verificado). | Monkeytype `spanish_1k` |

---

## 2. Debilidades estructurales

Ordenadas por cuánto pesan en "convertirte y que sigas".

### 2.1 El progreso no tiene copia (riesgo irreversible)
`typelight.v1` en `localStorage`, sin exportar/importar. Borrar datos del sitio, un perfil nuevo de Chrome, otra máquina o un `resetProgress` por error = meses perdidos. Solo Entertrained (IndexedDB + export/import JSON) lo resuelve entre todas las plataformas locales; los usuarios lo piden explícitamente. Además usás el dev server (`:5173` desde el `.bat`) como app diaria: cada edición en una rama te resetea la lección por HMR.

### 2.2 El corpus de frases es el cuello de botella
`src/engine/corpus/sentences.ts`: 85 frases generales (largo medio 61). Cobertura calculada por etapa de la ruta LATAM:

| Pool | Frases tipeables | Consecuencia |
|---|---|---|
| alfabeto + `,` `.` (sin mayúsculas) | **0 de 85** | Reto y Carrera = palabras sueltas hasta Mayúsculas (~60 % de la ruta). "Un minuto de texto real" no es real. |
| + mayúsculas | **21** | Un Reto arma ~420 chars ≈ 7 frases → rota el corpus completo cada 3 Retos. Memorización. |
| + tildes | 71 | En 30 días cada frase se vio ~3 veces. |
| + signos | 85 | — |

Encima, el Reto llama `sentencesText(pool, 2)` en loop y cada llamada rebaraja: **más de la mitad de los Retos repiten una frase dentro del mismo minuto** (`src/app/routes/Practice.tsx:93`). Y la velocidad de referencia compara Retos de pseudopalabras (etapas tempranas) con Retos de frases con mayúsculas, tildes y signos (etapas tardías): la curva puede bajar cuando llegan teclas nuevas y las "marcas de unidad" lo explican pero no lo corrigen.

### 2.3 La app trata a un converso como principiante
Vos ya conocés el layout. La ruta "fila guía → superior → inferior" es la tradición de Dvorak 1936 para gente que no sabe dónde está la `e`. Para vos el trabajo es otro: bajar la entropía del mapeo dedo→tecla (Feit 2016: es el predictor #1 de velocidad en autodidactas) y dejar de mirar (los de tacto miran 20 % del tiempo, los autodidactas 41 %). No hace falta rehacer la ruta —te gustó la progresividad y ya la estás caminando—, pero sí hace falta: un onboarding que anuncie el bajón ("2–3 semanas más lento que antes, es esperado"), un Reto a ciegas que mida lo que de verdad querés, y que los juegos de reflejo estén *dentro* de la rutina y no solo de regalo.

### 2.4 Manos guía y teclado durante el ejercicio: foco interno — matizado por el punto de partida de Seba
Logan & Crump 2009, Tapp & Logan 2011 y el meta-análisis de Chua 2021 convergen: dirigir la atención a los dedos degrada el tipeo *hábil*; el foco externo (la tecla, la letra) gana en todos los niveles. Pero el problema de Seba no es "qué tecla" sino **"qué dedo"** (§10): el mapeo dedo→tecla es justamente lo que tiene que reconstruir, y la señal de dedo es la única que la app puede darle sobre eso. Entonces: las manos se quedan **mientras la tecla no está dominada** (intro, `keys`, `review`, `practice` y Repaso, desvanecidas por tecla a medida que sube el dominio), y se van del **Reto**, que mide transferencia sin ayuda. Hoy `showHands` es un toggle global y el Reto muestra teclado + próxima tecla resaltada.

### 2.5 Modelo de habilidad: por tecla, sin olvido, ruidoso en teclas raras
- `updateKeyStats` (`src/engine/stats/index.ts:12-31`): EMA con α = 0,25 **sin ponderar por cantidad de muestras**. Una sesión donde la `x` aparece una vez y falla → `errorEma` salta 0,25 → hacen falta ~8 sesiones limpias para volver al umbral de "dominada" (≤ 0,03). Para ñ, ü, q, w, símbolos, es ruido puro.
- `mastery` (`src/engine/stats/progress.ts`) **no decae**: una tecla dominada hace un mes y no vista desde entonces sigue dominada. No hay término de olvido ni "hace cuánto no la ves"; el Repaso siempre elige las 3 más flojas por EMA y nunca trae de vuelta las raras.
- Todo es **por tecla**. Dhakal 2018: los pares alternancia-de-manos / mismo-dedo discriminan lento de rápido con r ≈ −0,7; las repeticiones de letra, −0,32. El bigrama es la unidad que predice velocidad y la app no lo conoce.
- La latencia de la primera letra de cada palabra incluye la pausa de leerla; penaliza a `q`, `p`, `d` (inicios frecuentes). keybr tiene el mismo sesgo.

### 2.6 "Ritmo parejo" mide lo que los expertos no hacen
`rhythm()` = 1 − CV global de latencias. Salthouse 1986 / Gentner 1983: mano alternada ~155 ms, mismo dedo ~223 ms, repetición ~176 ms. Un experto tiene intervalos *desiguales entre bigramas* y *muy iguales dentro del mismo bigrama* (Dhakal: SD de 11 ms en los rápidos, pero por bigrama). Con la definición actual, cuanto más experto, peor puntaje potencial. Al compás como juego está bien (es folklore útil para frenar al que atropella); como métrica, no.

### 2.7 Feedback aumentado en vivo
PPM y precisión en vivo bajo cada ejercicio (`LessonPlayer.tsx` `Exercise`, `Practice.tsx`). Winstein & Schmidt 1990: reducir la frecuencia del feedback aumentado mejora la retención (guidance hypothesis); además, un contador vivo incita a apurarse, que es lo contrario de "precisión primero". El eco del texto en pantalla sí es feedback intrínseco necesario y hay que mantenerlo.

### 2.8 Hábito: falta lo barato y respaldado
Sin ancla de implementation intention (d = 0,65, el efecto más robusto de esta literatura), sin perdón de un día ni freeze (Lally 2010: faltar un día no rompe la curva; Duolingo mejoró retención *aflojando* la racha), sin meta semanal separada de la racha, sin resumen semanal (monitorear progreso: d ≈ 0,40 en 138 RCT), sin récords honestos, sin "por qué hoy" en el Repaso, mascota muda fuera de los juegos. Un tip cuenta como la Lección del día (ver §3).

### 2.9 Sin texto largo ni texto propio
La cuarta etapa del pipeline canónico de r/typing (TypingClub → keybr → Monkeytype → TypeRacer/libros) es resistencia sobre texto real. TypeLight cubre las tres primeras. Tampoco hay "pegá un mail y tipealo", que es lo más cerca que una web puede estar de medir tu tipeo real (Keith & Ericsson 2007: lo que predice nivel es tener la meta explícita de tipear rápido *en el uso diario*).

---

## 3. Bugs e issues concretos

Severidad: **A** = riesgo de pérdida o métrica inválida · **M** = afecta la experiencia o la validez parcialmente · **B** = cosmético o conceptual.

| # | Sev. | Qué | Dónde | Qué hacer |
|---|---|---|---|---|
| 1 | A | Sin exportar/importar progreso; `resetProgress` sin copia previa. | `src/app/store/index.ts` | Botón "Descargar copia" (JSON del estado + versión) e "Importar"; aviso en Ajustes antes de reiniciar; opcional: recordatorio mensual de copia. |
| 2 | A | Corpus de 85 frases; 0 tipeables antes de Mayúsculas, 21 hasta Tildes. Reto = palabras sueltas la mayor parte de la ruta; referencia no comparable entre etapas. | `src/engine/corpus/sentences.ts`, `Practice.tsx:78-98` | Ver §5 Ola 1: corpus por etapa (frases normalizadas en minúscula sin puntuación para etapas tempranas) desde fuentes libres. |
| 3 | M | Frases repetidas dentro del mismo Reto (~55 % de los Retos con el corpus actual; casi siempre con 21 frases). | `Practice.tsx:93` (`sentencesText(pool, 2)` en loop, rebaraja cada vez) | Pedir `count` grande una sola vez o mantener un set de usadas. |
| 4 | M | Un tip (tarjetas de consejo) marca la tarjeta "Lección" de la rutina como hecha. Leer dos pantallas en 20 s completa el bloque verde. | `src/app/routes/LessonPlayer.tsx:149` (`completeTip` → `markRoutine('lesson')`) | El tip no consume el bloque: encadenar automáticamente a la lección siguiente, o marcar `lesson` solo con una lección con ejercicios. |
| 5 | M | `sessions` capado a 1000. A ~8 sesiones/día, en ~4 meses el chart de referencia pierde el principio y "Ejercicios" se congela. | `src/app/store/index.ts:94` | Guardar un resumen por día (ya existe `days`) con la mediana de referencia y conservar solo sesiones recientes; o subir el tope y comprimir. |
| 6 | M | EMA por tecla sin ponderar por muestras: una aparición fallida de una tecla rara la manda a "floja" por ~8 sesiones. | `src/engine/stats/index.ts:12-31` | α efectivo = f(attempts) (p. ej. `α = min(0.25, attempts / 20)`), o EMA sobre pulsaciones y no sobre sesiones. |
| 7 | M | Dominio sin decaimiento ni "hace cuánto"; "dominada" se otorga en una sola sesión. | `src/engine/stats/progress.ts` (`mastery`) | Guardar `lastSeen` por tecla; prioridad de repaso = EMA + término de olvido (half-life); "dominada" solo si sostiene el umbral en ≥ 2 días distintos (Driskell 1992; Yamaguchi & Logan 2016). |
| 8 | M | La velocidad de referencia se mide con teclado en pantalla + próxima tecla resaltada (+ manos). Es velocidad asistida. | `Practice.tsx` (renderiza `KeyGuide` en `reto`) | Reto a ciegas por defecto (sin `KeyGuide`), con opción de mostrarlo; marcar la sesión como `blind: true`. |
| 9 | M | "Precisión reciente" en Inicio = media simple de `acc` de las últimas 10 sesiones, mezclando juegos (hits/(hits+wrong)) y lecciones; Progreso usa la ponderada por caracteres de 7 días. Dos números distintos para lo mismo. | `src/app/routes/Home.tsx:36` | Usar `weeklyAccuracy` en ambos lados. |
| 10 | B | "Ritmo parejo" = CV global (contradicho por la estructura del tipeo experto). | `src/engine/typing/index.ts` (`rhythm`) | Reemplazar por consistencia por bigrama (CV del IKI del mismo bigrama entre repeticiones, normalizado) o al menos por clase de bigrama; Al compás sigue reportando "a tiempo" aparte. |
| 11 | B | PPM y precisión en vivo durante lecciones y práctica. | `LessonPlayer.tsx` (`Exercise`), `Practice.tsx` | Ocultar durante el ejercicio (dejar solo errores/tiempo si hace falta); mostrar resumen al terminar. En el Reto, el reloj sí. |
| 12 | B | Calentamiento dice "1 min" y no tiene timer (son 16 palabras). | `Home.tsx` (`BLOCKS`) | Poner "~1 min" o un timer real. |
| 13 | B | El Reto no pausa si cambiás de ventana; el reloj sigue corriendo. | `useTypingSession` | Pausar el reloj en `visibilitychange` / `blur`, o descartar el intento si se fue a mitad. |
| 14 | B | Latencia del primer carácter de cada palabra incluye la pausa de lectura. | `keySamples` en `src/engine/typing/index.ts` | Excluir del EMA por tecla las latencias posteriores a un espacio (o guardarlas aparte como "arranque de palabra"). |
| 15 | B | En las tarjetas de intro, Enter solo avanza si el botón tiene el foco (`autoFocus`); no hay listener global como sí lo hay entre ejercicios y en resultados. Menor. | `LessonPlayer.tsx` (fase `intro`) | Extender el listener global de Enter a la fase `intro`. |
| 16 | B | Bundle 524 KB, sin PWA, sin build estable separado del dev server. | — | `vite build` + `vite preview` (o servir `dist/` desde el `.bat`) para el uso diario; PWA con manifest + service worker cuando haya export/import. |

No encontré bugs funcionales en los juegos ni en el motor de tipeo (los tests cubren lo central y los cuatro juegos fueron validados en uso real).

---

## 4. Lo que dice la evidencia sobre las decisiones actuales

Resumen de la tabla del Anexo B §8, cruzada con lo que hacen las plataformas (Anexo A). "Respaldada" = seguir así; "Matizar" = mantener y agregar; "Contradicha" = cambiar el default.

| Decisión actual | Veredicto | Qué cambiar |
|---|---|---|
| Rutina diaria corta | **Respaldada** | Nada. No premiar doble sesión el mismo día; mostrar la ganancia *overnight* ("hoy arrancaste más rápido que ayer al cerrar", Walker 2002). |
| Parar en el error sin Backspace | **Matizar** | Mantener en lección de tecla nueva y calentamiento. Agregar un modo "texto real" donde el error pasa y hay que repararlo con Backspace, al menos en el Reto (o en un Reto alternativo) y en un bloque del Repaso. Medir **errores al primer intento** y **latencia de reparación**. Motivo: detectar y reparar es parte de la habilidad experta (Logan & Crump 2010, Pinet & Nozari 2022) y la comunidad avanzada coincide ("cuando construís precisión sí; cuando trabajás velocidad, no"). |
| Drills de teclas aisladas → texto | **Matizar** | Letras sueltas solo en la primera exposición (ya es así en `keys`); todo lo demás en pseudopalabras y palabras con el bigrama objetivo. Hoy se cumple bastante; lo que falta es el nivel bigrama. |
| Repaso adaptativo por EMA | **Matizar** | Término de olvido; bloques de 3–5 repeticiones seguidas del ítem débil dentro de la sesión (los chunks se forman con repetición consecutiva); "dominado" sostenido en días. |
| Dominio por tecla | **Matizar** | Sumar dominio por bigrama (4 clases: alternancia, misma mano, mismo dedo, repetición). |
| Reto de 1 min con mediana diaria | **Neutra / respaldada** | Bien como benchmark diario. Agregar un examen de 3 min **semanal**, a ciegas, sobre un texto fijo que rota por mes (controla la dificultad del texto, que hoy varía). |
| Teclado en pantalla + manos guía | **Contradicha en parte, matizada por §10** | Manos: on mientras la tecla no está dominada (el problema de Seba es el dedo, no la tecla); se desvanecen por tecla con el dominio; off en el Reto. Teclado: oculto en el Reto (sin próxima tecla resaltada); modo "sin ayuda" explícito. |
| Métrica "ritmo" = CV global | **Contradicha** | Consistencia por bigrama. |
| Al compás (metrónomo) | **Neutra / folklore** | Sigue como juego; pulso por debajo de la velocidad cómoda; no como método principal. |
| Lluvia y Globos | **Respaldada más de lo que parece** | Son la intervención anti-melioration. Rotarlos *dentro* de la rutina (p. ej. reemplazar el Calentamiento un día de cada tres). |
| Carrera contra el fantasma | **Respaldada como ráfaga ocasional, con cuidado (§10)** | 10–20 % por encima del ritmo cómodo (Ericsson, no verificado textualmente; Vékony 2022: no daña). Para un tipista no estándar la presión de velocidad es lo que reactiva los dedos viejos: no más de 1–2 por sesión, y con auto-chequeo de forma al final. |
| Precisión 7 días | **Respaldada** | Ya es de facto "al primer intento". Decirlo. |
| Racha / constancia | **Matizar** | Días activos por semana, con perdón de un día. Las rachas frágiles castigan justo al que necesita 66 días. |
| Currículo por filas para un adulto que conoce el layout | **Matizar** | No rehacer la ruta. Agregar onboarding de converso (bajón esperado, a ciegas como métrica) y, opcional, "examen para saltear" por unidad. |
| PPM en vivo | **Contradicha** | Resumen al final. |

---

## 5. Roadmap: cinco olas

Esfuerzo: S = una sesión corta · M = una sesión larga o dos · L = varias. Cada ola termina mergeable a `master` con `npm test` / `e2e` / `build` en verde. Las olas 0 y 1 no cambian ninguna decisión tuya; las 2 y 3 sí tocan defaults y las marco.

### Ola 0 · Proteger y ordenar (S, una sesión)
1. **Exportar / importar progreso** (JSON con `version`), aviso antes de "Reiniciar", y recordatorio suave cada 30 días. Cierra el issue #1.
2. **Build estable para el uso diario**: `npm run build` + servir `dist/` desde el `.bat` (o `vite preview`), y el dev server aparte para trabajar. Cierra el HMR que te resetea lecciones.
3. **Fixes chicos**: frases repetidas en el Reto (#3), tip no consume el bloque Lección (#4), precisión de Inicio = la de Progreso (#9), "~1 min" en Calentamiento (#12), pausa/descarte del Reto al perder foco (#13).
4. **Historial**: resumen por día de la referencia para que el tope de 1000 sesiones no corte el chart (#5).

### Ola 1 · Contenido (M, una o dos sesiones)
5. **Corpus de frases por etapa.** Un `scripts/build-sentences.py` hermano de `build-corpus.py`: fuentes libres (Tatoeba ES, CC-BY; Wikisource / Gutenberg en español de dominio público: Quiroga, Arlt, Storni, Lugones, Hernández, Güiraldes, Payró —rioplatenses y PD—; refranes), filtro contra el diccionario y la blocklist existentes, sin nombres propios, largo 40–90. **Y una versión normalizada por etapa**: la misma frase en minúscula y sin puntuación para las etapas anteriores a Mayúsculas ("el pulpo tiene tres corazones y sangre azul" es texto real con pool de letras). Objetivo: ≥ 300 frases tipeables en *cada* etapa. Las 85 a mano quedan como subconjunto "de la casa" con más peso.
6. **N-gramas del español.** Tabla de bigramas/trigramas más frecuentes calculada desde el corpus de palabras (con frecuencias, que `es_50k` trae) → nueva `ExerciseSpec { kind: 'ngram' }` estilo Ngram Type (combinación × repetición, umbral de 100 % por parar-en-error) para Patrones, Velocidad y Calentamiento. Ninguna plataforma lo tiene en español; es la feature de contenido más barata con más impacto según r/typing ("drilleás n-gramas unas sesiones, volvés y mágicamente sos más rápido").
7. **Sello "velocidad honesta"** en Progreso: dos líneas que expliquen por qué solo cuentan Retos, mediana diaria, precisión al primer intento. Puro copy.

### Ola 2 · El converso (M, dos sesiones) — toca defaults
8. **Reto sin ayuda por defecto** (sin teclado ni manos ni próxima tecla resaltada; `blind: true` en la sesión). La referencia pasa a ser "velocidad sin ayuda". Va a bajar el número: **anunciarlo** con una marca en el chart ("desde acá, sin ayuda") y hacerlo en la misma versión que el punto 9, para que el chart tenga *una* discontinuidad y no dos.
9. **Modo "texto real con Backspace"** en el Reto (y opcional en Repaso): el error pasa, se repara con Backspace, se miden errores al primer intento, KSPC y latencia de reparación. Es la idea suelta del backlog ("Backspace permitido como ajuste") con evidencia detrás. Podés elegir: (a) el Reto diario con Backspace y el examen semanal a ciegas sin Backspace, o (b) al revés. Yo iría por (a): el Reto diario se parece a tipear de verdad; el examen semanal es la repetición 100 % correcta.
10. **Manos guía por dominio**: on en intro, `keys`, `review`, `practice` y Repaso mientras la tecla actual no está dominada (se desvanecen por tecla, no por lección); off en el Reto. Es el ajuste que pide §10: el dedo es lo que hay que reconstruir.
11. **Rollover ratio**: capturar `keydown`/`keyup` en `useHiddenInput` y calcular la fracción de pulsaciones que empiezan antes de que se suelte la anterior. Mostrarlo como "Fluidez" en Progreso. Barato y es el mejor predictor conocido.
12. **Onboarding de converso** (una pantalla, editable en Ajustes): "10 min, 5 días por semana, ~10 semanas. Las primeras 2–3 semanas vas a ser más lento que mirando; es esperado. La precisión hace la velocidad." + ancla: "Después de ___, practico" (implementation intention, d = 0,65). La frase se muestra en Inicio.
13. **Juego dentro de la rutina**: un día de cada tres, el Calentamiento se reemplaza por Al compás (pulso por debajo de tu velocidad cómoda: mantiene el mapeo nuevo al mando, §10) o por Globos; rota la novedad justo cuando decae.
13b. **Tu velocidad de antes** (S, y cuanto antes mejor porque el mapeo viejo se va borrando): un test único de 1 min "tipeá como tipeabas antes" guardado como `legacyWpm`; línea "antes" en el chart de referencia; hito "superaste tu forma vieja" cuando la mediana la cruza; y el fantasma de la Carrera puede ser "vos con los dedos viejos".
13c. **Dominio por dedo** en Progreso: el mapa de teclas agregado por dedo ("meñique izquierdo 40 %, anular 55 %"). Hace visible exactamente tu problema.
13d. **Auto-chequeo de forma** al cerrar el Reto y la Carrera: "¿fila guía y dedos correctos?" sí / más o menos / no, guardado en la sesión. La app no ve los dedos; vos sí. Informativo (porcentaje de Retos con buena forma), no punitivo.
14. **PPM en vivo → resumen al final** en lecciones y práctica (#11).

### Ola 3 · Hábito (S/M, una o dos sesiones)
15. **Racha amable**: día activo = calentamiento (o un juego) completo; freeze automático ganado (1 cada 5 días activos, máx. 2, se consume solo); "nunca dos veces" (un día perdido se perdona si practicás el siguiente); mostrar mejor racha y días activos totales al lado de la actual. Copy de retorno sin culpa.
16. **Meta semanal configurable** (default 5 de 7) separada de la racha; "semanas activas" en Progreso.
17. **Resumen semanal** el primer acceso de cada lunes: minutos, días, referencia 7d vs. semana anterior, precisión, teclas dominadas nuevas, **una** victoria concreta ("la ñ pasó de 62 % a 80 %"). Es el antídoto directo a la caída de novedad de las semanas 3–5.
18. **Récords honestos multi-escala** con celebración proporcional (≤ 1,5 s): mejor Reto, mejor mediana 7 días, mejor precisión semanal, rutina completa 7 días seguidos. Solo sobre métricas anti-inflado.
19. **Hitos con significado**: 7, 14, 30, 66 (con la explicación de Lally: "a partir de acá ya es hábito para la mayoría"), 100 días. El de 30 dispara un "Mes en resumen".
20. **"Por qué hoy"** en el Repaso: "Hoy insistimos con q, p y ñ porque fallaste 3 de 10 ayer y hace 6 días que no ves la ü". Y **cap de atraso**: nunca mostrar backlog.
21. **Mascota en Inicio**: una línea, informativa o de aliento, nunca culpa; silenciable.

### Ola 4 · Modelo de habilidad v2 (M/L, dos o tres sesiones)
22. **EMA ponderada por muestras + olvido** (#6, #7): `lastSeen`, half-life que crece con cada revisión exitosa, prioridad = f(latenciaEma, errorEma, días/half-life). "Dominada" sostenida en ≥ 2 días.
23. **Dominio por bigrama** (4 clases) con generación de ejercicios que insertan el bigrama débil en palabras reales / pseudopalabras. Reemplaza "ritmo parejo" por consistencia por bigrama (#10).
24. **Palabras problemáticas históricas** (latencia media, errores por palabra) + botón "practicar estas" después del Reto (no cuenta como referencia). Es la feature más pedida de Monkeytype.
25. **"Cualidades" de la debilidad** (mano dominante, fila, mismo dedo, doble letra, tecla muerta): nadie lo hace; alimenta el "por qué hoy" y el texto de la mascota.
26. **Predicción** "te faltan ~N rutinas para la meta" (regresión sobre las últimas 30 referencias, solo con R² ≥ 0,5, como keybr).
27. **Métricas de tecla muerta**: latencia tilde→vocal y "tilde suelta" como error propio. Diferencial ES puro.

### Ola 5 · Extras que valen la pena (opcionales, S cada uno salvo el último)
28. Examen semanal de 3 min a ciegas sobre texto fijo que rota por mes.
29. **Texto propio**: pegá un mail o un párrafo y tipealo (no referencia). Puente al uso real.
30. **Compromiso semanal de proceso** con auto-reporte: "esta semana escribo los mails sin mirar" (Keith & Ericsson; Yechiam). Un sí/no el domingo.
31. Muerte súbita (un error termina; puntaje = caracteres) y racha de precisión (caracteres seguidos sin error, del día e histórica): los dos son métricas naturales de un sistema sin Backspace.
32. Fantasma "vos hace 30 días" además del de 7 días.
33. Reto del día con semilla fija + "copiar resultado" (grilla de emojis con PPM y precisión) para mandarle a alguien: el único social viable sin backend y funciona como commitment device.
34. Metrónomo opcional en lecciones `practice` (pulso = meta −10 %); ya está en el backlog como idea.
35. Modo lectura: libros rioplatenses de dominio público, tipear por párrafos, "stop on word" solo acá (L).
36. Teclado numérico y símbolos de código como unidades opcionales al final (M).

---

## 6. Insights (lo no obvio)

1. **La velocidad de referencia de hoy es asistida.** El Reto se tipea con la próxima tecla iluminada en pantalla. Es honesta respecto de "no la infla un drill fácil", pero no respecto de "sin ayuda". Para un converso, la métrica que importa es a ciegas. Cambiarlo baja el número: por eso se anuncia y se hace junto con el cambio de Backspace, una sola discontinuidad.
2. **Los juegos son más serios que la rutina para tu caso.** Lluvia y Globos obligan a mirar la pantalla para rendir; es exactamente el tratamiento que Yechiam 2003 probó contra la melioration (volver a mirar el teclado porque rinde más hoy). Hoy están como premio; deberían estar en la dieta.
3. **El converso desaprende, no aprende.** Feit 2016: con 5–6 dedos se puede ser tan rápido como con 10; lo que distingue es que cada letra la toque siempre el mismo dedo (entropía del mapeo) y preparar la tecla siguiente. Logan 2016: los tipistas no estándar son igual de automáticos, con un mapeo peor (65,6 vs 80,0 PPM; 83 % vs 94 % de precisión). Tu progreso real es "qué tan consistente es mi dedo por tecla" y "qué tan bien rinden meñique y anular", no "cuántas teclas dominadas". Y la app no ve los dedos: por eso importan el dominio por dedo, el auto-chequeo y la vara de "tu velocidad de antes".
4. **El bigrama es la unidad.** Dhakal 2018: la alternancia de manos, que a los rápidos les da ventaja, a los lentos les cuesta 20–28 ms *más* —al revés—, porque dependen de búsqueda visual para cambiar de mano. Un "dominio por bigrama" con 4 clases te diría en qué transición estás mirando.
5. **Rollover es la métrica de expertise que nadie muestra y cuesta 30 líneas.** r = 0,73 con PPM; los rápidos 40–70 % de pulsaciones solapadas, los lentos ~8 %. Con `keydown`/`keyup` en el input oculto se calcula. Es además un marcador honesto de "estás dejando de buscar la tecla".
6. **Espaciar entre días, masificar dentro del bloque.** Contra la intuición de "repetición espaciada para todo": los chunks de tipeo se forman con repeticiones *consecutivas* (Yamaguchi & Logan 2016). Un ítem débil se practica hoy en un bloque de 3–5 seguidas, y vuelve mañana. El Repaso hoy lo dispersa.
7. **Duolingo ganó retención aflojando la racha, no endureciéndola.** +3,3 % D14 al desacoplarla de la meta diaria; +0,38 % DAU con dos freezes; los que "bingean" abandonan más. Para un usuario solo sin monetización, todo lo que agregaron después (ligas, corazones, gemas) es ruido o daño.
8. **La semana 3 es un problema técnico antes que motivacional.** Al pasar a tacto la velocidad baja. Si la app no lo dice antes, la métrica honesta se lee como fracaso. La frase de onboarding vale más que cualquier animación.
9. **La comunidad avanzada distingue dos fases del Backspace**: "cuando construís precisión, sin Backspace; cuando trabajás velocidad, con" (r/typing, 1kuzstx). Es el mismo veredicto que la literatura de errorless learning + guidance hypothesis. La app tiene una sola fase.
10. **Lo que nadie hace y TypeLight podría**: explicar la debilidad por cualidades de palabra (mano, fila, dedo), medir la tecla muerta, salud de la mano (excluir un dedo), local-first con export. Cuatro diferenciales chicos que juntos hacen una app que no existe.
11. **Un tip cuenta como lección.** Es un detalle, pero es el tipo de agujero que vacía el significado de la tarjeta verde, y la tarjeta verde es el corazón del hábito.
12. **El corpus decide más que el algoritmo.** Con 21 frases, el mejor modelo de habilidad del mundo mide memorización. Con 300 por etapa, el modelo actual ya rinde mucho más.

---

## 7. Lo que no haría

- **Ligas, leaderboards, XP por volumen, badges genéricos, gemas, wagers, corazones/energía.** Efectos frágiles o negativos (Hanus & Fox 2015; Deci 1999; la propia Duolingo retiró los corazones). Sin otros usuarios, además, no tienen sentido.
- **Backend, cuentas, sync.** Export/import + PWA cubren el 95 % del valor con 5 % del costo. Entertrained demuestra que local-first funciona.
- **Notificaciones o mascota triste.** Lo que sí: ancla en Inicio, acceso directo/PWA, opcionalmente una tarea programada de Windows que abra la URL a la hora elegida.
- **Rehacer la ruta por frecuencia** (estilo keybr). Te gustó la progresividad de TypingClub y ya la estás caminando; el costo de re-empezar supera el beneficio. Sí: onboarding de converso y examen para saltear.
- **Volver a manos dibujadas por código** (descartado tres veces) ni assets emoji. Las manos actuales quedan; cambia *cuándo* se muestran.
- **Un metrónomo como método principal.** Es folklore histórico útil como juego.
- **Más ajustes que los necesarios.** Monkeytype es "un cubo Rubik" para la mitad de r/typing. Cada ajuste nuevo con una frase que explique por qué existe.

---

## 8. Riesgos y qué vigilar

| Riesgo | Señal | Mitigación |
|---|---|---|
| Cambiar la definición de la referencia (a ciegas + Backspace) rompe la continuidad del chart | El número baja 20–30 % de un día para otro | Hacer ambos cambios juntos, marcar la discontinuidad en el chart, guardar `blind` y `backspace` en la sesión, y mostrar la mediana de las dos series si hace falta |
| Corpus automático con ruido (nombres, formas de vosotros, temas raros) | Frases con "Tom" o "vosotros" en el Reto | Reusar el filtro y la blocklist de `build-corpus.py`; excluir mayúsculas internas (nombres); revisar una muestra de 200 a mano |
| Sobre-ingeniería del modelo v2 para un solo usuario | Semanas sin nada visible | Ola 4 solo después de las 0–3; medir con tu propia telemetría (rollover, errores al primer intento) si mejora algo |
| Perder el "divertido sin distraer" con resúmenes y celebraciones | Modal cada vez que abrís | Un resumen por semana, celebración ≤ 1,5 s solo en récords reales, todo silenciable |
| Que el modo con Backspace se vuelva el modo cómodo | Precisión al primer intento cae | Mantener parar-en-error en lecciones y calentamiento; mostrar KSPC y errores al primer intento, no solo la velocidad |
| Meseta 60–70 PPM (la típica de la comunidad) | Referencia plana 2–3 semanas | Cambiar el método, no insistir: n-gramas, bigramas débiles, ráfagas a ciegas (Keller 1958; Gray 2017) |

---

## 9. Próximo paso

**Aprobado por Seba el 2026-09-17** ("aprobado todo"): el orden de las olas, la variante (a) para el Reto (diario con Backspace + examen semanal sin ayuda y sin Backspace) y las manos por dominio (§10). Sigue el spec de la etapa 3 (Ola 0 + Ola 1 + la vara "tu velocidad de antes"), en `docs/superpowers/specs/`. La Ola 2 se propone después con dos o tres variantes renderizadas (cómo se ve el Reto sin ayuda, dónde vive el modo con Backspace, cómo se marca la discontinuidad en el chart).

---

## 10. Addendum — el punto de partida real de Seba (2026-09-17)

Al aprobar el reporte, Seba aclaró: **ya tipeaba sin mirar el teclado**, rápido, pero con los dedos mal: no volvía a la fila guía, casi no usaba el meñique y poco el anular. "Muy ineficiente y más propenso a errores".

Eso lo saca del perfil "converso que vuelve a mirar" (Yechiam 2003) y lo pone en el de **tipista no estándar** (Logan, Ulrich & Lindsey 2016, Anexo B §1.7): igual de automático que uno estándar, con un mapeo dedo→tecla subóptimo; 65,6 vs 80,0 PPM y 83 % vs 94 % de precisión en ese estudio, brecha que se agranda cuando el teclado deja de estar a la vista. Feit 2016 pone el dedo en la llaga: lo que separa a los rápidos es que **cada letra la toca siempre el mismo dedo** y que la mano prepara la tecla siguiente; el anular y el meñique son además los dedos con menos independencia motora, los que más práctica piden.

Qué cambia en el diagnóstico:

- **El enemigo no es mirar; son los dedos viejos.** La melioration sigue aplicando, pero en otra forma: bajo presión de velocidad el mapeo viejo —automático y rápido— toma el control, y la app **no puede verlo**: una tecla correcta con el dedo equivocado es, para el motor, una tecla correcta. Es la limitación más importante de TypeLight para este usuario y ninguna plataforma la resuelve.
- **La velocidad "sin ayuda" sigue valiendo** (mide transferencia sin la próxima tecla iluminada), pero no es *la* métrica de conversión: Seba ya era rápido a ciegas con el mapeo viejo. La métrica de conversión es **rendimiento por dedo** (meñiques y anulares) y **forma sostenida**, y la vara es **su velocidad de antes**.
- **Las manos guía importan más, no menos**: son la única señal de *dedo* que la app puede dar. Se quedan mientras la tecla no está dominada y se desvanecen por tecla; se van del Reto.
- **Velocidad objetivo baja al principio y ráfagas con cuidado**: Fitts & Posner — el mapeo viejo es autónomo, el nuevo es cognitivo; conviven y compiten, y la velocidad decide quién gana. Al compás con pulso por debajo de la velocidad cómoda es, para este perfil, la herramienta correcta, no folklore. Carrera y ráfagas: pocas y con auto-chequeo de forma.
- **El Repaso adaptativo ya apunta bien** si usa los dedos correctos: las teclas de meñique y anular (a, ñ, s, l, p, q, z, x, w, o, ;, Shift) van a salir lentas y con errores, y el EMA las va a traer solas. El riesgo es el inverso: si vuelve al dedo viejo, esas teclas "mejoran" y el Repaso deja de insistir. De ahí el auto-chequeo.
- **La ruta por filas es adecuada** para este perfil (lo que hay que reconstruir es qué dedo va a qué tecla, fila guía primero). No se rehace.

Qué se agrega al roadmap (ya insertado en la Ola 2 como 13b–13d):

| Qué | Por qué | Esfuerzo | Cuándo |
|---|---|---|---|
| **Tu velocidad de antes** (`legacyWpm`): test único de 1 min tipeando como antes; línea en el chart; hito al cruzarla; fantasma opcional "vos con los dedos viejos" | Da la vara real del proyecto: el mapeo nuevo vale cuando supera al viejo. El dato se degrada con cada día de práctica nueva: capturarlo ya. | S | Etapa 3 (adelantado desde la Ola 2) |
| **Dominio por dedo** en Progreso | Hace visible el problema exacto (meñique/anular) y su mejora; Harkin 2016: monitorear progreso, d ≈ 0,40 | S/M | Ola 2 |
| **Auto-chequeo de forma** al cerrar Reto y Carrera (sí / más o menos / no) | La app no ve los dedos; el usuario sí. Informativo: % de Retos con buena forma; no punitivo. | S | Ola 2 |
| **Calentamiento de dedos flojos**: variante del Calentamiento sesgada a las teclas de meñique y anular ("gimnasia de dedos", TypingClub tiene una) | Práctica dirigida del déficit específico, en bloques de repeticiones seguidas (Yamaguchi & Logan 2016) | S | Ola 2 |
| **Al compás dentro de la rutina** (pulso −10 % de la velocidad cómoda) | Mantiene el mapeo nuevo al mando | S | Ola 2 (reemplaza a Lluvia en el punto 13) |
| *Exploración, sin compromiso:* detección de dedos con webcam (MediaPipe Hands corre en el navegador, todo local) | Sería lo único que cierra el hueco "la app no ve los dedos". Ángulo de cámara y precisión son dudosos; es L y puede no funcionar. Vale un experimento de una tarde antes de decidir. | L | Después de la Ola 4, si el auto-chequeo no alcanza |
