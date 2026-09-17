# Hábito, motivación y engagement en apps de práctica diaria — qué dice la evidencia y cómo aplicarlo a TypeLight

> Informe de investigación de producto y ciencias del comportamiento. Fecha: 2026-09-17.
> Contexto: TypeLight es una app web local (Chrome de escritorio, sin backend, sin cuentas, sin push), de un solo usuario adulto que hoy tipea mirando el teclado y quiere pasar a tacto. Riesgo principal: abandono alrededor de la tercera semana.
> Convención de nivel de evidencia: **[MA]** meta-análisis / revisión sistemática · **[RCT]** experimento aleatorizado (lab o campo) · **[OBS]** observacional / longitudinal / diario · **[INT]** dato interno de empresa (A/B test o blog corporativo, no auditado) · **[OP]** opinión, libro divulgativo, análisis de terceros. Los números entre corchetes `[n]` remiten a la lista de Fuentes al final.

---

## 0. Resumen ejecutivo (15 bullets accionables)

1. **El hábito se cablea por repetición en contexto estable, no por "fuerza de voluntad": mediana 66 días, rango 18–254, curva asintótica** (Lally 2010 [1], OBS). Faltar un día no rompe la curva. Implicancia: la app tiene que sobrevivir ~10 semanas de práctica *tolerante a fallas*, y contar "días activos" vale más que contar "días seguidos".
2. **La intervención más barata y mejor respaldada es la implementation intention ("después de X, practico 10 min en TypeLight")**: d = 0.65 en 94 experimentos (Gollwitzer & Sheeran 2006 [6], MA). TypeLight no puede mandar push, pero sí puede pedirle a Seba que fije un ancla y mostrársela en Home.
3. **Monitorear el progreso mueve la aguja por sí solo**: d ≈ 0.40 en 138 RCTs (Harkin 2016 [8], MA), más fuerte si se registra físicamente/visiblemente. El calendario y los minutos que ya existen son el activo más valioso; falta el resumen semanal que los convierte en "progreso percibido".
4. **Las metas con "reserva de emergencia" (slack con costo) se cumplen más que las metas rígidas o fáciles** (Sharif & Shu 2017 [9], RCT lab+campo) y **los incentivos flexibles superan a los rígidos incluso después de retirarlos** (Beshears et al. 2021 [10], RCT campo). Esto es el argumento científico del streak freeze automático y de la meta "5 de 7 días".
5. **Duolingo mide que su racha es la palanca de retención más fuerte, pero lo que más le rindió fue *aflojarla*, no endurecerla**: desacoplar racha de meta diaria (+3.3% D14, +1% DAU), animaciones al extender (+1.7% D7), duplicar freezes (+0.38% DAU), y "amuleto de fin de semana" (+4% retorno semanal) [37][38][39] (INT). A los 7 días de racha el usuario es 2.4× más propenso a volver mañana [37].
6. **Las recompensas tangibles y esperadas erosionan la motivación intrínseca (d ≈ −0.28 a −0.40); el feedback verbal/informativo positivo la aumenta** (Deci, Koestner & Ryan 1999 [14], MA de 128 estudios). Las estrellas y récords de TypeLight tienen que *informar competencia*, no "pagar" por aparecer.
7. **La gamificación tiene efectos pequeños-medios (g = .49 cognitivo, .36 motivacional, .25 conductual) y los conductuales son frágiles** (Sailer & Homner 2020 [22], MA). Puntos vacíos, badges y leaderboards en aula *bajaron* motivación intrínseca y notas (Hanus & Fox 2015 [25], OBS longitudinal). El efecto novedad decae en semanas (Koivisto & Hamari 2014 [27]; Rodrigues 2022 [28]).
8. **Ligas, corazones/energía y "streak wager" con monedas son las piezas de Duolingo que más ruido generan y menos aplican a un usuario solo**: la propia Duolingo admitió que los corazones "no eran la manera más efectiva de apoyar el aprendizaje" [42] y la energía que los reemplazó recibió rechazo fuerte [46][47]. TypeLight no debería penalizar errores con recursos: el error *es* la señal de aprendizaje.
9. **La dificultad óptima está cerca del 85% de aciertos** (Wilson et al. 2019 [20], modelo computacional; coherente con "flow"). Un drill al 99% no enseña; uno al 60% frustra. TypeLight debería apuntar el repaso adaptativo a ~85–90% de precisión por tecla, y decirlo.
10. **Metas de proceso primero, de resultado después** (Zimmerman & Kitsantas 1997 [18], RCT; Locke & Latham 2002 [17]): en tareas nuevas y complejas, la meta "10 min, 5 días/semana" funciona mejor que "llegar a 40 wpm"; la meta de resultado se agrega cuando la técnica ya está estable (~día 30–45).
11. **Pequeñas victorias visibles son el motor emocional del progreso** (Amabile & Kramer 2011 [19], diario de 12.000 días): un "nuevo mejor 7 días" o "la `p` pasó de 70% a 90%" vale más que un badge genérico.
12. **Celebrar sí, pero con criterio**: Fogg [7] (OP, sin RCT propio) dice que la emoción inmediata cablea el hábito; la evidencia experimental sobre "juiciness" es mixta y la *amplificación* excesiva de feedback bajó la sensación de competencia (Kao et al. CHI 2024 [34], RCT). Regla: celebrar hitos reales (récord, rutina completa, hito de días), no cada tecla.
13. **La mascota ayuda poco y puede distraer**: los agentes pedagógicos tienen efecto pequeño (Schroeder 2013 [32], MA), mejor con texto breve que con narración, y Mayer advierte que una imagen en pantalla no mejora el aprendizaje por sí sola. Mantenerla fuera del área de tipeo durante drills; usarla en Home y al cerrar sesión, con mensajes cortos y sin culpa (modelo Headspace [50], no "Duo amenazante").
14. **Efecto "fresh start"** (Dai, Milkman & Riis 2014 [11], OBS+RCT): lunes, primero de mes y cumpleaños son ventanas naturales para relanzar. TypeLight puede usar los lunes para el resumen semanal y el "1° de mes" para proponer una meta nueva.
15. **El mayor riesgo de la semana 3 no es motivacional sino técnico**: al pasar de mirar el teclado a tacto, la velocidad *baja* temporalmente. Si el onboarding no lo anticipa ("las primeras 2–3 semanas vas a ser más lento que antes; es normal y esperado"), la métrica honesta de TypeLight va a parecer castigo. Hay que mostrar la curva esperada y una métrica que suba desde el día 1 (precisión por tecla, cobertura de teclas, minutos acumulados).

---

## 1. Ciencia del hábito: qué está bien respaldado y qué es pop-science

### 1.1 Lally et al. 2010 — la curva asintótica y los 66 días [1] (OBS)
- 96 voluntarios eligieron una conducta simple (comer, beber, actividad) atada a un contexto ("después del desayuno") durante 12 semanas, completando el Self-Report Habit Index a diario. 82 aportaron datos suficientes; a 62 se les pudo ajustar una curva y 39 tuvieron buen ajuste.
- Resultado: la automaticidad crece siguiendo una **curva asintótica**: los primeros días suman mucho, después cada repetición suma menos hasta un plateau. La mediana para llegar al 95% del plateau fue **66 días**, con rango **18–254**. Conductas más complejas (ejercicio) tardaron más que las simples (tomar agua).
- **Faltar un día no afectó materialmente la curva**; faltar varios seguidos sí. Esto es la base empírica de "nunca faltes dos veces".
- Limitaciones: autorreporte, muestra chica, ~la mitad no alcanzó buen ajuste, y "66" es una mediana de una muestra pequeña, no una ley. Divulgación posterior lo convirtió en "regla de los 66 días", que es tan mito como la de los 21.
- **Réplicas a escala**: Buyalskaya et al. 2023 (PNAS) [2] (OBS, 12M observaciones de gimnasio + 40M de lavado de manos) estimaron que la predictibilidad de la conducta de gimnasio llega al 95% de su asíntota en **68–78 días (2–3 meses)**, mientras que el lavado de manos se estabiliza en semanas. Kaushal & Rhodes 2015 [3] (OBS, n=111 nuevos socios de gimnasio) encontraron que **≥4 sesiones/semana durante 6 semanas** era el mínimo para reportar hábito.
- **Traducción a TypeLight**: mecanografía a tacto es una conducta "media" (10 min, esfuerzo cognitivo). Expectativa honesta: **8–12 semanas** para que abrir la app sea automático; 4–5 sesiones/semana es el piso. Los primeros 20 días son donde más automaticidad se gana por repetición: ahí hay que minimizar fricción a cualquier precio.

### 1.2 Implementation intentions — Gollwitzer & Sheeran 2006 [6] (MA)
- 94 tests independientes, >8.000 participantes: formular planes "si-entonces" ("si es X situación, entonces hago Y") tuvo un efecto **d = 0.65** (medio-grande) sobre el logro de metas. Funciona para iniciar la conducta, blindarla de distracciones y retomarla tras fallas.
- Es probablemente el hallazgo más robusto de toda esta literatura. Nota: Beshears et al. (NBER 2018, "The limits of simple implementation intentions") vieron que un plan *mínimo* en un mail no bastó para ejercicio; el plan tiene que ser concreto y propio.
- **Traducción**: en onboarding (y editable en Ajustes), pedir: "¿Cuándo vas a practicar? Después de ___ (ej. el primer café, abrir el mail), en ___ lugar". Mostrarlo en Home como una línea ("Tu plan: después del café, 10 min"). Sin backend, la app *es* el recordatorio cuando se abre; el ancla es lo que hace que se abra.

### 1.3 Fogg Behavior Model y Tiny Habits [7] (OP con base teórica)
- B = MAP: la conducta ocurre cuando coinciden Motivación, Habilidad (ability) y un Prompt. Receta Tiny Habits: "Después de [ancla], hago [conducta minúscula]. Y celebro".
- Lo que está respaldado: el ancla es una implementation intention (ver 1.2); reducir la conducta a algo pequeño coincide con Lally (conductas simples se automatizan antes). Lo que **no** tiene RCT propio: que la *celebración* auto-inducida acelere la formación de hábito comparado con no celebrar. Es plausible (refuerzo inmediato, afecto positivo) pero es interpretación de Fogg, no dato.
- **Traducción**: la "conducta minúscula" de TypeLight debería ser el **calentamiento de 1–2 minutos**, no la rutina completa de 4 pasos. Si un día solo hace el calentamiento, cuenta como día activo. Eso preserva la cadena en días malos (Duolingo llegó a la misma conclusión: una lección cuenta para la racha, sin importar la meta diaria [37]).

### 1.4 Wood & Neal — contexto y automaticidad [4][5] (teoría + OBS)
- En estudios de diario, ~43–45% de las conductas cotidianas se repiten casi a diario en el mismo lugar (Wood, Quinn & Kashy 2002 [5]). Los hábitos son asociaciones contexto→respuesta que, una vez formadas, se disparan sin mediación de la meta (Wood & Neal 2007 [4]).
- Implicancia fuerte: **estabilidad de contexto** (misma hora, mismo lugar, misma pestaña) importa más que la motivación. Para una app local, el "contexto" es: acceso directo en escritorio o barra de marcadores, pestaña fijada, app instalada como PWA, o incluso "abrir al iniciar Chrome". Cambiar el ícono o la ubicación rompe el cue.

### 1.5 Clear, *Atomic Habits* [OP]
- Síntesis divulgativa: habit stacking (= implementation intention con ancla), regla de los 2 minutos (= tiny habit), "nunca faltes dos veces" (= lectura práctica de Lally), diseño de entorno (= Wood & Neal). No aporta evidencia propia; su mérito es la traducción. Recomendable como vocabulario de producto, no como fuente.

### 1.6 Eyal, *Hooked* [OP] — y su crítica
- Modelo: trigger → acción → recompensa variable → inversión. Útil como checklist; criticado (Yu-kai Chou [60], entre otros) porque descansa en recompensas impredecibles y aversión a la pérdida ("black hat"), que producen uso compulsivo más que hábito saludable; la "matriz de manipulación" de Eyal es un filtro ético delgado.
- **Para TypeLight**: no hay que buscar recompensas variables; el "trigger interno" legítimo ya existe (querer tipear sin mirar). Lo que sí vale del modelo es la fase de **inversión**: cada sesión debería dejar algo que aumente el valor de la siguiente (historial, teclas dominadas, récords). Eso la app ya lo hace; hay que hacerlo visible.

---

## 2. Motivación

### 2.1 Self-Determination Theory en apps y juegos [15][16] (RCT/encuesta; MA)
- Ryan, Rigby & Przybylski 2006 [15]: en 4 estudios, la satisfacción de **competencia** (controles dominables, feedback claro), **autonomía** (elegir metas y estrategias) y **relación** predijo disfrute y persistencia en videojuegos.
- Meta-análisis 2023 (ETR&D) [16]: la gamificación mejora motivación intrínseca, autonomía y relación percibidas, pero tiene **impacto mínimo en competencia percibida**. Es decir: los elementos de juego no hacen sentir competente; lo que hace sentir competente es *mejorar de verdad y verlo*.
- **Traducción**: en un usuario solo, la "relación" queda casi fuera (salvo mascota o compartir con un amigo por copiar-pegar). Hay que invertir en **competencia** (feedback por tecla, récords honestos) y **autonomía** (meta configurable, elegir juego, elegir qué practicar hoy). Que el modo "Jugar" se desbloquee al terminar la rutina es una forma de *temptation bundling* (Milkman, Minson & Volpp 2014 [12], RCT: +0.48 visitas al gimnasio cuando el audiolibro tentador solo estaba disponible ahí); está bien conservarlo.

### 2.2 Sobrejustificación: ¿las recompensas matan el interés? [14] (MA)
- Deci, Koestner & Ryan 1999: 128 experimentos. Recompensas **tangibles y esperadas**, contingentes a participar/completar/rendir, redujeron la motivación intrínseca medida en libre elección (d = −0.40 / −0.36 / −0.28). En cambio, el **feedback verbal positivo** (informativo) la aumentó. Recompensas inesperadas no dañaron.
- **Traducción**: estrellas y récords deben leerse como *información sobre competencia* ("3 estrellas = 95% precisión a 35 wpm"), nunca como moneda ni como recompensa por aparecer. Evitar gemas, cofres, XP por volumen. La racha es un registro de monitoreo, no un premio; no atarle beneficios materiales dentro de la app.

### 2.3 Goal-setting theory — Locke & Latham 2002 [17] (revisión de 35 años, mayormente RCT)
- Metas **específicas y difíciles** rinden más que "hacé lo mejor que puedas", con moderadores: compromiso, feedback, y complejidad de la tarea. En tareas **nuevas y complejas**, una meta de resultado exigente produce "visión de túnel"; ahí conviene una **meta de aprendizaje** ("descubrir 3 estrategias para no mirar el teclado") o de proceso.
- Zimmerman & Kitsantas 1997 [18] (RCT, n=90, tiro de dardos): el mejor grupo fue el que arrancó con **metas de proceso** (técnica) y **migró a metas de resultado** (puntaje) cuando la técnica se estabilizó; también ayudó el **auto-registro**.
- **Traducción**: en TypeLight, semanas 1–4: meta de proceso ("5 días × 10 min, sin mirar el teclado"). Semanas 5+: se habilita una meta de resultado con fecha ("40 wpm a ≥95% el 15 de diciembre"). La app puede proponer la transición automáticamente cuando la precisión a tacto supera un umbral.

### 2.4 Small wins — Amabile & Kramer 2011 [19] (OBS, diarios)
- 238 personas, ~12.000 entradas de diario: el evento que más predijo un buen día laboral fue **avanzar en algo significativo**, aunque fuera poco. Los retrocesos pesaron más que los avances (asimetría negativa).
- **Traducción**: cada sesión debería cerrar con **una** victoria concreta y verificable ("la `ñ` pasó de 62% a 80%", "primer reto sin mirar"). Y cuidado con los retrocesos visibles: si el WPM cae por cansancio, mostrar contexto ("promedio 7 días sigue subiendo") para no disparar la asimetría.

### 2.5 Flow y ajuste de dificultad — Wilson et al. 2019 [20] (modelo computacional)
- "Regla del 85%": para un aprendiz tipo gradiente-descendente en clasificación binaria, el aprendizaje es máximo con ~15.9% de error. Es un resultado teórico/computacional, no un RCT humano, pero coincide con la práctica de dificultad adaptativa y con la teoría de flow (desafío ≈ habilidad).
- Keybr aplica exactamente esto en mecanografía: desbloquea teclas nuevas solo cuando las previas superan un umbral de precisión [63].
- **Traducción**: el repaso adaptativo de TypeLight debería apuntar a **85–90% de precisión por tecla** en drills y decirlo explícitamente ("te doy ejercicios en los que fallás ~1 de cada 8; si fuera más fácil no aprenderías"). Esto además legitima el error (ver 2.6).

### 2.6 Mindset de crecimiento — Dweck y las réplicas [21] (MA)
- Sisk et al. 2018: dos meta-análisis (273 estudios, n=365.915; 43 intervenciones, n>57.000). El mindset explica ~1% de la varianza en rendimiento; las intervenciones dan **d = 0.08**. Efectos algo mayores en estudiantes de bajo nivel socioeconómico o en riesgo. Yeager & Dweck 2020 replicaron que el efecto es pequeño pero "no despreciable" en poblaciones específicas.
- **Traducción**: no vale la pena un "onboarding de mindset". Lo que sí vale es el **framing del error**: "un error es un dato sobre qué tecla practicar" (coherente con 2.5 y con el cambio de Duolingo de corazones a energía [42]).

---

## 3. Gamificación con evidencia

### 3.1 Meta-análisis y revisiones
- **Sailer & Homner 2020** [22] (MA): efectos pequeños-medios en resultados cognitivos (g = .49, k=19), motivacionales (g = .36, k=16) y conductuales (g = .25, k=9). Solo el cognitivo fue estable al filtrar por rigor metodológico. Moderadores útiles: **ficción/narrativa** y **competencia + colaboración** (no competencia sola) mejoraron lo conductual.
- **Hamari, Koivisto & Sarsa 2014** [23] (revisión de 24 estudios): efectos mayormente positivos pero **muy dependientes del contexto y del usuario**; muchos estudios sin grupo control, muestras chicas, plazos cortos.
- **Dicheva et al. 2015** [24] (mapeo de 34 papers): los elementos más usados son puntos, badges, leaderboards y niveles; la mayoría reporta resultados positivos, pero una porción importante es inconclusa o mide "uso" en vez de aprendizaje.
- **Hanus & Fox 2015** [25] (OBS longitudinal, 16 semanas, 2 cursos): el curso con **badges + leaderboard** terminó con menor motivación intrínseca, satisfacción y empoderamiento, y **peores notas** finales, mediado por la caída de motivación. Es el estudio-bandera del daño de puntos vacíos.
- **Hamari 2017** [26] (cuasi-experimento de campo, 2 años, n≈3.000): badges *sí* aumentaron actividad en un servicio de intercambio. Lectura conjunta: badges aumentan *uso* en contextos utilitarios, pero pueden dañar *aprendizaje* cuando desplazan el foco.
- **Toda, Valle & Isotani 2018** [29] (mapeo): cuatro efectos negativos documentados: **indiferencia, pérdida de rendimiento, conductas indeseadas (gaming the system) y efectos decrecientes**.

### 3.2 Efecto novedad
- Koivisto & Hamari 2014 [27] (encuesta, n≈200): los beneficios percibidos de la gamificación **decaen con el tiempo de uso**. Rodrigues et al. 2022 [28] (longitudinal, aula): confirmaron el efecto novedad pero también un **efecto familiarización** posterior si el sistema sigue siendo útil. Duolingo lo ve en notificaciones: una plantilla nueva convierte más y se desgasta; su bandit incluye una **penalización por recencia** (Yancey & Settles KDD 2020 [44], INT).
- **Traducción**: la semana 3 de TypeLight coincide con la caída de novedad de los 4 juegos y de la mascota. Contramedidas baratas: rotar qué juego aparece en la rutina, agregar *contenido* (textos nuevos, no mecánicas nuevas), y que la app muestre progreso *sustantivo* justo cuando la novedad cae (resumen semanal, récords).

### 3.3 Qué funciona / qué no, en una tabla corta
| Elemento | Evidencia neta | Comentario |
|---|---|---|
| Metas claras + feedback inmediato | Fuerte (Locke & Latham; Harkin) | Núcleo de cualquier app de práctica |
| Progreso visible (barra, calendario, mapa de habilidades) | Fuerte (Harkin; endowed progress [61]; goal-gradient [62]) | Mostrar progreso "dotado" y aceleración cerca de la meta |
| Racha (con perdón) | Fuerte en INT de Duolingo; teoría de slack [9][10] | Ver §4 y §6 |
| Narrativa / mascota | Pequeño (Sailer; Schroeder) | Solo si no distrae del drill |
| Puntos/XP por volumen | Débil a negativo (Hanus & Fox; Deci) | Evitar |
| Badges genéricos | Mixto (Hamari 2017 sí; Hanus & Fox no) | Solo hitos con significado |
| Leaderboards | Negativo para perfiles no competitivos | N/A en single-user |
| Penalizar errores (corazones) | Negativo (Duolingo lo retiró [42]) | Evitar |

---

## 4. Duolingo en detalle (con fuentes y nivel de evidencia)

Advertencia: casi todo lo de Duolingo es **dato interno no auditado** (A/B tests en blogs corporativos o entrevistas de ex-ejecutivos). Es valioso porque la escala es enorme, pero está seleccionado para contar una historia.

### 4.1 La racha — la palanca de retención más fuerte (y cómo la ablandaron)
- **Origen** (Mazal, ex-CPO, en Lenny's Newsletter [36], INT/entrevista): un APM del equipo de retención vio que los usuarios que llegaban a **10 días de racha** abandonaban mucho menos. Primera victoria: la **notificación "streak saver"** de última hora. Después: calendario de racha, animaciones, cambios al freeze, recompensas; cada uno "mejoró retención materialmente". La participación de DAU con racha ≥7 días **casi se triplicó hasta más de la mitad del DAU**. Contexto: DAU creció 4.5× entre fines de 2017 y la IPO de 2021.
- **Desacoplar racha de meta diaria** (blog "Improving the streak" [37], INT): antes, extender la racha exigía cumplir la meta de XP; casi el **40%** de los que practicaban dos días seguidos sin racha tenían meta "intense". Cambiaron a "una lección extiende la racha". Resultado a 20 días: **+3.3% D14, +1% DAU, +10.5% de learners diarios con racha, +19% de nuevos con racha**; al año, la mitad del DAU tenía racha ≥7 (antes un tercio). Dato: usuarios con racha de 7 días son **2.4× más propensos a volver al día siguiente**.
- **Psicología declarada** (blog "How the streak builds habit" [38], INT + cita de investigación externa): pasar de 2 a 3 días es +50%, de 200 a 201 es +0.5% — la racha motiva distinto según la longitud; para rachas largas opera la aversión a la pérdida. Números: animaciones nuevas al extender **+1.7% D7**; alcanzar 7 días → **3.6× más probable completar el curso**; permitir **dos freezes equipados** → **+0.38% DAU** (citan a Sharif/Shu-Milkman sobre slack [9]).
- **Streak Wager y Weekend Amulet** (blog "How streaks keep learners committed" [39], INT): apostar gemas a mantener 7 días → **+14% D7**, subas significativas en D1 y D14. Amuleto de fin de semana → **+4%** de retorno a la semana y **5% menos** de pérdida de racha; hay una caída de **5–10%** de uso los fines de semana. Observación clave: **los que "bingean" abandonan más que los que se dosifican**.
- **Streak repair**: hoy se puede reparar con gemas o con Super Duolingo; existe una ventana de días para hacer lecciones especiales y restaurarla [Fast Company, help center]. No hay dato público de su efecto en retención; es una mecánica de monetización tanto como de retención. "Streak Society" es un club para rachas ≥365 días con perks cosméticos (help center; sin datos).
- **Friend Streak** (blog [40], INT): con al menos una racha compartida, **+22%** de probabilidad de completar la lección diaria, creciendo con más amigos. Es compromiso interpersonal (Rogers, Milkman & Volpp 2014 [13]).
- **Qué aplica a TypeLight**: (a) racha *fácil de extender* (calentamiento = día activo); (b) freezes automáticos ganados por practicar, no comprados; (c) hitos a 7/14/30/66 días con celebración; (d) calendario con "días activos" y "mejor racha"; (e) sin wager con moneda; (f) el "friend streak" se puede emular con un texto para pegar en WhatsApp a un compañero de compromiso (ver §5 Wordle).

### 4.2 Metas diarias
- Cinco niveles (Basic 1 XP, Casual 10, Regular 20, Serious 30, Intense 50). El dato de [37] muestra que metas altas **castigaban** la racha. Duolingo nunca publicó qué nivel eligen los usuarios ni retención por nivel.
- **Traducción**: meta configurable en **minutos o días/semana**, con default suave (10 min, 5/7) y sin que la meta afecte la racha. Autonomía (SDT) + slack (Sharif & Shu).

### 4.3 Ligas / leaderboards
- Blog oficial [45] (INT): +17% de tiempo de aprendizaje y **triplicó** los "altamente comprometidos" (1 h/día, 5 días). Mazal [36]: D1/D7 mejoraron con significancia. Diseño: 30 usuarios aleatorios, semana, ascenso/descenso.
- Problemas: la propia Duolingo reconoce que "no son para todos" y permite desactivarlas poniendo el perfil privado; foros y análisis de terceros hablan de "league fatigue" y de grinding de XP con ejercicios fáciles (OP/anecdótico; sin dato público). Hanus & Fox [25] y Toda [29] documentan el daño de la comparación social en perfiles no competitivos.
- **Traducción**: **no aplica** (usuario único). El sustituto sano es la **competencia contra uno mismo**: "Carrera contra tu fantasma" ya lo hace; extenderlo a "tu mejor semana" o "vos hace 30 días".

### 4.4 Notificaciones
- Yancey & Settles KDD 2020 [44] (paper con datos internos): bandit "sleeping/recovering" con penalización por recencia para elegir plantilla; **+0.5% DAU, +2% retención de nuevos**. Mazal [36]: "proteger el canal" (no spamear) y decenas de mejoras chicas acumuladas. El "Duo amenazante" es un meme de 2019 que Duolingo adoptó como marketing; Growth.design [48] documenta que las notificaciones se **auto-apagan** tras inactividad.
- **Traducción**: sin push. Alternativas locales: (1) implementation intention en Home; (2) acceso directo/PWA en escritorio; (3) *opcional* una tarea programada de Windows que abra la URL a la hora elegida (equivale a un recordatorio sin backend); (4) badge en el título de la pestaña ("TypeLight · hoy pendiente"). Nada de culpa.

### 4.5 Practice Hub / repaso de errores
- Blog [43] (INT, sin datos): centraliza "Mistakes review", vocabulario, speaking, listening. Rationale: practicar sobre material reciente y propio. No hay dato de efecto publicado.
- **Traducción**: TypeLight ya tiene repaso adaptativo. Lo que falta es hacerlo *legible*: "Hoy repasás `q`, `p` y `;` porque fallaste 3 de 10 ayer" (el "por qué hoy").

### 4.6 Rediseño a ruta única (2022, "path")
- Blog [41] (INT, sin métricas publicadas): motivo declarado: los learners no sabían "cuál era la forma correcta" de usar la app; la ruta lineal elimina la decisión, **integra la práctica como avance** (no como "volver atrás") y reordena contenido con **repetición espaciada**. Análisis de terceros lo critican por rigidez (Medium "Duo's Cage").
- **Traducción**: TypeLight ya tiene ruta. Lección útil: **la práctica/repaso debe verse como avanzar en la ruta**, no como un desvío. Si el repaso adaptativo vive fuera de la ruta, integrarlo como nodo.

### 4.7 Legendary, Perfect lesson, Daily Quests, combos
- Legendary (2021): nivel extra difícil por unidad, sin errores permitidos (X/Twitter oficial; sin datos). Combo bonus: XP extra por rachas de aciertos dentro de una lección (wiki). Daily Quests: 3 misiones por día; un análisis de terceros afirma "+25% DAU" al introducirlas — **no verificado** en fuente oficial.
- **Traducción**: "Perfect" tiene sentido como **estrella 3 = sin errores** (ya existe). Un "Legendary" local sería un **desafío opcional sin backspace** por lección, una vez que la precisión es alta. Quests diarias: en single-user, una sola "misión del día" generada desde datos propios ("hoy: 90% en `ñ`") es más honesta que tres genéricas.

### 4.8 Hearts → Energy (2025)
- Blog oficial [42] (INT): "cada error costaba un corazón... no era la manera más efectiva de apoyar el aprendizaje"; los principiantes tenían **2× más probabilidad** de quedarse sin corazones a mitad de lección. Energy se gasta por ejercicio y se **recupera con aciertos** y con "lecciones perfectas". Reacción: fuerte rechazo de usuarios y críticos que lo leen como monetización disfrazada [46][47] (OP).
- **Traducción**: **no penalizar errores con recursos**. Un usuario solo, sin monetización, no tiene ninguna razón para tener corazones ni energía.

### 4.9 Duo, la mascota
- Duolingo usa Rive para animar a Duo con múltiples estados emocionales que reaccionan a la actividad (blog "Building character"; Creative Bloq) — se alegra al practicar, "llora" al faltar. Análisis de terceros atribuyen a la mascota parte del crecimiento (OP, no cuantificable).
- **Traducción**: ver §7.3. Reacciones alegres sí; culpa por faltar, no (ver Headspace [50]).

### 4.10 Year in Review
- 10 páginas de stats (lecciones, minutos, palabras, racha), con incentivo a compartir (badge/ícono) [49]. Sin datos públicos de efecto; hereda el patrón Spotify Wrapped.
- **Traducción**: un **"Mes en resumen"** local (no anual: a 30 días necesita el primer hito) con: minutos, días activos, WPM promedio 7 días al inicio vs. fin, teclas dominadas, récords. Exportable como imagen/texto.

### 4.11 Investigación y cultura pública
- research.duolingo.com publica papers (notificaciones, half-life regression para spaced repetition, etc.). El "Duolingo Handbook" existe como documento de cultura público (2024) con principios como "take the long view" y una cultura de "testear todo y escalar solo lo que gana" (cobertura en Fortune/HR Grapevine [65]; no leí el handbook completo). Mazal [36] es la fuente más rica sobre *producto*; el resto son blogs del equipo de aprendizaje.
- **Qué NO aplica a TypeLight**: ligas, friend quests, gemas, notificaciones, streak repair pago, energía. **Qué SÍ**: racha fácil de extender + freeze automático, hitos, animación al extender, práctica integrada como avance, mascota que celebra, resumen periódico, "una lección cuenta".

---

## 5. Otras apps de práctica diaria — mecanismo específico y qué sirve para un usuario local

| App | Mecanismo | Evidencia | Qué tomar para TypeLight |
|---|---|---|---|
| **Anki** | "Due today": cola de repaso espaciado. El backlog tras faltar unos días es el killer clásico (cientos de tarjetas vencidas). Estudios en medicina muestran asociación positiva con notas, pero reportan carga temporal, monotonía y sobrecarga como riesgos [56] (OBS). | Tomar la idea de "hoy toca X" pero **capar el backlog**: nunca mostrar "47 teclas atrasadas"; mostrar "hoy: 5 teclas" y absorber el resto en días siguientes. |
| **Headspace / Calm** | "Run streak" explícitamente framed como "aliento, no juicio": "todos faltamos días y está bien" [50]. Calm muestra "Mindful Days", minutos y racha más larga (no solo la actual). | Copiar el **tono** y mostrar **"mejor racha"** y **"días activos totales"** junto a la actual, para que perder la racha no borre la historia. |
| **Strava** | Récords personales por segmento, "Year in Sport", kudos; 66% de runners/ciclistas lograron un PR en segmentos en el año (dato de prensa Strava [53], INT). Grupos → mayor retención a 12 meses (INT). | **PRs por "segmento"**: mejor reto 1 min, mejor precisión en `ñ`, mejor lección X. Récords a varias escalas (día / 7 días / 30 días) para que siempre haya alguno cerca. |
| **chess.com / Lichess** | Puzzle Streak (progresivo, sin reloj, un error termina) y Puzzle Storm/Rush (3 min, cuántos resolvés); Storm **no afecta el rating** [54]. Rating de puzzles separado del de partidas. | Ya tienen reto de 1 min. Un modo **"Racha de palabras"** (sin reloj, una falla la corta) es barato y da un récord nuevo. Separar métricas "de juego" de las "oficiales" (ya lo hacen con anti-inflado). |
| **Yousician / Simply Piano** | Feedback en tiempo real nota por nota, estrellas por canción, repetir hasta "perfect", canciones conocidas desde la semana 2 (reviews [58]). | Feedback **inmediato por tecla** (ya está). Sumar **textos "reconocibles"** (letras de canciones, citas, código propio) como recompensa de contenido, no de puntos. |
| **Elevate / Peak** | Elevate: EPQ 0–5000 por habilidad, 3–5 juegos/día [57]; Peak: "brain map" por categoría. | **Mapa por tecla/dedo/fila** con nivel 0–100 (competencia visible; Harkin). Un índice compuesto solo si es honesto y anti-inflado. |
| **Brilliant** | Racha requiere 3 problemas o una lección; "streak charge" protege un día; equipo de "User Motivation" con animaciones Rive para celebrar extensión de racha [51][52]. | Umbral bajo y explícito para "día activo"; una **animación corta** al extender racha (Duolingo midió +1.7% D7 con esto [38]). |
| **Streaks / Habitica** | Streaks: cadena visual mínima, metas "N veces por semana"; Habitica: RPG completo (encuestas propias, sin evidencia externa seria). | La opción **"N días por semana"** de Streaks es el modelo de meta suave. Habitica: no copiar; es gamificación pesada con alto abandono. |
| **Wordle** | Un puzzle por día (escasez → ritual), misma palabra para todos, grilla compartible sin spoiler [59] (OP). | **"Reto del día" con semilla fija** + botón "copiar resultado" (grilla de emojis con WPM/precisión) para pegarle a un amigo. Es el único "social" viable sin backend y funciona como commitment device. |
| **Monkeytype / Keybr** | Monkeytype: stats, historial, PBs, temas. Keybr: desbloquea teclas por precisión (dificultad adaptativa real) [63]. | TypeLight ya combina ambos. Del dataset de 136M keystrokes (Dhakal et al. 2018 [55], OBS n=168k): los rápidos **cometen menos errores** y usan rollover; priorizar **precisión sobre velocidad** es correcto y debe decirse en onboarding. |

---

## 6. Evitar lo tóxico: rachas amables y dark patterns

### 6.1 Dark patterns en juegos
- Zagal, Björk & Lewis 2013 [30]: patrones **temporales** (grinding, "jugar por cita" con aversión a la pérdida), **monetarios** y de **capital social**. Deterding, Stenros & Montola 2020 [31] critican el concepto ("dark" es relativo al contrato jugador-diseñador) pero rescatan los valores: **transparencia** y evitar **arrepentimiento**.
- Test para TypeLight: ¿la mecánica sigue teniendo sentido si el usuario es el mismo que la programó y no hay nada que vender? Si no, es dark pattern.

### 6.2 Streak anxiety y aversión a la pérdida
- La aversión a la pérdida es real y Duolingo la usa explícitamente [38]. Los posts que circulan ("un estudio CHI 2020 dice que 63% abandona tras romper la racha") **no pude verificarlos** en fuente primaria; los trato como no evidencia. Lo que sí está: Lally (faltar un día no importa), Sharif & Shu (slack con costo aumenta persistencia), Beshears (flexibilidad > rigidez incluso post-intervención), y Headspace/Brilliant/Duolingo convergiendo en perdón.

### 6.3 Diseño de racha amable (recomendación concreta)
1. **Día activo = calentamiento completo** (≈90 s). La rutina completa suma más, pero no es condición.
2. **Freeze automático**: cada 5 días activos ganás 1 freeze (máx. 2 en stock). No se compra; se gana practicando. Se consume solo, sin pedir nada.
3. **"Nunca dos veces"**: tras un día perdido sin freeze, Home muestra "Ayer no; hoy sí y la cadena sigue" y la racha se mantiene si practica hoy (esto es un freeze implícito de 1 día, equivalente al "streak repair" pero gratis y sin drama).
4. **Contar semanas**: "Semanas activas: 6" (semana activa = ≥4 días). Es la métrica que sobrevive a vacaciones.
5. **Mostrar siempre "mejor racha" y "días activos totales"** al lado de la actual.
6. **Nunca** poner a la mascota triste ni usar copy de culpa. Copy de retorno: "Volviste. Arrancamos con algo corto."
7. **Meta semanal configurable** (default 5/7) separada de la racha (Locke & Latham + Sharif & Shu + Beshears).

### 6.4 ¿"N días/semana" o "todos los días"?
- No hay un RCT limpio que compare metas "5/7" vs "7/7" en apps. Evidencia indirecta: Lally (repetición en contexto estable; un día perdido no importa), Kaushal & Rhodes (≥4/semana bastó), Beshears (flexibilidad > rutina rígida), Sharif & Shu (meta difícil + reserva > meta fácil). Síntesis: **apuntar a diario, exigir 5/7**. La racha diaria se conserva como *señal*; la meta semanal es lo que se *evalúa*.

---

## 7. Feedback y celebración

### 7.1 Cuánto celebrar
- Fogg [7] (OP): la emoción positiva inmediata "cablea" el hábito; no hay RCT que lo aísle. Deci et al. [14] (MA): feedback verbal positivo aumenta motivación intrínseca. Kao et al. CHI 2024 [34] (RCT online, varios estudios): el feedback "juicy" puede aumentar curiosidad y competencia, pero la **amplificación** (feedback desproporcionado a la acción) **redujo** competencia y effectance percibidas. Juul & Begy 2016 (n=46) no encontraron diferencia; Hicks et al. 2019 [35] hallaron mejora estética sin mejora de rendimiento.
- Regla derivada: **la celebración tiene que ser proporcional y verídica**. Confetti/sonido para: rutina completada, récord real, hito de días, tecla que pasa a "dominada". Micro-feedback (tick, color) para aciertos. Nada para "abriste la app".

### 7.2 Récords y resúmenes
- Base: Harkin [8] (monitoreo, d ≈ .40, más fuerte si se registra visiblemente), Amabile [19] (avances pequeños), goal-gradient (Kivetz 2006 [62]: el esfuerzo acelera cerca de la meta) y endowed progress (Nunes & Drèze 2006 [61]: 34% vs 19% de completitud cuando la tarjeta arranca con 2 sellos "regalados").
- Récords en varias escalas para que siempre haya uno cerca: **mejor reto** (1 min), **mejor promedio 7 días**, **mejor precisión de la semana**, **mejor lección**. Anunciar solo si es honesto (anti-inflado ya existe).
- **Resumen semanal (lunes, fresh start [11])**: minutos, días activos, WPM 7d vs. semana anterior, precisión, teclas nuevas dominadas, 1 frase de la mascota. **Resumen mensual**: lo mismo + gráfico de curva + "estás en el día N de ~66".
- **Progreso dotado**: la barra semanal arranca mostrando el lunes ya marcado si practicó; el mapa de teclas arranca con las que ya sabe (no desde cero).

### 7.3 La mascota como agente pedagógico
- Schroeder, Adesope & Gilbert 2013 [32] (MA, 43 estudios, n=3.088): efecto **pequeño** positivo en aprendizaje; mayor en K-12 que en adultos; **texto en pantalla > narración**. Lester et al. 1997 [33] ("persona effect"): un agente con afecto mejoró percepción de la experiencia; réplicas posteriores cuestionaron los controles. Mayer (principio de imagen): la sola presencia de un agente en pantalla no mejora el aprendizaje y puede sumar carga extraña.
- Reglas para TypeLight: (1) durante el drill la mascota **no** debe estar en el campo visual del texto; su reacción a errores debe ser periférica y breve; (2) en Home y al cierre, mensajes de **una línea**, informativos ("Tu `p` subió a 88%") o de aliento; (3) personalidad consistente (5–8 estados), sin culpa; (4) opción de silenciarla (autonomía).

---

## 8. Onboarding y "por qué"

- **Expectativa realista** (Lally [1], Buyalskaya [2], Dhakal [55]): "10 min por día, 5 días por semana. En 2–3 semanas vas a tipear *más lento* que mirando el teclado; es normal. Alrededor de la semana 8–10 el tacto se vuelve automático. La precisión es lo que hace la velocidad, no al revés."
- **Meta de resultado con fecha** (Locke & Latham [17]; Zimmerman [18]): habilitarla recién cuando la precisión a tacto ≥ ~90% en teclas base; proponer "40 wpm a ≥95% el DD/MM" (12 semanas). Hasta entonces, meta de proceso.
- **Implementation intention** (Gollwitzer [6]): "¿Después de qué vas a practicar?" + "¿dónde?" (frase visible en Home).
- **Commitment device** (Rogers, Milkman & Volpp [13]; Friend Streak [40]): opcional, "elegí a alguien a quien mandarle tu resumen semanal" con botón copiar. Sin backend, el compromiso es social vía copiar-pegar.
- **Temptation bundling** [12]: el modo Jugar detrás de la rutina ya es esto; explicitarlo en onboarding ("los juegos se abren cuando terminás la rutina").
- **Fresh start** [11]: si vuelve tras >7 días, ofrecer "Empezar de nuevo desde hoy" con calibración corta, sin borrar historial.

---

## 9. Tabla maestra — Mecanismo → quién lo hace → evidencia → traducción a TypeLight → riesgo → esfuerzo

| Mecanismo | Quién lo hace | Evidencia (nivel) | Traducción a TypeLight (single-user, local) | Riesgo / toxicidad | Esfuerzo |
|---|---|---|---|---|---|
| Implementation intention (ancla) | Tiny Habits, Atomic Habits; Duolingo (hora de recordatorio) | Gollwitzer & Sheeran 2006 d=.65 (MA) | Onboarding + Ajustes: "Después de ___, practico ___ min". Mostrar en Home. | Ninguno | S |
| Racha fácil de extender | Duolingo (1 lección), Brilliant (3 problemas) | Duolingo A/B: +3.3% D14 (INT) | Día activo = calentamiento completo | Que "cuente" sin aprender; mitigado porque el calentamiento es real | S |
| Streak freeze automático (slack) | Duolingo (2 equipables), Brilliant (charge) | Sharif & Shu 2017 (RCT); Duolingo +0.38% DAU (INT) | 1 freeze cada 5 días activos, máx. 2, se consume solo | Si se compra o se pierde por sorpresa → ansiedad | S |
| "Nunca dos veces" / repair gratis | Duolingo (repair pago) | Lally (un día no importa, OBS); Clear (OP) | Un día perdido se perdona si practica el siguiente | Abuso (alternar días); aceptable | S |
| Meta semanal N/7 configurable | Streaks app, Strava goals | Beshears 2021 (RCT), Locke & Latham (MA-ish) | Default 5/7; separada de la racha | Meta demasiado alta → efecto "intense" de Duolingo | S |
| Contar semanas activas | Calm ("Mindful Days"), Headspace | Kaushal & Rhodes ≥4/sem (OBS) | "Semanas activas: N" (≥4 días) en Progreso | Ninguno | S |
| Mejor racha + días activos totales | Calm, Strava | Harkin (monitoreo, MA) | Mostrar junto a la racha actual | Ninguno | S |
| Hitos (7/14/30/66/100 días) | Duolingo milestones, Brilliant | Duolingo (7 días → 2.4×–3.6×, INT); goal-gradient (RCT campo) | Celebración corta + tarjeta; "día 66" con explicación de Lally | Badge vacío si no hay copy con significado | S/M |
| Animación al extender racha | Duolingo, Brilliant (Rive) | Duolingo +1.7% D7 (INT); Kao 2024 (RCT, proporcional) | Animación ≤1.5 s en Home al completar día | Sobrecelebrar → menor competencia percibida | S |
| Resumen semanal (lunes) | Strava, Duolingo YIR, Apple Fitness | Harkin (MA); Amabile (OBS); fresh start (OBS/RCT) | Modal el primer acceso de la semana: minutos, días, WPM 7d Δ, precisión, teclas dominadas | Mostrar retroceso sin contexto (asimetría negativa) | M |
| Resumen mensual / "Mes en resumen" | Duolingo YIR, Strava | Igual + endowed progress | Página en Progreso + exportar imagen | Ninguno | M |
| Récords personales multi-escala | Strava (segmentos), Monkeytype (PB) | SDT competencia (RCT/enc.); Amabile | "Nuevo mejor reto", "mejor 7 días", "mejor precisión"; solo con anti-inflado | Récords falsos → cinismo; ya mitigado | M |
| Mapa de habilidad por tecla/dedo/fila | Elevate (EPQ), Peak (brain map), Keybr | Harkin; SDT competencia | Heatmap de teclado 0–100 con tendencia | Sobrecarga visual; ponerlo en Progreso, no en Home | M |
| "Por qué hoy" (repaso explicado) | Duolingo Practice Hub, Anki due | Transparencia (Deterding); autonomía SDT | Línea en Home: "Hoy: `q` `p` `;` porque…" | Ninguno | S |
| Cap de backlog | Anki (anti-patrón) | OBS (sobrecarga) | Repaso nunca muestra atraso; máx. N teclas/día | Ninguno | S |
| Dificultad ~85–90% | Keybr, Duolingo path | Wilson 2019 (computacional) | Repaso adaptativo apunta a 85–90% precisión; decirlo | Demasiado difícil → frustración | M |
| Meta de resultado con fecha (tras proceso) | Duolingo daily goal, Strava goals | Locke & Latham; Zimmerman & Kitsantas (RCT) | Habilitar "40 wpm @95% el DD/MM" cuando precisión ≥90% | Tunnel vision si se habilita muy temprano | M |
| Reto del día con semilla + compartir grilla | Wordle, Lichess daily | OP + commitment devices (JAMA) | Texto/emoji copiable con WPM y precisión del reto | Presión social no deseada; opcional | S |
| Racha de palabras (sin reloj, un error corta) | Lichess Puzzle Streak | Producto | Juego 5 con récord propio | Ansiedad de "una falla"; es opcional | M |
| Modo "Legendary" (sin backspace) | Duolingo Legendary | Producto | Desafío opcional por lección ya dominada | Frustración si se ofrece antes de tiempo | S/M |
| Mascota que celebra, no que culpa | Duolingo (ambos), Headspace (tono) | Schroeder 2013 (MA pequeño); Mayer | Reacciones periféricas en drill; 1 línea en Home; silenciable | Distracción; culpa | S/M |
| Mensajes de retorno sin culpa | Headspace | OP corporativo + fresh start | "Volviste. Hoy corto." + calibración opcional | Ninguno | S |
| Temptation bundling (Jugar tras rutina) | TypeLight ya | Milkman 2014 (RCT) | Mantener; explicitar en onboarding | Ninguno | S |
| Trigger local (PWA/acceso directo/tarea programada) | — | Wood & Neal (contexto) | PWA instalable; opcional .bat/Task Scheduler que abra la URL | Ninguno | S |
| Contenido reconocible (letras, citas, código) | Yousician, Simply Piano | Reviews (OP); SDT autonomía | Textos del reto/lecciones elegibles por tema | Ninguno | M |
| Ligas / leaderboards | Duolingo, Yousician | Mixto; negativo para no competitivos | **No aplica** | Alto | — |
| Corazones / energía | Duolingo | Retirado por la propia Duolingo | **No aplicar** | Alto | — |
| Wager con moneda / freeze comprable | Duolingo | +14% D7 pero mecánica de monetización | **No aplicar** (sin moneda) | Alto | — |
| XP por volumen / badges genéricos | Duolingo, Habitica | Hanus & Fox negativo | **No aplicar** | Medio | — |

---

## 10. Top 10 recomendaciones priorizadas (para que Seba siga a los 30, 60 y 90 días)

Ordenadas por (evidencia × impacto esperado) / esfuerzo. Cada una dice en qué ventana pega.

1. **Onboarding de expectativas + ancla (S, días 1–30).** Pantalla única: "10 min, 5 días/semana, ~10 semanas. Vas a ser más lento 2–3 semanas. Precisión primero." + "Después de ___ practico". Guardar y mostrar en Home. *Evidencia: Gollwitzer d=.65; Lally; Dhakal.* Es lo más barato y lo que más protege la semana 3.
2. **Racha amable: día activo = calentamiento, freeze automático (1 cada 5 días, máx. 2), perdón de un día, mostrar mejor racha y días activos (S, días 1–90).** *Evidencia: Duolingo [37][38]; Sharif & Shu; Beshears; Lally.* Elimina la ansiedad sin perder la señal.
3. **Meta semanal configurable (default 5/7) separada de la racha + "semanas activas" (S, días 1–90).** *Evidencia: Locke & Latham; Beshears; Kaushal & Rhodes.* Autonomía (SDT) sin castigar.
4. **"Por qué hoy" + cap de backlog en el repaso (S, días 1–60).** Una línea en Home que explique qué teclas toca y por qué; nunca mostrar atraso. *Evidencia: transparencia (Deterding); Anki como anti-patrón; SDT autonomía.*
5. **Resumen semanal los lunes (M, clave días 14–60).** Minutos, días, WPM 7d vs. anterior, precisión, teclas dominadas, una victoria concreta. *Evidencia: Harkin d=.40; Amabile; fresh start.* Es el antídoto directo al decaimiento de novedad de la semana 3–5.
6. **Récords personales honestos, multi-escala, con celebración proporcional (M, días 7–90).** Mejor reto, mejor 7 días, mejor precisión, mejor lección; confetti ≤1.5 s + mascota feliz solo ahí. *Evidencia: SDT competencia; Kao 2024 (proporcional); Deci (feedback informativo).*
7. **Hitos de días con significado (S/M, días 7, 14, 30, 66, 100).** El de 66 explica Lally ("a partir de acá ya es hábito para la mayoría"); el de 30 dispara el "Mes en resumen". *Evidencia: Duolingo (7 días → 2.4×/3.6×, INT); goal-gradient.*
8. **Mapa de teclado por tecla/dedo (M, días 14–90).** Heatmap 0–100 con tendencia; es la "competencia visible" que la gamificación sola no da. *Evidencia: meta-análisis SDT 2023 (competencia no sube con game elements); Harkin.*
9. **Transición automática de meta de proceso a meta de resultado con fecha (M, día ~30–45).** Cuando precisión a tacto ≥90% en fila base, proponer "40 wpm @95% para el DD/MM" y mostrar la curva. *Evidencia: Zimmerman & Kitsantas; Locke & Latham.* Da un "segundo arranque" cuando la novedad ya murió.
10. **Mascota con reglas: periférica en drills, una línea en Home, nunca culpa, silenciable (S/M, días 1–90).** Reacciones: alegría al completar día/récord; neutral-alentadora al volver. *Evidencia: Schroeder (efecto pequeño, texto > voz); Mayer (imagen no ayuda per se); Headspace (tono).*

**Mención especial (S, opcional):** "Reto del día" con semilla fija + botón "copiar resultado" estilo Wordle para mandarle a un amigo. Único mecanismo social viable sin backend; funciona como commitment device (JAMA 2014; Friend Streak +22% INT). Y "Racha de palabras" (Lichess Puzzle Streak) como quinto juego si se quiere un récord nuevo barato.

**Qué NO hacer:** ligas, corazones/energía, monedas, wagers, XP por volumen, badges genéricos, mascota triste, notificaciones de culpa, mostrar backlog, celebrar todo.

### Mapa por ventana
- **Días 1–30 (novedad alta, técnica cae):** 1, 2, 3, 4, 10. Objetivo: que abrir la app sea trivial y que la métrica que sube sea la precisión/cobertura, no el WPM.
- **Días 30–60 (novedad muerta, hábito a medio formar):** 5, 6, 7 (hito 30 + Mes en resumen), 8, 9. Objetivo: reemplazar novedad por progreso percibido y darle una meta nueva.
- **Días 60–90 (consolidación):** hito 66, meta de resultado con fecha, modo Legendary/sin backspace, contenido nuevo (textos propios/código), y bajar el andamiaje (menos celebración, más datos). Objetivo: que la app pase de "motivadora" a "herramienta", que es lo que sobrevive al año.

---

## 11. Fuentes

Ciencia del hábito y motivación
1. Lally, P., van Jaarsveld, C., Potts, H., Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. *Eur. J. Soc. Psychol.* — https://onlinelibrary.wiley.com/doi/abs/10.1002/ejsp.674 [OBS]
2. Buyalskaya, A. et al. (2023). What can machine learning teach us about habit formation? Evidence from exercise and hygiene. *PNAS* (con corrección 2023) — https://www.pnas.org/doi/10.1073/pnas.2216115120 [OBS]
3. Kaushal, N., Rhodes, R. (2015). Exercise habit formation in new gym members. *J. Behav. Med.* — https://link.springer.com/article/10.1007/s10865-015-9640-7 [OBS]
4. Wood, W., Neal, D. (2007). A new look at habits and the habit–goal interface. *Psychol. Rev.* — https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/wood.neal_.2007psychrev_a_new_look_at_habits_and_the_interface_between_habits_and_goals.pdf [teoría]
5. Wood, W., Quinn, J., Kashy, D. (2002). Habits in everyday life. *JPSP* — https://dornsife.usc.edu/wendy-wood/wp-content/uploads/sites/183/2023/10/Wood.Quinn_.Kashy_.2002_Habits_in_everyday_life.pdf [OBS]
6. Gollwitzer, P., Sheeran, P. (2006). Implementation intentions and goal achievement: a meta-analysis. *Adv. Exp. Soc. Psychol.* — https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes [MA]
7. Fogg Behavior Model / Tiny Habits — resumen crítico en The Behavioral Scientist — https://www.thebehavioralscientist.com/articles/fogg-behavior-model [OP]
8. Harkin, B. et al. (2016). Does monitoring goal progress promote goal attainment? *Psychol. Bull.* — https://pubmed.ncbi.nlm.nih.gov/26479070/ [MA]
9. Sharif, M., Shu, S. (2017). The benefits of emergency reserves. *J. Marketing Res.* — https://journals.sagepub.com/doi/abs/10.1509/jmr.15.0231 ; divulgación UCLA Anderson — https://anderson-review.ucla.edu/emergency-reserves/ [RCT]
10. Beshears, J., Lee, H., Milkman, K., Mislavsky, R., Wisdom, J. (2021). Creating exercise habits using incentives: the trade-off between flexibility and routinization. *Management Science* — https://pubsonline.informs.org/doi/10.1287/mnsc.2020.3706 [RCT campo]
11. Dai, H., Milkman, K., Riis, J. (2014). The fresh start effect. *Management Science* — https://pubsonline.informs.org/doi/10.1287/mnsc.2014.1901 [OBS + RCT]
12. Milkman, K., Minson, J., Volpp, K. (2014). Holding the Hunger Games hostage at the gym: temptation bundling. *Management Science* — https://pubsonline.informs.org/doi/10.1287/mnsc.2013.1784 [RCT campo]
13. Rogers, T., Milkman, K., Volpp, K. (2014). Commitment devices. *JAMA* — https://pubmed.ncbi.nlm.nih.gov/24777472/ [viewpoint]
14. Deci, E., Koestner, R., Ryan, R. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychol. Bull.* — https://home.ubalt.edu/tmitch/642/articles%20syllabus/Deci%20Koestner%20Ryan%20meta%20IM%20psy%20bull%2099.pdf [MA]
15. Ryan, R., Rigby, C., Przybylski, A. (2006). The motivational pull of video games: a SDT approach. *Motivation & Emotion* — https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf [RCT/encuesta]
16. (2023). Gamification enhances student intrinsic motivation, perceptions of autonomy and relatedness, but minimal impact on competency: a meta-analysis. *ETR&D* — https://link.springer.com/article/10.1007/s11423-023-10337-7 [MA]
17. Locke, E., Latham, G. (2002). Building a practically useful theory of goal setting: a 35-year odyssey. *Am. Psychol.* — https://pubmed.ncbi.nlm.nih.gov/12237980/ [revisión]
18. Zimmerman, B., Kitsantas, A. (1997). Developmental phases in self-regulation: shifting from process to outcome goals. *J. Educ. Psychol.* — https://www.researchgate.net/publication/232582156_Developmental_phases_in_self-regulation_Shifting_from_process_to_outcome_goals_Journal_of_Educational_Psychology_89_29-36 [RCT]
19. Amabile, T., Kramer, S. (2011). The power of small wins. *HBR* — https://hbr.org/2011/05/the-power-of-small-wins [OBS diario]
20. Wilson, R., Shenhav, A., Straccia, M., Cohen, J. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications* — https://www.nature.com/articles/s41467-019-12552-4 [computacional]
21. Sisk, V. et al. (2018). To what extent and under which circumstances are growth mind-sets important to academic achievement? *Psychol. Sci.* — https://journals.sagepub.com/doi/10.1177/0956797617739704 [MA]

Gamificación
22. Sailer, M., Homner, L. (2020). The gamification of learning: a meta-analysis. *Educ. Psychol. Rev.* — https://eric.ed.gov/?id=EJ1245270 [MA]
23. Hamari, J., Koivisto, J., Sarsa, H. (2014). Does gamification work? *HICSS* — https://www.computer.org/csdl/proceedings-article/hicss/2014/2504d025/12OmNzE54xe [revisión]
24. Dicheva, D. et al. (2015). Gamification in education: a systematic mapping study — https://www.wssu.edu/profiles/dichevc/gamification-education-where-are2015.pdf [mapeo]
25. Hanus, M., Fox, J. (2015). Assessing the effects of gamification in the classroom: a longitudinal study. *Computers & Education* — https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000 [OBS longitudinal]
26. Hamari, J. (2017). Do badges increase user activity? A field experiment. *Computers in Human Behavior* — https://www.sciencedirect.com/science/article/abs/pii/S0747563215002265 [cuasi-experimento]
27. Koivisto, J., Hamari, J. (2014). Demographic differences in perceived benefits from gamification — https://www.researchgate.net/publication/260432497_Demographic_differences_in_perceived_benefits_from_gamification [encuesta]
28. Rodrigues, L. et al. (2022). Gamification suffers from the novelty effect but benefits from the familiarization effect — https://www.researchgate.net/publication/358614501_Gamification_suffers_from_the_novelty_effect_but_benefits_from_the_familiarization_effect_Findings_from_a_longitudinal_study [OBS longitudinal]
29. Toda, A., Valle, P., Isotani, S. (2018). The dark side of gamification — https://link.springer.com/chapter/10.1007/978-3-319-97934-2_9 [mapeo]
30. Zagal, J., Björk, S., Lewis, C. (2013). Dark patterns in the design of games. *FDG* — http://www.fdg2013.org/program/papers/paper06_zagal_etal.pdf [conceptual]
31. Deterding, S., Stenros, J., Montola, M. (2020). Against "dark game design patterns". *DiGRA* — https://eprints.whiterose.ac.uk/156460/ [conceptual]
32. Schroeder, N., Adesope, O., Gilbert, R. (2013). How effective are pedagogical agents for learning? *J. Educ. Computing Res.* — https://journals.sagepub.com/doi/10.2190/EC.49.1.a [MA]
33. Lester, J. et al. (1997). The persona effect — entrada enciclopédica Springer — https://link.springer.com/rwe/10.1007/978-1-4419-1428-6_942 [RCT temprano]
34. Kao, D. et al. (2024). How does juicy game feedback motivate? Testing curiosity, competence, and effectance. *CHI 2024* — https://dl.acm.org/doi/10.1145/3613904.3642656 [RCT online]
35. Hicks, K. et al. (2019). Juicy game design: understanding the impact of visual embellishments on player experience — https://www.semanticscholar.org/paper/Juicy-Game-Design:-Understanding-the-Impact-of-on-Hicks-Gerling/5914c05b99f717e4ada667e1b23630493eabf3ad [RCT]

Duolingo
36. Mazal, J. (2023). How Duolingo reignited user growth. *Lenny's Newsletter* — https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth [INT / ensayo de ex-CPO]
37. Duolingo Blog. Improving the streak — https://blog.duolingo.com/improving-the-streak [INT A/B]
38. Duolingo Blog. How the Duolingo streak builds habit — https://blog.duolingo.com/how-duolingo-streak-builds-habit [INT]
39. Duolingo Blog. How Streaks keep Duolingo learners committed — https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/ [INT A/B]
40. Duolingo Blog. Friend Streak — https://blog.duolingo.com/friend-streak/ [INT]
41. Duolingo Blog. The new Duolingo home screen (path, 2022) — https://blog.duolingo.com/new-duolingo-home-screen-design [INT]
42. Duolingo Blog. Energy (reemplazo de hearts, 2025) — https://blog.duolingo.com/duolingo-energy/ [INT]
43. Duolingo Blog. Guide to the Practice Hub — https://blog.duolingo.com/guide-to-duolingo-practice-hub/ [INT]
44. Yancey, K., Settles, B. (2020). A sleeping, recovering bandit algorithm for optimizing recurring notifications. *KDD* — https://research.duolingo.com/papers/yancey.kdd20.pdf [paper con datos INT]
45. Duolingo Blog. Leagues / leaderboards — https://blog.duolingo.com/duolingo-leagues-leaderboards/ [INT]
46. Liberty, S. (2025). How Duolingo's new Energy system is failing its users. *Medium* — https://medium.com/design-bootcamp/how-duolingos-new-energy-system-is-failing-its-users-16738c83117b [OP]
47. Class Central (2025). Duolingo breaks Hearts for Energy — https://www.classcentral.com/report/duolingo-breaks-hearts-for-energy/ [OP]
48. Growth.design. Duolingo's user retention: 8 tactics — https://growth.design/case-studies/duolingo-user-retention [OP/análisis]
49. Digital Trends (2024). Duolingo Year in Review 2024 — https://www.digitaltrends.com/phones/duolingo-year-in-review-2024-how-to-find-yours/ [prensa]
65. Fortune (2025). Duolingo CEO Luis von Ahn on culture/handbook — https://fortune.com/article/duolingo-ceo-luis-von-ahn-hiring-checklist-5-worker-traits-gen-z-vibes/ [prensa]

Otras apps
50. Headspace. Your run streak — it's not about the number — https://www.headspace.com/articles/building-a-meditation-practice [OP corporativo]
51. Brilliant Help Center. What is a streak? — https://brilliant.org/help/using-brilliant/what-is-a-streak/ [producto]
52. Rive Blog (2024). How Brilliant.org motivates learners with animations — https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations [INT/case study]
53. Strava. Your Year in Sport — https://support.strava.com/en-us/articles/15401959-your-year-in-sport ; Strava Press (2025) mid-year data — https://press.strava.com/articles/strava-mid-year-data-shows-how-athletes-are-tracking-toward-2025-goals [INT]
54. Lichess. Puzzle Streak — https://lichess.org/streak ; Puzzle Storm — https://lichess.org/storm [producto]
55. Dhakal, V., Feit, A., Kristensson, P., Oulasvirta, A. (2018). Observations on typing from 136 million keystrokes. *CHI* — https://userinterfaces.aalto.fi/136Mkeystrokes/ [OBS]
56. (2025). Utilization patterns and perceptions of Anki among first-year medical students. *PMC* — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12662189/ [OBS]
57. Elevate — App Store — https://apps.apple.com/us/app/elevate-brain-training-games/id875063456 [producto]
58. La Touche Musicale. Simply Piano vs Yousician — https://latouchemusicale.com/en/comparaisons/simply-piano-vs-yousician/ [review]
59. Wordle Analyzer. The history of Wordle — https://wordleanalyzer.dev/blog/history-of-wordle [OP]
60. Chou, Y. Hook Model: why it creates addicts, not habits — https://yukaichou.com/gamification-analysis/hook-model-octalysis-habit-addiction/ [OP]
61. Nunes, J., Drèze, X. (2006). The endowed progress effect. *J. Consumer Res.* — https://papers.ssrn.com/sol3/papers.cfm?abstract_id=991962 [RCT campo]
62. Kivetz, R., Urminsky, O., Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *J. Marketing Res.* — https://www.researchgate.net/publication/239776073_The_Goal-Gradient_Hypothesis_Resurrected_Purchase_Acceleration_Illusionary_Goal_Progress_and_Customer_Retention [RCT campo]
63. TypoTrainer. Monkeytype, TypeRacer, Keybr compared (adaptive unlocking en Keybr) — https://typotrainer.lukadevv.com/blog/best-typing-practice-tools [OP]
64. Deconstructor of Fun. Duolingo leagues — https://duolingo.deconstructoroffun.com/mechanics/leagues [OP/análisis de terceros; cifras no verificadas]

Notas de verificación
- No pude leer el PDF completo de Dicheva 2015 ni el de Kao 2024 (403/binario); los resúmenes se basan en abstracts y fuentes secundarias académicas.
- Cifras de blogs de terceros tipo "Daily Quests +25% DAU", "streaks +60% engagement", "63% abandona tras romper racha (CHI 2020)" **no** las encontré en fuentes primarias; quedan fuera de las conclusiones.
- Todo lo de Duolingo con número proviene de sus blogs o de la entrevista/ensayo de Mazal; son A/B tests internos no auditados.
