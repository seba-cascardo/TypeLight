# Cómo se aprende (y se re-aprende) la mecanografía al tacto: revisión de literatura aplicada a TypeLight

**Fecha:** 2026-09-17
**Alcance:** ciencia del aprendizaje motor, psicología cognitiva del tipeo, estudios de entrenamiento de mecanografía, y material aplicado (keybr, Monkeytype, TypingClub). Foco en un **adulto que ya tipea "mirando" y quiere convertirse a tacto**.
**Método:** búsqueda web + lectura directa de los PDF de Dhakal et al. 2018 y Feit et al. 2016 (números citados desde el texto original), verificación de cada cita por DOI/PubMed/portal institucional. Semantic Scholar devolvió 429 (rate limit), así que la verificación se hizo por Crossref/ACM/PubMed/portales de autores. Cuando algo no pudo verificarse en el texto original, está marcado como **[no verificado textualmente]**.

**Leyenda de nivel de evidencia**
- **[META]** meta-análisis / revisión sistemática
- **[RCT]** experimento con asignación aleatoria
- **[LAB]** experimento de laboratorio (no necesariamente aleatorizado entre grupos)
- **[OBS]** observacional / correlacional (incluye datasets masivos)
- **[TEO]** teoría, modelo o revisión narrativa
- **[FOLK]** folklore de la comunidad, documentación de productos, opinión

---

## 0. Resumen ejecutivo (accionable)

1. **Lo que separa a los rápidos no es "usar 10 dedos" sino tres cosas medibles: mapeo dedo→tecla consistente, preparación del siguiente golpe y poca excursión de la mano** (Feit 2016, [OBS], motion capture). Los autodidactas con 6 dedos igualan a los de tacto formal en velocidad y errores; la diferencia real es que los de tacto **miran el teclado la mitad del tiempo (20 % vs 41 %)**.
2. **El rollover (apretar la siguiente tecla antes de soltar la anterior) es el predictor más fuerte de velocidad en 168.000 personas (r = 0,73)**; los rápidos lo usan en 40–70 % de las pulsaciones, los lentos casi nunca (Dhakal 2018, [OBS]). TypeLight puede medirlo en el navegador con keydown/keyup: **es la métrica de expertise que falta**.
3. **Los rápidos no corrigen más: cometen menos errores** (KSPC r = −0,40; errores no corregidos r = −0,21). El error dominante de los lentos es la **sustitución** (1,65 %), que Dhakal atribuye a una mala representación mental de la posición de los dedos. Priorizar precisión temprana está respaldado.
4. **La atención explícita a los dedos degrada el tipeo hábil** (Logan & Crump 2009; Tapp & Logan 2011, [LAB]) y **el foco externo (en la tecla/el efecto) supera al foco interno (en el cuerpo) en todos los niveles de habilidad** (Chua et al. 2021, [META]). Las "manos guía" en pantalla deben aparecer sólo para teclas nuevas y desvanecerse rápido.
5. **El adulto que ya tipea mirando vuelve a mirar porque a corto plazo le rinde más** (melioration, Yechiam et al. 2003, [LAB, n=22]). El único antídoto testeado: **hacer que mirar la pantalla sea más reforzante que mirar el teclado** (tarea secundaria en pantalla). Los juegos de TypeLight (reflejo, globos, carrera) son exactamente eso; conviene meterlos *dentro* de la rutina, no sólo como extra.
6. **Sesiones cortas y diarias ganan a sesiones largas: 1 h × 1/día aprendió más rápido y retuvo mejor que 2 h × 2/día** en 72 carteros aprendiendo a tipear (Baddeley & Longman 1978, [RCT-like]). 10–20 min/día no está testeado directamente, pero toda la literatura de práctica distribuida apunta ahí. **Rutina diaria: respaldada.**
7. **Dormir consolida secuencias de dedos: +20 % velocidad y −39 % errores de un día al otro sin práctica extra** (Walker et al. 2002, [LAB]). Practicar a la tarde/noche y volver al día siguiente es mejor que dos sesiones el mismo día.
8. **Dentro de una sesión, la repetición consecutiva (masiva) es lo que forma chunks**: los chunks de tipeo se consolidan cuando las repeticiones son seguidas, **no** cuando están espaciadas (Yamaguchi & Logan 2016, [LAB]); un estudio 2026 con secuencias de teclas también favorece intervalos cortos entre intentos (Dutra et al. 2026, [RCT], niños). **Entre sesiones, espaciar; dentro de la sesión, bloques cortos de repeticiones seguidas de la tecla/bigrama débil.**
9. **Interferencia contextual (mezclar en vez de bloquear): efecto medio en laboratorio (SMD 0,92) pero casi nulo en contextos aplicados (0,23, n.s.)** (Czyż et al. 2024, [META, 54 estudios]; Brady 2004). Para tipeo: **bloquear al introducir una tecla nueva, mezclar en el repaso**. No hay que sobreinvertir en aleatorizar.
10. **"Parar en el error" sin Backspace no tiene evidencia directa ni en contra ni a favor.** El *errorless learning* no muestra ventaja consistente en adultos jóvenes (g = −0,06, n.s.; Wong et al. 2026, [META]), aunque sí mejora la *precisión* del movimiento (g = 0,85) y produce habilidades más robustas bajo carga (Maxwell et al. 2001). En contra: la *guidance hypothesis* (feedback aumentado constante → dependencia; Salmoni 1984, Winstein & Schmidt 1990) y el hecho de que **el tipeo real exige detectar y reparar errores uno mismo** (Logan & Crump 2010; Pinet & Nozari 2022). **Veredicto: matizar** — mantenerlo para teclas nuevas, agregar un modo "texto real" con Backspace obligatorio para entrenar el circuito de detección/reparación.
11. **Velocidad vs. precisión: los tipistas pueden intercambiarlas a voluntad pero hay un piso duro de ~100 ms/tecla** (Yamaguchi, Crump & Logan 2013, [LAB]). Instruir "velocidad" mejora el rendimiento momentáneo, **no el conocimiento adquirido** (Vékony et al. 2022, [RCT]). Instruir "precisión" tampoco lo empeora. **Ráfagas breves 10–20 % por encima del ritmo cómodo** (recomendación de Ericsson, [TEO, no verificada textualmente]) son razonables como *reto*, no como dieta.
12. **Los drills de letras aisladas transfieren mal por sí solos:** todo tipista pierde ~50 % de velocidad en cadenas aleatorias (Feit 2016; Salthouse 1986), la habilidad está organizada en **palabras** (Logan & Crump 2011) y el "loop externo" (palabras) necesita más práctica que el interno (dedos) (van den Bergh 2015, [OBS longitudinal]). El entrenamiento por partes es, en general, menos eficiente que el de la tarea completa salvo para tareas complejas (Wightman & Lintern 1985). **Pasar rápido de letras a pseudo-palabras pronunciables y a texto real con los bigramas objetivo** (lo que hace keybr).
13. **El bigrama, no la tecla, es la unidad que predice velocidad**: los pares mano-alternada / mismo-dedo discriminan a rápidos de lentos (r ≈ −0,7) mucho más que las repeticiones de letra (r = −0,32) (Dhakal 2018). **El "dominio por tecla" debería ser, al menos en parte, "dominio por bigrama".**
14. **Los expertos NO tipean isócronos**: el IKI depende del bigrama (mano alternada ~155 ms vs mismo dedo ~223 ms; Salthouse 1986/Gentner 1983). Su *consistencia* es alta **por bigrama**, no global. Una métrica de "ritmo" que premie intervalos iguales entre sí **contradice** la estructura del tipeo experto. **Medir variabilidad del mismo bigrama entre repeticiones (IKI normalizado, como Dhakal), no la varianza global.**
15. **El metrónomo en mecanografía es folklore histórico** (existió el "Torka typewriter metronome" para aulas, 1920s–50s) sin evidencia moderna. Sirve como juego para frenar al que atropella, no como objetivo.
16. **La regla del 85 %** (Wilson et al. 2019, [TEO], derivada para clasificación binaria con gradiente) y el *challenge point* (Guadagnoli & Lee 2004, [TEO]) apuntan a lo mismo: ajustar dificultad para que haya ~10–15 % de fallo. Con "parar en el error" la precisión final es 100 % por construcción, así que **la dificultad hay que modularla por velocidad objetivo y densidad de teclas débiles, y medir precisión al primer intento**.
17. **Repetición espaciada (SM-2/FSRS/HLR) aplica parcialmente**: el olvido procedural es lento (~30 % de velocidad tras 1–9 meses sin práctica; Baddeley & Longman) y la práctica cotidiana ya "repasa" las teclas frecuentes. Lo que sí vale la pena copiar es la **idea de estabilidad/decay por ítem**: una EMA sin término de olvido nunca vuelve a traer una tecla que dejó de aparecer. Modelo sugerido: EMA + half-life por tecla/bigrama, con "dominio" exigido **a través de días**, no en una sesión.
18. **Feedback aumentado: resumido al final, no continuo.** Reducir la frecuencia de KR mejora retención (Winstein & Schmidt 1990, [LAB]). Un contador de PPM en vivo durante la lección es feedback continuo que además invita a apurarse. El eco en pantalla del texto sí es feedback intrínseco necesario (sin él cae la detección de errores; Snyder et al. 2015).
19. **Ergonomía (evidencia prospectiva, n = 632):** codo > 121°, teclado bajo (tecla J < 3,5 cm), fuerza de activación < 48 g y muñeca sin desviación radial reducen riesgo (Gerr/Marcus 2002). Micro-pausas cada ~20 min bajan el malestar sin costar productividad (McLean 2001). Una tarjeta de postura + recordatorio de pausa es todo lo que hace falta.
20. **Motivación:** gamificación tiene efectos pequeños pero reales (g ≈ 0,25–0,49; Sailer & Homner 2020, [META]); un hábito diario tarda una mediana de 66 días en automatizarse (Lally 2010). El predictor de expertise en tipistas cotidianos es **tener la meta explícita de tipear rápido + haber tomado un curso** (Keith & Ericsson 2007). La "constancia" debe perdonar (metas semanales, no rachas frágiles).

---

## 1. Cómo tipean los expertos vs. los novatos

### 1.1 Datos masivos: Dhakal, Feit, Kristensson & Oulasvirta (2018) — [OBS, n = 168.960, 136 M pulsaciones]

**Cita:** *Observations on Typing from 136 Million Keystrokes*, CHI 2018, best paper honorable mention. DOI [10.1145/3173574.3174220](https://doi.org/10.1145/3173574.3174220). PDF y dataset: <https://userinterfaces.aalto.fi/136Mkeystrokes/>. **Verificado: leído el PDF completo.**

Hallazgos (números del paper):
- Media **51,6 PPM (SD 20,2)**; los más rápidos superan 120 PPM. Auto-reportados con curso de mecanografía: 54,4 vs 49,0 PPM sin curso (**d = 0,27, diferencia pequeña**).
- **IKI** (intervalo entre teclas) medio 238,7 ms. Rápidos: **~120 ms con SD de sólo 11 ms**; lentos: > 480 ms con SD > 120 ms. **La duración de la pulsación (~116 ms) casi no varía entre lentos y rápidos**: "most advances in speed are achieved elsewhere".
- **Errores:** tasa no corregida 1,17 %. Correlaciones con PPM: errores no corregidos r = −0,21; correcciones r = −0,36; **KSPC r = −0,40**. A partir de ~30 PPM la relación es lineal: **los más rápidos tipean y corrigen menos**. El error dominante es la **sustitución (1,65 %)**, que en lentos es muy alta (d = 1,57) y que los autores atribuyen a "poor mental representation of the fingers' position".
- **Dedos:** rápidos 8,4 vs lentos 5,3 (auto-reportado, r = 0,34); entrenados 8,0 vs no entrenados 6,5.
- **Rollover** (apretar la siguiente antes de soltar la anterior): ratio medio 25 %, **r = 0,73 con PPM**; rápidos 40–70 %, lentos ~8 %; entrenados ~5 puntos más que no entrenados. Solapamiento medio 30 ms (hasta 100).
- **Bigramas:** el IKI de pares tipeados con manos alternadas o un solo lado correlaciona ~−0,7 con PPM; el de repeticiones de letra sólo −0,32. **Los lentos son 20–28 ms más lentos en alternancia de manos** (¡al revés que los rápidos!) porque dependen de búsqueda visual.
- 8 clusters de tipistas; entrenados y no entrenados tienen distribuciones de IKI casi idénticas → la técnica formal explica poco.
- Recomendación explícita de los autores: "Exercises could explicitly train in rollover and be personalised for typists' deficits."

**Implicación para TypeLight:** (a) registrar keydown *y* keyup para calcular **rollover ratio** y mostrarlo como marcador de progreso a tacto; (b) el "dominio por tecla" debe complementarse con **dominio por bigrama** (alternancia de manos, mismo dedo); (c) la métrica de errores que importa es **KSPC / errores al primer intento**, no sólo precisión final.

### 1.2 Estrategias autodidactas: Feit, Weir & Oulasvirta (2016) — [OBS, n = 30, motion capture + eye tracking]

**Cita:** *How We Type: Movement Strategies and Performance in Everyday Typing*, CHI 2016. DOI [10.1145/2858036.2858233](https://doi.org/10.1145/2858036.2858233). Dataset: <https://userinterfaces.aalto.fi/how-we-type/>. **Verificado: leído el PDF completo.**

- 30 participantes, 34–79 PPM. **Tacto (13 auto-reportados) 57,8 PPM vs no-tacto 58,9 PPM (n.s.)**; errores no corregidos 0,76 % vs 0,47 % (n.s.); eficiencia igual.
- **Dedos:** tacto 8,5 vs no-tacto 6,2. "Con 5 dedos podés ser tan rápido como con 10."
- **Mirada:** tiempo con la vista en el teclado **0,20 vs 0,41** (p < 0,01); cambios de mirada por oración 0,92 vs 1,2. El IKI de los tipistas a tacto sube más rápido cuando desvían la vista al teclado (r = 0,81) — el tacto **permite mantener la atención en la pantalla**, y eso es su ventaja real en tareas interactivas.
- **Tres predictores del IKI** (modelo lineal, R² 0,80 en tacto): (1) **entropía del mapeo dedo→tecla** (0,26 tacto vs 0,38 no-tacto; r con IKI 0,62 en no-tacto), (2) **preparación** (distancia del dedo ejecutor a su próxima tecla: 1,94 vs 2,41 cm), (3) **movimiento global de la mano** (menor en rápidos).
- Todos pierden **~50 % de velocidad en cadenas aleatorias** (texto sin palabras).
- Sólo 3/30 practicaban deliberadamente y eran los 3 tipistas a tacto; "for touch typists reaching and maintaining >70 wpm requires some form of deliberate practice".
- Beneficio de alternancia de manos: sólo 29 ms en no-tacto; n.s. en tacto (teclados modernos con poca fuerza y filas a la misma altura reducen la ventaja histórica de 30–60 ms).

**Implicación:** el objetivo de la conversión no es "usar 10 dedos" sino **bajar la entropía del mapeo y dejar de mirar**. La app no ve los dedos, pero puede (a) medir la mirada indirectamente con un test "teclado tapado" (ver §2.5), (b) medir preparación indirectamente vía IKI de bigramas mismo-dedo vs alternados, (c) reforzar un mapeo fijo mostrando **una sola asignación** por tecla y no aceptando "atajos".

### 1.3 Control jerárquico y por qué mirar los dedos empeora: Logan & Crump

- **Logan & Crump (2011)**, *Hierarchical control of cognitive processes: the case for skilled typewriting*, Psychology of Learning and Motivation 54, 1–27. DOI [10.1016/B978-0-12-385527-5.00001-2](https://doi.org/10.1016/B978-0-12-385527-5.00001-2). [TEO + LAB]. Dos loops anidados: el **externo** produce palabras y monitorea la pantalla; el **interno** produce pulsaciones y monitorea feedback kinestésico. Se comunican por palabras, "saben poco el uno del otro".
- **Logan & Crump (2009)**, *The left hand doesn't know what the right hand is doing*, Psychological Science 20, 1296–1300. DOI [10.1111/j.1467-9280.2009.02442.x](https://doi.org/10.1111/j.1467-9280.2009.02442.x). [LAB]. Pedir a tipistas hábiles que tipeen sólo las letras de una mano (obliga al loop externo a monitorear al interno) **desploma velocidad y multiplica errores** (un resumen secundario cita ~80 → ~14 PPM y 6 % → 30 % errores; cifras no verificadas en el texto original).
- **Tapp & Logan (2011)**, *Attention to the hands disrupts skilled typewriting: the role of vision*, Attention, Perception & Psychophysics 73, 2379–2383. DOI [10.3758/s13414-011-0208-5](https://doi.org/10.3758/s13414-011-0208-5). [LAB]. La disrupción es **mayor con las manos tapadas**: cuando el loop externo tiene que supervisar, usa la visión de las manos como muleta.
- **Logan & Crump (2010)**, *Cognitive illusions of authorship reveal hierarchical error detection in skilled typists*, Science 330, 683–686. DOI [10.1126/science.1190483](https://doi.org/10.1126/science.1190483). [LAB]. Dos detectores de error independientes: el externo mira la pantalla (y se deja engañar por errores insertados/corregidos por el experimentador), el interno "sabe" por kinestesia (post-error slowing aunque la pantalla se vea bien).
- **Snyder, Logan & Yamaguchi (2015)**, *Watch what you type*, APP 77, 282–292. DOI [10.3758/s13414-014-0756-6](https://doi.org/10.3758/s13414-014-0756-6). [LAB]. Sin eco en pantalla la detección de errores cae (~29 %); tapar las manos afecta poco a tipistas hábiles.
- **Crump & Logan (2010)**, *Warning: this keyboard will deconstruct*, Psychonomic Bulletin & Review 17, 394–399. DOI [10.3758/PBR.17.3.394](https://doi.org/10.3758/PBR.17.3.394). [LAB]. Quitarle capas físicas al teclado (hasta tipear sobre una proyección láser) degrada el tipeo: **la habilidad está acoplada al feedback háptico del teclado real**, no a un mapa cognitivo puro.
- **Logan (2018)**, *Automatic control: how experts act without thinking*, Psychological Review 125, 453–485. PubMed [29952620](https://pubmed.ncbi.nlm.nih.gov/29952620/). [TEO]. Formaliza lo anterior: pensar una palabra dispara la secuencia de pulsaciones por recuperación de contexto, sin monitoreo top-down.

**Implicación:** (a) las **manos guía en pantalla dirigen la atención al loop interno**, que es justo lo que degrada al tipeo hábil; deben ser andamiaje para tecla nueva y desaparecer; (b) el **teclado visual sí puede quedarse** como referencia de *posición de tecla* (foco externo), no de dedo; (c) practicar en el **teclado físico propio** del usuario (no en uno virtual) — TypeLight ya lo hace; (d) el eco del texto en pantalla es feedback intrínseco que hay que mantener siempre.

### 1.4 Modelos clásicos: Salthouse, Rumelhart & Norman, Gentner

- **Salthouse (1986)**, *Perceptual, cognitive, and motoric aspects of transcription typing*, Psychological Bulletin 99, 303–319. [PsycNET 1986-21057-001](https://psycnet.apa.org/record/1986-21057-001). [TEO/revisión]. Integra 29 fenómenos: **eye-hand span** mayor en expertos (rinden menos con < 9 caracteres de anticipación vs < 5 en menos hábiles); IKI por bigrama: **alternancia de manos ~155 ms, dedos distintos misma mano ~194, mismo dedo ~223, repetición ~176** (cifras compiladas en Feit 2016, tabla 1). También **Salthouse (1984)**, *Effects of age and skill in typing*, JEP: General 113, 345–371.
- **Rumelhart & Norman (1982)**, *Simulating a skilled typist*, Cognitive Science 6, 1–36. DOI [10.1207/s15516709cog0601_1](https://doi.org/10.1207/s15516709cog0601_1). [TEO/simulación]. Activación paralela de esquemas de tecla: explica transposiciones y errores de duplicación ("thier"), y por qué el siguiente golpe se prepara mientras se ejecuta el actual.
- **Gentner (1983)**, *Keystroke timing in transcription typing*, en *Cognitive Aspects of Skilled Typewriting* (Springer), 95–120; **Gentner (1987)**, *Timing of skilled motor performance: tests of the proportional duration model*, Psychological Review 94, 255–276. [LAB]. El timing **no es proporcional ni isócrono**: cada bigrama tiene su duración característica y no escala uniformemente con la velocidad global.
- **Grudin (1983)**, *Error patterns in novice and skilled transcription typing*, mismo volumen, 121–143. [LAB]. Novatos: más sustituciones; expertos: más inserciones/omisiones (consistente con Dhakal).

**Implicación:** (a) mostrar **varios caracteres de anticipación** (no sólo la palabra actual) para no frenar el eye-hand span; (b) cualquier métrica de "ritmo" debe **normalizar por bigrama**.

### 1.5 Chunking y dos curvas de aprendizaje

- **Yamaguchi & Logan (2014)**, *Pushing typists back on the learning curve: revealing chunking in skilled typewriting*, JEP:HPP 40, 592–612. PubMed [23875575](https://pubmed.ncbi.nlm.nih.gov/23875575/). [LAB]. Desordenar letras de palabras "devuelve" al tipista al nivel de novato: la habilidad son **chunks de palabra**.
- **Yamaguchi & Logan (2016)**, *…memory chunking in the hierarchical control of skilled typewriting*, JEP:LMC 42, 1919–1936. PubMed [27336783](https://pubmed.ncbi.nlm.nih.gov/27336783/). [LAB]. **Los chunks se forman y consolidan cuando las repeticiones son consecutivas; no se forman con repeticiones espaciadas.**
- **van den Bergh, Schmittmann, Hofman & van der Maas (2015)**, *Tracing the development of typewriting skills in an adaptive e-learning environment*, Perceptual and Motor Skills 121, 727–745. DOI [10.2466/23.25.PMS.121c26x6](https://doi.org/10.2466/23.25.PMS.121c26x6). [OBS longitudinal, 62 niños, 1,09 M latencias]. Curvas distintas para loop interno (movimientos de dedo) y externo (palabras): **el interno alcanza meseta con menos práctica; el externo necesita mucha más**.
- **Preprint 2026**, *Motor automaticity in natural keyboard typing*, bioRxiv/PMC [PMC13278139](https://pmc.ncbi.nlm.nih.gov/articles/PMC13278139/). [OBS, preprint]. Mayor frecuencia del bigrama/palabra en el idioma → IKI más rápido y **menos variable**; la variabilidad individual del IKI es robusta pero no se relaciona con medidas convencionales de habilidad.

**Implicación:** (a) para una tecla/bigrama débil, **3–5 repeticiones seguidas** en la misma sesión (bloque corto), no una aparición aislada cada tanto; (b) el currículo no termina cuando "todas las teclas están dominadas": ahí empieza el trabajo del loop externo (palabras frecuentes del español, patrones); (c) usar **frecuencias de bigrama/palabra en español** para ordenar qué practicar.

### 1.6 Errores: detección, reparación y Backspace

- **Kalfaoğlu & Stafford (2014)**, *Performance breakdown effects dissociate from error detection effects in typing*, QJEP 67, 508–524. DOI [10.1080/17470218.2013.820762](https://doi.org/10.1080/17470218.2013.820762). [LAB, 100 oraciones **sin feedback visual**]. Las pulsaciones erróneas y las post-error son más lentas; las pre-error no son más rápidas → el sistema motor **detecta el error sin ver la pantalla**.
- **Pinet & Nozari (2022)**, *Correction without consciousness in complex tasks: evidence from typing*, Journal of Cognition 5(1). DOI [10.5334/joc.202](https://doi.org/10.5334/joc.202). [LAB, ~15.000 errores, 145 participantes]. Las reparaciones **subconscientes** son más frecuentes entre las exitosas y más rápidas; el feedback visual es crítico para *corregir* pero no para *detectar*.
- **Pinet, Ziegler & Alario (2016)**, *Typing is writing: linguistic properties modulate typing execution*, PBR 23, 1898–1906. DOI [10.3758/s13423-016-1044-3](https://doi.org/10.3758/s13423-016-1044-3). [LAB]. Frecuencia léxica mejora latencia y precisión; **frecuencia de bigrama acelera IKI**; los IKI se alargan en fronteras silábicas.

**Implicación:** la reparación rápida y semi-automática con Backspace **es parte de la habilidad experta**. Un entrenador que nunca deja que el usuario detecte-y-repare por sí mismo no entrena ese circuito. Ver tabla §8.

### 1.7 Población cotidiana y qué predice el nivel

- **Pinet, Zielinski, Alario & Longcamp (2022)**, *Typing expertise in a large student population*, Cognitive Research: Principles and Implications 7:77. DOI [10.1186/s41235-022-00424-3](https://doi.org/10.1186/s41235-022-00424-3). [OBS, 1.301 estudiantes, preregistrado]. Gran variabilidad; **la exposición acumulada es el predictor más fuerte**.
- **Keith & Ericsson (2007)**, *A deliberate practice account of typing proficiency in everyday typists*, JEP: Applied 13, 135–145. PubMed [17924799](https://pubmed.ncbi.nlm.nih.gov/17924799/). [OBS, n = 60]. Velocidad perceptiva y tapping **no** predicen; **haber tomado un curso + tener la meta de tipear rápido en el uso diario** predice el nivel más alto.
- **Logan, Ulrich & Lindsey (2016)**, *Different (key)strokes for different folks*, JEP:HPP 42. [Semantic Scholar](https://www.semanticscholar.org/paper/3e8e7d39e626bb7b765fce3d85af449a18f2be29). [LAB, n = 48]. Estándar 80,0 PPM / 93,6 % vs no estándar 65,6 PPM / 83,2 %; **la brecha se agranda al tapar el teclado o quitar las letras de las teclas**. Ambos grupos muestran el mismo grado de control jerárquico: los no estándar son igual de automáticos pero con un mapeo subóptimo (Fitts vs Hick).
- **Rieger & Bart (2016)**, *Typing style and the use of different sources of information during typing*, Frontiers in Psychology 7:1908. DOI [10.3389/fpsyg.2016.01908](https://doi.org/10.3389/fpsyg.2016.01908). [OBS, auto-reporte]. Tipistas de 10 dedos reportan menos atención al teclado/dedos y más a la pantalla, y usan más el tacto para detectar errores.
- (Contraste móvil, opcional) **Palin, Feit, Kim, Kristensson & Oulasvirta (2019)**, *How do people type on mobile devices?*, MobileHCI. DOI [10.1145/3338286.3340120](https://doi.org/10.1145/3338286.3340120). [OBS, 37.370]. 36,2 PPM; autocorrección correlaciona positivo, predicción de palabras negativo.

**Implicación para el usuario de TypeLight:** el adulto que ya tipea mirando tiene un **mapeo automático pero subóptimo**; su curva no es la de un principiante sino la de alguien que **desaprende**. Espere (1) caída inicial de velocidad, (2) tentación constante de volver, (3) que el test "teclado tapado" sea el mejor diagnóstico de progreso real.

---

## 2. Entrenamiento de mecanografía en particular

### 2.1 Por qué el aprendiz vuelve a mirar: melioration — Yechiam, Erev, Yehene & Gopher (2003)

**Cita:** *Melioration and the transition from touch-typing training to everyday use*, Human Factors 45(4), 671–684. DOI [10.1518/hfes.45.4.671.27085](https://doi.org/10.1518/hfes.45.4.671.27085). [LAB, n = 22 estudiantes]. Portal Technion: [link](https://cris.technion.ac.il/en/publications/melioration-and-the-transition-from-touch-typing-training-to-ever/).

- Problema documentado: **el éxito en el curso no garantiza que se siga usando el tacto**. Explicación: *melioration* — maximizar la tasa local de refuerzo → mirar el teclado rinde más *ahora*.
- Intervención: en lugar de prohibir, **hicieron que mirar la pantalla fuera reforzante** con una tarea secundaria (responder a señales que aparecen en pantalla). Tras el curso, los participantes tipearon sus propios deberes.
- Resultado: bajo la condición de refuerzo modificado, **el efecto de melioration en el post-entrenamiento disminuyó y se facilitó la adquisición y el mantenimiento** del tacto.

**Implicación (la más importante para TypeLight):** el adversario no es la falta de conocimiento sino la **economía del refuerzo**. Tres tácticas alineadas con la evidencia: (1) meter en la rutina diaria un ejercicio que **castigue mirar el teclado** por diseño (señales en pantalla que hay que responder — el juego "reflejo por tecla" y "globos" ya lo hacen); (2) mostrar la **velocidad con teclado tapado** como la métrica de progreso "de verdad" para que el refuerzo se alinee con el objetivo; (3) comunicar explícitamente la caída temporal (§2.3).

### 2.2 Cuánto y cómo distribuir: Baddeley & Longman (1978) — [RCT-like, n = 72 carteros]

**Cita:** *The influence of length and frequency of training session on the rate of learning to type*, Ergonomics 21(8), 627–635. DOI [10.1080/00140137808931764](https://doi.org/10.1080/00140137808931764). PDF: [gwern.net](https://gwern.net/doc/psychology/spaced-repetition/1978-baddeley.pdf).

- 4 grupos: 1 h o 2 h por sesión × 1 o 2 sesiones/día, hasta completar 60 h.
- **1 h × 1/día aprendió con la mayor eficiencia por hora; 2 h × 2/día la menor.** Retención a 1, 3 y 9 meses: pérdida de velocidad ~30 %, peor en el grupo más masivo.
- Costo: el grupo de 1 h/día necesitó más días calendario (y a los carteros les gustó menos, por lo prolongado).

**Implicación:** la **rutina diaria corta de TypeLight está respaldada**. No hay dato directo de 10–15 min (1 h fue la sesión más corta testeada); la extrapolación desde práctica distribuida (Shea 2000, Cepeda 2006) es razonable pero sigue siendo extrapolación. Sugerencia: **no premiar "doble sesión" el mismo día**; premiar días consecutivos.

### 2.3 Mesetas: Bryan & Harter, Book, Keller, Gray

- **Bryan & Harter (1897, 1899)**, *Studies on the telegraphic language*, Psychological Review 4, 27–53 y 6, 345–375. DOI [10.1037/h0073117](https://doi.org/10.1037/h0073117). [OBS]. Mesetas en recepción de Morse interpretadas como consolidación de hábitos de nivel inferior antes de "saltar" a unidades mayores (letra → palabra → frase).
- **Book (1908)**, *The Psychology of Skill, with special reference to its acquisition in typewriting* ([Google Books](https://books.google.com/books/about/The_Psychology_of_Skill_with_Special_Ref.html?id=VZMAAAAAMAAJ)). [OBS]. Primer estudio grande de tipeo; las mesetas son más bien **descansos de interés y esfuerzo** o "breakdowns", no incubación.
- **Keller (1958)**, *The phantom plateau*, JEAB 1, 1–13. DOI [10.1901/jeab.1958.1-1](https://doi.org/10.1901/jeab.1958.1-1). [TEO/crítica]. Con entrenamiento bien diseñado (Morse en la Armada) **las mesetas desaparecen**; serían artefacto del método.
- **Gray (2017)**, *Plateaus, dips, and leaps*, Cognitive Science 41, 1838–1870. DOI [10.1111/cogs.12412](https://doi.org/10.1111/cogs.12412). [TEO + OBS]. Las mesetas son donde el aprendiz explora/inventa nuevos métodos; los "dips" preceden a los saltos.

**Implicación:** (a) la conversión mirando → tacto es un **dip deliberado**: la UI debería nombrarlo ("esta semana vas a ser más lento; es esperado"); (b) cuando la velocidad de referencia se estanca N días, **cambiar el método** (nuevo tipo de ejercicio, bigramas, texto real) en vez de "más de lo mismo" (Keller, Gray).

### 2.4 Velocidad vs. precisión en tipeo

- **Yamaguchi, Crump & Logan (2013)**, *Speed–accuracy trade-off in skilled typewriting*, JEP:HPP 39, 678–699. DOI [10.1037/a0030512](https://doi.org/10.1037/a0030512). [LAB, 4 experimentos]. Los tipistas **pueden** intercambiar velocidad por precisión bajo instrucción, pero **no pueden bajar de ~100 ms/tecla**: el loop interno tiene un techo duro.
- **Vékony, Pléh, Pesthy, Janacsek & Nemeth (2022)**, *Speed and accuracy instructions affect two aspects of skill learning differently*, npj Science of Learning 7:27. DOI [10.1038/s41539-022-00144-9](https://doi.org/10.1038/s41539-022-00144-9). [RCT, tarea ASRT]. La instrucción de velocidad mejora la **expresión** momentánea del conocimiento probabilístico; al retest sin instrucción, **ambos grupos saben lo mismo**. "Response errors aren't necessary for procedural learning."
- **Ericsson (2006)**, *The influence of experience and deliberate practice…*, Cambridge Handbook of Expertise, 685–706 ([Cambridge](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-expertise-and-expert-performance/influence-of-experience-and-deliberate-practice-on-the-development-of-superior-expert-performance/C56EDDE9E57B259825916E061B025A72)). [TEO]. Ampliamente citado por recomendar que los tipistas en meseta **tipeen 10–20 % más rápido que su ritmo cómodo por períodos cortos** aceptando errores para descubrir qué bigramas los frenan. **[No verificado textualmente en esta revisión; cita de segunda mano.]**
- **Monkeytype / comunidad**: "accuracy first, speed follows"; < 95 % de precisión = velocidad "prestada". [FOLK].

**Implicación:** (a) la precisión como dieta base está respaldada (Dhakal: los rápidos erran menos; Vékony: enfatizar precisión no perjudica el aprendizaje); (b) el **reto de 1 minuto y la carrera contra el fantasma** son el lugar correcto para las ráfagas 10–20 % por encima; (c) el techo de 100 ms/tecla (≈120 PPM) fija el límite superior sensato de cualquier meta.

### 2.5 Tapar el teclado, mirar la pantalla, teclado en pantalla

- Tapar el teclado **degrada más a los no estándar** (Logan, Ulrich & Lindsey 2016) y a los tipistas hábiles **sólo cuando el loop externo tiene que supervisar** (Tapp & Logan 2011). Rieger & Bart 2016: los de 10 dedos no miran.
- No encontré ningún RCT que compare "teclado tapado durante el entrenamiento" vs. no tapado en adultos. Es **práctica tradicional** (fundas, teclas en blanco) sin evidencia directa, coherente con la teoría (fuerza el loop interno a usar kinestesia) y con Yechiam (quita la opción de melioration).
- Sobre **teclados en pantalla como feedback**: no encontré estudios controlados de aprendizaje. Hay trabajos de feedback háptico pasivo (**Seim et al. 2014**, *Passive haptic learning of Braille typing*, ISWC, DOI [10.1145/2634317.2634330](https://doi.org/10.1145/2634317.2634330); ACHI 2019 *Exploration of passive haptics based learning support for touch typing*, DOI [10.1145/3369457.3369524](https://doi.org/10.1145/3369457.3369524)) que muestran que **las señales que llegan al dedo enseñan el mapeo sin atención**; no aplicable sin hardware, pero refuerza que la señal útil es "qué dedo/qué tecla", no la imagen de la mano.

**Implicación:** (a) agregar un **modo "teclado tapado"** (la app no puede tapar el físico, pero puede pedir al usuario que use una funda o simplemente **ocultar el teclado virtual y las manos** y marcar la sesión como "a ciegas"); (b) la **velocidad a ciegas** es la métrica de referencia más honesta para un converso; (c) las manos guía: **sólo en la primera exposición a una tecla**, luego sólo resaltar la tecla (foco externo).

### 2.6 Qué hacen los tutores existentes (material aplicado, [FOLK])

- **keybr** ([repo](https://github.com/aradzie/keybr.com), [help](https://www.keybr.com/help)): empieza con las letras más frecuentes del idioma; **desbloquea una letra nueva cuando las activas alcanzan la velocidad objetivo (confianza por tecla)**; genera **pseudo-palabras pronunciables** por cadena de Markov con las letras activas; aumenta la frecuencia de las teclas lentas o con errores. No publica evaluaciones de aprendizaje. Es la implementación más cercana a "dominio por tecla + challenge point".
- **Monkeytype**: test de velocidad, errores pasan (no forzados), énfasis comunitario en precisión ≥ 95 %; recomienda "consistently for short periods". Sin evidencia publicada.
- **TypingClub / EdClub** ([doc](https://www.edclub.com/help/class-management/class-settings/on-error-behavior.html)): el comportamiento ante error es **configurable por el docente** (parar el cursor y exigir corrección, o dejar seguir). Que sea configurable sugiere que ni el vendor lo considera resuelto.
- **Post "forced correction" (dev.to, 2025)**: argumenta a favor del stop-on-error por "muscle memory"; **no cita ningún estudio**; concede que para quien ya es preciso, fluir sin parar tiene sentido.
- **West (1983)**, *Acquisition of Typewriting Skills* (Bobbs-Merrill): citado (Stager 1989) por reconvertir tipistas "hunt-and-peck" al tacto con **~10 h de instrucción**. **[No verificado directamente.]**

**Implicación:** ningún tutor comercial publica evidencia; la estrategia de keybr es la más coherente con la literatura (frecuencia, pseudo-palabras, confianza por tecla, velocidad objetivo). TypeLight puede diferenciarse midiendo lo que ellos no miden: **rollover, bigramas, velocidad a ciegas**.

---

## 3. Aprendizaje motor general aplicable

### 3.1 Etapas: Fitts & Posner (1967) — [TEO]

*Human Performance* (Brooks/Cole). Cognitiva (verbal, errática) → asociativa (menos errores, más consistencia) → autónoma (rápida, sin atención). **El converso está en una situación rara:** su mapeo viejo es autónomo y el nuevo es cognitivo; conviven y compiten. Implicación: en las primeras semanas la app debe **prevenir que el sistema viejo se dispare** (velocidad objetivo baja, teclado tapado) más que enseñar posiciones que el usuario ya conoce.

### 3.2 Práctica distribuida vs. masiva

- **Shea, Lai, Black & Park (2000)**, *Spacing practice sessions across days benefits the learning of motor skills*, Human Movement Science 19, 737–760. DOI [10.1016/S0167-9457(00)00021-X](https://doi.org/10.1016/S0167-9457(00)00021-X). [LAB]. Sesiones separadas 24 h > separadas 20 min, en retención diferida.
- **Donovan & Radosevich (1999)**, *A meta-analytic review of the distribution of practice effect*, J. Applied Psychology 84, 795–805 ([PDF](https://gwern.net/doc/psychology/spaced-repetition/1999-donovan.pdf)). [META]. Espaciado > masivo; el efecto es menor en tareas complejas.
- **Cepeda, Pashler, Vul, Wixted & Rohrer (2006)**, Psychological Bulletin 132, 354–380 ([resumen](https://www.yorku.ca/ncepeda/publications/CPVWR2006.html)); **Cepeda et al. (2008)**, *Spacing effects in learning: a temporal ridgeline*, Psychological Science 19, 1095–1102. [META + RCT grande, memoria verbal]. Gap óptimo ≈ 10–20 % del intervalo de retención.
- **Contraevidencia dentro de sesión:** **Dutra et al. (2026)**, *Massed practice improves learning of serial motor skills*, QJEP. DOI [10.1177/17470218251369711](https://doi.org/10.1177/17470218251369711). [RCT, 30 niños, secuencia de 4 teclas]. Intervalo entre intentos de 2 s > 30 s en retención. Y **Yamaguchi & Logan (2016)**: los chunks de tipeo requieren repeticiones consecutivas.

**Implicación:** **espaciar entre días, masificar dentro del bloque.** Una tecla débil se practica en un bloque de repeticiones seguidas hoy, y vuelve mañana o pasado — no diez apariciones sueltas a lo largo de la sesión.

### 3.3 Interferencia contextual (aleatoria vs. bloqueada)

- **Shea & Morgan (1979)**, JEP: Human Learning and Memory 5, 179–187 ([PDF](https://gwern.net/doc/psychology/spaced-repetition/1979-shea.pdf)). [LAB]. Aleatorio: peor adquisición, mejor retención/transferencia.
- **Magill & Hall (1990)**, Human Movement Science 9, 241–289. [TEO]. El efecto aparece sobre todo cuando las variantes usan **programas motores distintos**.
- **Brady (2004)**, *Contextual interference: a meta-analytic study*, Perceptual and Motor Skills 99, 116–126. DOI [10.2466/pms.99.1.116-126](https://doi.org/10.2466/pms.99.1.116-126). [META]. d = 0,38 global; **básico 0,57 vs aplicado 0,19**.
- **Czyż, Wójcik, Solarská & Kiper (2024)**, *High contextual interference improves retention in motor learning*, Scientific Reports. [PMC11237090](https://pmc.ncbi.nlm.nih.gov/articles/PMC11237090/). [META, 54 estudios, 2.068 participantes]. Retención SMD 0,63; **laboratorio 0,92 vs aplicado 0,23 (n.s.)**; adultos 0,63.
- Revisión crítica 2023: *The myth of contextual interference learning benefit in sports practice* (Educational Research Review, [link](https://www.sciencedirect.com/science/article/abs/pii/S1747938X23000301)). [META].
- Para **secuencias de teclas** específicamente: el efecto aparece con secuencias cortas y poca práctica, y depende de consolidación nocturna (*A multi-representation approach to the contextual interference effect*, Psychological Research 2022, [PMC9090686](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9090686/)). [LAB].

**Implicación:** (a) **introducir una tecla nueva en bloque** (adquisición), (b) **repasar mezclando** teclas/bigramas débiles con texto normal (retención), (c) no esperar milagros del interleaving: efecto medio en lab, pequeño en la vida real. El diseño actual (lección bloqueada → repaso mixto → reto en texto real) **ya es esto**.

### 3.4 Feedback aumentado: KR/KP, frecuencia, guidance hypothesis

- **Salmoni, Schmidt & Walter (1984)**, *Knowledge of results and motor learning*, Psychological Bulletin 95, 355–386. [TEO/META].
- **Winstein & Schmidt (1990)**, *Reduced frequency of knowledge of results enhances motor skill learning*, JEP:LMC 16, 677–691. DOI [10.1037/0278-7393.16.4.677](https://doi.org/10.1037/0278-7393.16.4.677). [LAB]. 50 % de KR (con fading) retuvo mejor que 100 %.
- Guidance hypothesis: el feedback frecuente **guía** el rendimiento pero crea dependencia y bloquea el desarrollo de la detección intrínseca de errores.

**Implicación:** distinguir **feedback intrínseco de la tarea** (el texto que aparece en pantalla, la tecla que no avanza) del **aumentado** (colores por tecla, PPM en vivo, mapa de calor). El primero se mantiene; el segundo, **resumido al final del ejercicio y con tendencia semanal**, no en tiempo real. Un contador de PPM en vivo durante la lección es lo que la guidance hypothesis desaconseja (y además incita a apurarse).

### 3.5 Errorless vs. error-based learning (¿parar en el error es bueno?)

- **Maxwell, Masters, Kerr & Weedon (2001)**, *The implicit benefit of learning without errors*, QJEP-A 54, 1049–1068. DOI [10.1080/713756014](https://doi.org/10.1080/713756014). [LAB, putting]. Aprender con pocos errores → menos reglas explícitas, **rendimiento robusto bajo tarea secundaria**.
- **Wong, Yuen, Yam, Tsang, Uiga & Capio (2026)**, *A systematic review and meta-analysis of the effects of errorless motor learning…*, Frontiers in Psychology. [PMC13053278](https://pmc.ncbi.nlm.nih.gov/articles/PMC13053278/). [META, 31 experimentos, 1.509 participantes]. **Rendimiento global g = 0,05 (n.s.); adultos jóvenes g = −0,06 (n.s.); precisión del movimiento g = 0,85 (p = 0,023); niños e individuos con impedimentos sí se benefician.** Certeza baja, riesgo de sesgo moderado-alto.
- **Vékony et al. (2022)** (§2.4): los errores no son necesarios para el aprendizaje procedural.
- En contra del "cero errores" absoluto: el tipeo real requiere **detección y reparación** (Logan & Crump 2010; Pinet & Nozari 2022; Kalfaoğlu & Stafford 2014) y la **guidance hypothesis** (§3.4).

**Implicación (veredicto detallado en §8):** "parar en el error" **no es dañino** según la evidencia disponible y tiene ventajas plausibles para la fase cognitiva del converso (reduce que el sistema viejo "gane" por velocidad; garantiza repeticiones correctas del mapeo nuevo). Pero **no debe ser el único modo**: hay que agregar un modo donde los errores pasan y hay que corregirlos con Backspace, con la métrica "errores al primer intento" + "tiempo hasta la reparación".

### 3.6 Overlearning

- **Driskell, Willis & Copper (1992)**, *Effect of overlearning on retention*, J. Applied Psychology 77, 615–622. [META, 15 estudios]. Efecto moderado, **menor en tareas físicas** y **decae con el intervalo de retención**.
- **Shibata et al. (2017)**, *Overlearning hyperstabilizes a skill…*, Nature Neuroscience 20, 470–475. DOI [10.1038/nn.4490](https://doi.org/10.1038/nn.4490). [LAB, aprendizaje perceptual]. Seguir practicando tras el máximo cambia el estado a inhibitorio (GABA) y protege lo aprendido de interferencia posterior.

**Implicación:** no declarar "dominada" una tecla en la sesión en que alcanza el umbral; exigir **umbral sostenido en ≥ 2–3 días distintos** (overlearning modesto + verificación de retención), y **no** alargar la sesión "porque va bien".

### 3.7 Sueño y consolidación — Walker, Brakefield, Morgan, Hobson & Stickgold (2002)

*Practice with sleep makes perfect*, Neuron 35, 205–211. DOI [10.1016/S0896-6273(02)00746-8](https://doi.org/10.1016/S0896-6273(02)00746-8). [LAB]. Secuencia de tapping de dedos: tras una noche de sueño, **+20 % velocidad y −39 % errores** sin práctica adicional; sin sueño, sin mejora. La ganancia se concentra en **las transiciones más lentas** antes de dormir.

**Implicación:** (a) la mejora entre días es esperable y la app puede **mostrarla** ("hoy arrancaste más rápido que ayer al cerrar"); (b) una sesión al final del día es al menos tan buena como una a la mañana; (c) refuerza "una sesión por día".

### 3.8 Duración de sesión

Evidencia directa en tipeo: Baddeley & Longman (§2.2). Complementario: la literatura de práctica distribuida (Shea 2000; Donovan 1999). **No encontré un estudio que compare 10 min diarios vs 60 min semanales en habilidades de teclado.** Lo más cercano es "1 h/día > 2 h/día" y la regla general de que la eficiencia por minuto cae con la duración. **Veredicto: rutina corta diaria — respaldada por extrapolación fuerte, sin dato puntual para 10–15 min.**

### 3.9 Speed–accuracy y entrenar "más rápido de lo normal"

Ver §2.4. Resumen: (a) piso ~100 ms/tecla; (b) la instrucción de velocidad no cambia lo aprendido; (c) las ráfagas rápidas son útiles como **diagnóstico** (qué bigramas se rompen) y para romper mesetas (Ericsson, no verificado textualmente). Riesgo específico del converso: bajo presión de velocidad **el sistema viejo (mirar) es el que se activa** (melioration). Por eso las ráfagas deben ir **a ciegas** o con tarea secundaria en pantalla.

### 3.10 Foco atencional y OPTIMAL

- **Chua, Jiménez-Díaz, Lewthwaite, Kim & Wulf (2021)**, *Superiority of external attentional focus…*, Psychological Bulletin 147, 618–645. PubMed [34843301](https://pubmed.ncbi.nlm.nih.gov/34843301/). [META]. Foco externo > interno **en rendimiento y aprendizaje, en todos los niveles de habilidad**.
- **Wulf & Lewthwaite (2016)**, *OPTIMAL theory*, PBR 23, 1382–1414. DOI [10.3758/s13423-015-0999-9](https://doi.org/10.3758/s13423-015-0999-9). [TEO]. Autonomía + expectativas de éxito + foco externo. **Crítica 2024**: *OPTIMAL theory's claims about motivation lack evidence in the motor learning literature*, Psychology of Sport and Exercise ([link](https://www.sciencedirect.com/science/article/pii/S1469029224001018)). [META/crítica]: la parte motivacional está sobre-vendida.

**Implicación:** instrucciones y visuales orientados a **la tecla y la letra** ("pegale a la F", resaltar la tecla), no al dedo ("índice izquierdo"). Las manos guía son foco interno explícito: **fade rápido**.

---

## 4. Ciencia cognitiva del aprendizaje aplicable

### 4.1 Repetición espaciada aplicada a teclas

- **Settles & Meeder (2016)**, *A trainable spaced repetition model for language learning* (half-life regression), ACL. DOI [10.18653/v1/P16-1174](https://doi.org/10.18653/v1/P16-1174). [OBS + modelo].
- **Ye, Su & Cao (2022)**, *A stochastic shortest path algorithm for optimizing spaced repetition scheduling* (base de FSRS), KDD. DOI [10.1145/3534678.3539081](https://doi.org/10.1145/3534678.3539081). [OBS + modelo]. Estado = estabilidad, dificultad, recuperabilidad.
- Cepeda 2008 (§3.2): gap óptimo 10–20 % del horizonte de retención.

**¿Aplica a teclas?** Parcialmente. Diferencias: (1) el olvido motor es lento (30 % en meses, no días); (2) el "ítem" no es una tecla sino un mapeo dedo-tecla **y** sus bigramas; (3) la práctica cotidiana repasa gratis las teclas frecuentes, así que el problema real son **las teclas/bigramas raros** (ñ, tildes, puntuación, números) que sí se olvidan por falta de uso. **Qué copiar:** el término de **estabilidad/decay por ítem**. Una EMA de latencia y errores es un buen estimador de *estado actual* pero no tiene noción de "hace cuánto no aparece". Modelo mínimo: `prioridad = f(EMA_latencia, EMA_error, días_desde_última_práctica / half_life_estimada)`; el half-life crece con cada revisión exitosa (à la HLR). Umbral de "dominio" = EMA buena **y** estabilidad alta (ver §3.6).

### 4.2 Desirable difficulties y aprendizaje ≠ rendimiento

- **Bjork & Bjork (2011)**, *Making things hard on yourself, but in a good way* ([PDF](https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf)). [TEO].
- **Soderstrom & Bjork (2015)**, *Learning versus performance: an integrative review*, Perspectives on Psychological Science 10, 176–199. DOI [10.1177/1745691615569000](https://doi.org/10.1177/1745691615569000). [TEO/revisión]. Lo que se mide durante la práctica es rendimiento; puede subir sin aprendizaje y bajar con aprendizaje.

**Implicación:** la métrica de progreso principal **no puede ser el rendimiento en la lección** (que con stop-on-error y manos guía está inflado). Debe ser una medida de **transferencia**: velocidad y errores en texto real, a ciegas, con mediana de varios días — que es lo que TypeLight llama "velocidad de referencia". Bien.

### 4.3 Interleaving

**Kornell & Bjork (2008)**, *Learning concepts and categories: is spacing the "enemy of induction"?*, Psychological Science 19, 585–592. DOI [10.1111/j.1467-9280.2008.02127.x](https://doi.org/10.1111/j.1467-9280.2008.02127.x). [LAB]. Mezclar categorías mejora la discriminación. Traducción al tipeo: el repaso debe **mezclar teclas confundibles** (b/v, n/m, tildes vs sin tilde, ; vs :) en la misma sesión para entrenar la discriminación del loop interno.

### 4.4 Chunking como unidad: bigrama / trigrama / palabra

Ver §1.5 y §1.1. La jerarquía empírica: **bigrama** (predice velocidad; frecuencia acelera IKI — Pinet 2016), **palabra** (interfaz entre loops; chunk que se forma con repetición consecutiva), **frase** (eye-hand span). Implicación: generar ejercicios por **bigramas objetivo insertados en palabras reales o pseudo-palabras pronunciables del español**, y textos con frecuencia léxica alta.

### 4.5 Dificultad óptima: regla del 85 % y challenge point

- **Wilson, Shenhav, Straccia & Cohen (2019)**, *The Eighty Five Percent Rule for optimal learning*, Nature Communications 10:4646. DOI [10.1038/s41467-019-12552-4](https://doi.org/10.1038/s41467-019-12552-4). [TEO + simulación]. Error óptimo 15,87 % **para clasificación binaria con aprendizaje por gradiente**. No es una ley empírica del aprendizaje motor humano; es un resultado de modelo, elegante y citado en exceso.
- **Guadagnoli & Lee (2004)**, *Challenge point: a framework…*, Journal of Motor Behavior 36, 212–224. DOI [10.3200/JMBR.36.2.212-224](https://doi.org/10.3200/JMBR.36.2.212-224). [TEO]. La dificultad funcional óptima depende del nivel; más información disponible no siempre es mejor.

**Implicación:** con stop-on-error la precisión final es 100 % siempre, así que la palanca de dificultad es: **velocidad objetivo** (como keybr), **densidad de teclas débiles** en el texto, y **longitud/anticipación**. Regla operativa razonable: ajustar para que la **precisión al primer intento** quede ~90–95 % en lección y ~85–90 % en repaso (números heurísticos, no evidencia directa).

### 4.6 Transferencia de drills aislados a texto real

- **Wightman & Lintern (1985)**, *Part-task training for tracking and manual control*, Human Factors 27, 267–283. [TEO/revisión]. El entrenamiento por partes es **menos eficiente que el de la tarea completa** salvo en tareas complejas o peligrosas; funciona mejor con *backward chaining* y reintegración temprana.
- Feit 2016 / Salthouse 1986: −50 % en cadenas aleatorias, en **todos** los niveles → practicar letras sueltas entrena algo que el texto real no usa igual.
- van den Bergh 2015: el loop de palabras plateau-ea tarde → **la mayor parte de la práctica de un converso debería ser en palabras**.

**Veredicto:** drills de teclas aisladas: **útiles sólo como introducción** (primeras decenas de repeticiones de una tecla nueva); después, todo en pseudo-palabras/palabras/frases. El currículo "fila guía → superior → inferior…" es tradición (Dvorak et al. 1936, *Typewriting Behavior*) y para un converso que ya conoce el layout tiene menos sentido que un orden por **frecuencia en español + bigramas problemáticos**.

### 4.7 Metas de proceso vs. de resultado

Keith & Ericsson 2007: la **meta explícita de tipear rápido en el uso cotidiano** discrimina a los mejores. Combinado con Yechiam: la meta debe estar ligada a **usar el tacto fuera de la app**. Sugerencia: un "compromiso de proceso" configurable ("esta semana escribo mis mails sin mirar") con auto-reporte, además de la meta de resultado (PPM).

---

## 5. Ritmo y música

- **Evidencia sobre isocronía:** Gentner 1983/1987 y Salthouse 1986 (§1.4): los intervalos **dependen del bigrama** y no escalan proporcionalmente; Dhakal 2018: los rápidos tienen **SD de IKI de 11 ms** pero eso es *consistencia por bigrama*, no un pulso uniforme (mismo dedo sigue siendo más lento que alternancia). Preprint 2026: la variabilidad baja con la frecuencia del n-grama.
- **Metrónomo en mecanografía:** históricamente real — el "Torka typewriter metronome" para aulas ([oz.Typewriter](https://oztypewriter.blogspot.com/2013/11/torka-typewriter-metronome.html)), instrucción "rítmica" de los años 20–50. **No encontré ningún estudio moderno controlado** que compare entrenamiento con metrónomo vs. sin. Posts de comunidad (Medium, typinghub, hilos de HN) lo recomiendan por anécdota. **[FOLK]**.
- **Habilidades seriadas y ritmo:** Seim et al. 2016 (*Tactile taps teach rhythmic text entry*, ISWC, DOI [10.1145/2971763.2971768](https://doi.org/10.1145/2971763.2971768)) muestra que el ritmo puede aprenderse pasivamente en Morse; no es transferible directo.

**Implicación:** (a) el juego "ritmo con metrónomo" es **legítimo como freno** para el que atropella y como variedad motivacional, **no como métrica de expertise**; (b) la métrica "ritmo" de TypeLight, si mide variabilidad global de IKI, **contradice** la estructura experta: reemplazar por **coeficiente de variación del IKI por bigrama (o por clase de bigrama) entre repeticiones**, normalizado por el IKI medio del usuario, como los "normalised bigram IKIs" de Dhakal; (c) un pulso fijo a **velocidad por debajo de la cómoda** es coherente con "precisión primero"; un pulso por encima es una ráfaga (§3.9).

---

## 6. Ergonomía y salud (breve)

- **Gerr et al. (2002)**, *A prospective study of computer users: I*, American Journal of Industrial Medicine 41, 221–235. DOI [10.1002/ajim.10066](https://doi.org/10.1002/ajim.10066); **Marcus et al. (2002)**, *II. Postural risk factors*, DOI [10.1002/ajim.10067](https://doi.org/10.1002/ajim.10067). [OBS prospectivo, n = 632, 3 años]. Menor riesgo cuello/hombro: **codo > 121°**, apoyabrazos; mayor riesgo mano/brazo: **tecla J > 3,5 cm sobre la mesa**, fuerza de activación > 48 g, desviación radial > 5° con el mouse.
- **McLean, Tingley, Scott & Rickards (2001)**, *Computer terminal work and the benefit of microbreaks*, Applied Ergonomics 32, 225–237. DOI [10.1016/S0003-6870(00)00071-5](https://doi.org/10.1016/S0003-6870(00)00071-5). [LAB/campo]. Micro-pausas (~cada 20 min) reducen malestar sin afectar productividad.
- Muñeca neutra (0° flexión/desviación) es la recomendación estándar (CCOHS/OSHA), con evidencia biomecánica más que de resultados.

**Implicación:** una tarjeta de postura de una pantalla al onboarding + un recordatorio de pausa si una sesión pasa de ~20 min. Nada más; la rutina corta ya minimiza el riesgo.

---

## 7. Motivación y hábito (breve; otra investigación lo cubre)

- **Ryan & Deci (2000)**, *Self-determination theory…*, American Psychologist 55, 68–78 ([PDF](https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf)). [TEO]. Autonomía, competencia, relación.
- **Sailer & Homner (2020)**, *The gamification of learning: a meta-analysis*, Educational Psychology Review 32, 77–112. DOI [10.1007/s10648-019-09498-w](https://doi.org/10.1007/s10648-019-09498-w). [META]. g = 0,49 cognitivo, 0,36 motivacional, 0,25 conductual; ficción de juego y competencia+colaboración moderan.
- **Lally, van Jaarsveld, Potts & Wardle (2010)**, *How are habits formed*, European Journal of Social Psychology 40, 998–1009. DOI [10.1002/ejsp.674](https://doi.org/10.1002/ejsp.674). [OBS, n = 96]. Mediana **66 días** (18–254) hasta automaticidad; **saltear un día no destruye el hábito**.
- Yechiam 2003 (§2.1) es, en el fondo, un resultado de motivación: **alinear el refuerzo inmediato con el objetivo**.

**Implicación:** (a) "constancia" medida en **días activos por semana**, no rachas que se rompen; (b) autonomía real: elegir juego/orden de la rutina (respaldado por OPTIMAL con la salvedad de la crítica 2024); (c) la competencia visible más honesta es la **velocidad a ciegas** creciendo.

---

## 8. Decisión actual de TypeLight vs. evidencia

| # | Decisión actual | Evidencia relevante | Veredicto | Qué cambiar |
|---|---|---|---|---|
| 1 | **Rutina diaria corta** (calentamiento → lección → repaso → reto) | Baddeley & Longman 1978; Shea 2000; Walker 2002; Cepeda 2006 | **Respaldada** | Nada estructural. No premiar segunda sesión el mismo día; mostrar ganancia overnight. |
| 2 | **Parar en el error sin Backspace** (cada ejercicio es una repetición 100 % correcta) | Maxwell 2001 (+); Wong 2026 META (neutro en adultos, + en precisión); Vékony 2022 (errores no necesarios); guidance hypothesis (−); Logan & Crump 2010 / Pinet & Nozari 2022 (la reparación es parte de la habilidad) (−) | **Matizar** | Mantener en lección de tecla nueva y calentamiento. Agregar modo "texto real" donde el error pasa y **hay que repararlo con Backspace**; medir errores al primer intento y latencia de reparación. Hacerlo obligatorio en reto y en al menos un bloque del repaso. |
| 3 | **Drills de teclas aisladas → luego texto** (currículo por filas) | Feit 2016/Salthouse (−50 % en aleatorio); Yamaguchi & Logan 2014/16 (palabras); van den Bergh 2015; Wightman & Lintern 1985; Dvorak 1936 (tradición) | **Matizar** | Letras sueltas sólo en la primera exposición. Luego pseudo-palabras pronunciables y palabras reales con el bigrama objetivo. Para un converso: ordenar por **frecuencia en español + bigramas que fallan**, no por fila. |
| 4 | **Repaso adaptativo por EMA de latencia/errores** | Cepeda 2008; Settles & Meeder 2016; Ye 2022; Yamaguchi & Logan 2016 (masificar dentro); Driskell 1992 | **Matizar** | Agregar término de **olvido / estabilidad por ítem** (half-life) para que teclas raras (ñ, tildes, símbolos) reaparezcan aunque su EMA sea buena. Dentro de la sesión: **bloques de 3–5 repeticiones seguidas** del ítem débil. "Dominio" exigido en ≥ 2–3 días distintos. |
| 5 | **Dominio por tecla** | Dhakal 2018 (bigramas r ≈ −0,7 vs tecla); Pinet 2016; Feit 2016 (entropía del mapeo) | **Matizar** | Añadir **dominio por bigrama** (clase: alternancia / misma mano / mismo dedo / repetición). Es lo que realmente discrimina lento de rápido. |
| 6 | **Reto de 1 minuto** como sesión de referencia | Dhakal (tests de 1 min son estándar comercial); folklore: 3–5 min más fiable; Yamaguchi 2013 (piso 100 ms) | **Neutra** | 1 min está bien como benchmark diario si se usa la **mediana de varios días** (ya se hace). Considerar un reto de 3 min **semanal** y, sobre todo, que el reto sea **a ciegas** (sin teclado virtual). No hay evidencia de que 1 min sea "demasiado corto" para aprendizaje; sólo para medición. |
| 7 | **Velocidad de referencia = mediana diaria** | Soderstrom & Bjork 2015 (rendimiento ≠ aprendizaje) | **Respaldada** | Reportar también la versión "a ciegas" como la métrica principal del converso. |
| 8 | **Teclado en pantalla + manos guía** | Logan & Crump 2009; Tapp & Logan 2011; Chua 2021 (foco externo); guidance hypothesis | **Contradicha en parte** | Manos guía: sólo primera exposición a una tecla, luego off por defecto. Teclado virtual: resaltar **tecla** (foco externo), no dedo; ocultarlo en repaso avanzado, reto y juegos. Ofrecer modo "a ciegas" explícito. |
| 9 | **Métrica "ritmo" = variabilidad de IKI** | Gentner 1983/87; Salthouse 1986; Dhakal 2018 (consistencia por bigrama) | **Contradicha si es variabilidad global** | Medir **CV del IKI por bigrama entre repeticiones**, normalizado; o al menos por clase de bigrama. Un tipista experto tiene IKIs desiguales entre bigramas y muy iguales dentro del mismo bigrama. |
| 10 | **Juego "ritmo con metrónomo"** | Sin evidencia moderna; artefacto histórico (Torka); Gentner (no isócrono) | **Neutra / folklore** | Mantener como juego. No usarlo como métrica ni como método principal. Pulso **por debajo** de la velocidad cómoda para practicar precisión. |
| 11 | **Juegos "reflejo por tecla" y "globos por inicial"** | Yechiam 2003 (tarea secundaria en pantalla contra melioration); Logan 2016 (no estándar degradan sin ver el teclado) | **Respaldada (más de lo que parece)** | Son la intervención anti-melioration. Incluirlos **dentro** de la rutina para conversos, no sólo como extra opcional. |
| 12 | **Carrera contra el fantasma** (ráfaga contra tu mejor reto) | Ericsson (10–20 % más rápido; no verificado); Vékony 2022 (no daña); Yamaguchi 2013 | **Respaldada como ráfaga ocasional** | OK. Que sea a ciegas o con foco en pantalla; no más de 1–2 por sesión. |
| 13 | **Precisión 7 días** | Dhakal (KSPC); Vékony | **Respaldada** | Asegurar que sea **precisión al primer intento** (errores bloqueados cuentan), no precisión final (que es 100 % con stop-on-error). |
| 14 | **Constancia** (streak) | Lally 2010; Sailer & Homner 2020 | **Matizar** | Días activos por semana, con perdón de un día. Rachas frágiles castigan justo al que necesita 66 días. |
| 15 | **Currículo por teclas nuevas para un adulto que ya conoce el layout** | Fitts & Posner; Logan 2016 (mapeo automático subóptimo); Yechiam; West 1983 (~10 h para reconvertir) | **Matizar** | El converso no aprende teclas, **desaprende un mapeo**. Onboarding diferenciado: diagnóstico a ciegas → foco en entropía del mapeo (una asignación por tecla) y en no mirar. |
| 16 | **Métricas de expertise que faltan: rollover** | Dhakal 2018 (r = 0,73) | **Oportunidad** | Registrar keyup y calcular rollover ratio; mostrarlo como "fluidez". Es barato y es el mejor predictor conocido. |
| 17 | **Feedback en vivo durante ejercicios** (si existe PPM live) | Winstein & Schmidt 1990; Salmoni 1984 | **Contradicha si hay PPM en vivo** | Resumen al final; tendencia semanal; sin contador durante la lección. |

---

## 9. Recomendaciones priorizadas

**P0 — cambian el modelo del aprendiz (converso, no principiante)**
1. **Modo "a ciegas" y velocidad de referencia a ciegas.** Ocultar teclado virtual y manos; pedir (opcional) funda o teclas en blanco. Es el diagnóstico y la métrica que alinea el refuerzo con el objetivo (Yechiam; Logan 2016; Feit 2016).
2. **Modo "texto real con Backspace"** en reto y en un bloque del repaso: el error pasa, se mide **error al primer intento** y **latencia de reparación**. Mantener stop-on-error para teclas nuevas y calentamiento (Wong 2026; Logan & Crump 2010; Pinet & Nozari 2022; guidance hypothesis).
3. **Rollover ratio** como métrica de fluidez (keydown/keyup). Predictor más fuerte conocido (Dhakal 2018).
4. **Manos guía off por defecto** tras la primera exposición; resaltar tecla, no dedo (Chua 2021; Logan & Crump 2009).

**P1 — mejoran la eficiencia de la práctica**
5. **Dominio por bigrama** (4 clases) además de por tecla; generar ejercicios que inserten el bigrama débil en palabras/pseudo-palabras del español (Dhakal; Pinet 2016; Yamaguchi & Logan).
6. **Repaso = EMA + half-life**: término de olvido por ítem; bloques de 3–5 repeticiones seguidas del ítem débil; "dominado" sólo si se sostiene ≥ 2–3 días (Yamaguchi & Logan 2016; Driskell 1992; HLR/FSRS).
7. **Métrica "ritmo" = consistencia por bigrama**, no isocronía (Gentner; Dhakal).
8. **Meter "reflejo" o "globos" dentro de la rutina** para conversos (tarea secundaria en pantalla = anti-melioration).
9. **Dificultad por velocidad objetivo + densidad de ítems débiles**, apuntando a ~90–95 % de precisión al primer intento (85 % rule / challenge point, heurístico).

**P2 — pulido**
10. Comunicar el **dip esperado** de la conversión y mostrar la **ganancia overnight** (Bryan & Harter; Gray 2017; Walker 2002).
11. **Constancia = días/semana con perdón**; no premiar doble sesión diaria (Lally; Baddeley & Longman).
12. Reto de **3 min semanal** a ciegas como referencia "lenta"; el de 1 min queda como diario.
13. **Tarjeta de postura + pausa a los 20 min** (Gerr/Marcus 2002; McLean 2001).
14. Sin PPM en vivo durante lecciones; resumen al final (Winstein & Schmidt 1990).
15. Metrónomo: pulso por debajo de la velocidad cómoda; sólo juego.

**Lagunas de evidencia (honestidad):** no existe RCT sobre stop-on-error vs. libre en tipeo; no existe RCT de teclado tapado en adultos; no hay estudio de 10 min diarios vs. sesiones largas en teclado; no hay estudio moderno de metrónomo en tipeo; la recomendación de Ericsson (10–20 %) no se verificó en el texto; la regla del 85 % es un resultado de modelo, no un hallazgo humano. Todo lo que TypeLight decida en esas zonas es **diseño razonado**, no evidencia — y sería un buen lugar para **A/B interno** con la propia telemetría (rollover, errores al primer intento, velocidad a ciegas).

---

## 10. Referencias completas

Estado: **V** = verificada (DOI/PubMed/portal o PDF leído), **V-p** = verificada parcialmente (existencia y resumen, no texto completo), **NV** = no verificada textualmente.

### Tipeo experto vs. novato
1. Dhakal, V., Feit, A. M., Kristensson, P. O., & Oulasvirta, A. (2018). Observations on typing from 136 million keystrokes. *CHI '18*. https://doi.org/10.1145/3173574.3174220 — **V (PDF leído)**
2. Feit, A. M., Weir, D., & Oulasvirta, A. (2016). How we type: Movement strategies and performance in everyday typing. *CHI '16*, 4262–4273. https://doi.org/10.1145/2858036.2858233 — **V (PDF leído)**
3. Logan, G. D., & Crump, M. J. C. (2011). Hierarchical control of cognitive processes: The case for skilled typewriting. *Psychology of Learning and Motivation*, 54, 1–27. https://doi.org/10.1016/B978-0-12-385527-5.00001-2 — **V**
4. Logan, G. D., & Crump, M. J. C. (2009). The left hand doesn't know what the right hand is doing. *Psychological Science*, 20, 1296–1300. https://doi.org/10.1111/j.1467-9280.2009.02442.x — **V**
5. Tapp, K. M., & Logan, G. D. (2011). Attention to the hands disrupts skilled typewriting: The role of vision. *Attention, Perception, & Psychophysics*, 73, 2379–2383. https://doi.org/10.3758/s13414-011-0208-5 — **V**
6. Logan, G. D., & Crump, M. J. C. (2010). Cognitive illusions of authorship reveal hierarchical error detection in skilled typists. *Science*, 330, 683–686. https://doi.org/10.1126/science.1190483 — **V**
7. Snyder, K. M., Logan, G. D., & Yamaguchi, M. (2015). Watch what you type. *Attention, Perception, & Psychophysics*, 77, 282–292. https://doi.org/10.3758/s13414-014-0756-6 — **V**
8. Crump, M. J. C., & Logan, G. D. (2010). Warning: This keyboard will deconstruct. *Psychonomic Bulletin & Review*, 17, 394–399. https://doi.org/10.3758/PBR.17.3.394 — **V**
9. Logan, G. D. (2018). Automatic control: How experts act without thinking. *Psychological Review*, 125, 453–485. https://pubmed.ncbi.nlm.nih.gov/29952620/ — **V**
10. Salthouse, T. A. (1986). Perceptual, cognitive, and motoric aspects of transcription typing. *Psychological Bulletin*, 99, 303–319. https://psycnet.apa.org/record/1986-21057-001 — **V-p**
11. Salthouse, T. A. (1984). Effects of age and skill in typing. *JEP: General*, 113, 345–371. — **V-p** (vía lista de referencias de Dhakal 2018)
12. Rumelhart, D. E., & Norman, D. A. (1982). Simulating a skilled typist. *Cognitive Science*, 6, 1–36. https://doi.org/10.1207/s15516709cog0601_1 — **V**
13. Gentner, D. R. (1983). Keystroke timing in transcription typing. En Cooper (Ed.), *Cognitive Aspects of Skilled Typewriting* (pp. 95–120). Springer. — **V-p**
14. Gentner, D. R. (1987). Timing of skilled motor performance: Tests of the proportional duration model. *Psychological Review*, 94, 255–276. https://psycnet.apa.org/fulltext/1987-20878-001.pdf — **V-p**
15. Grudin, J. T. (1983). Error patterns in novice and skilled transcription typing. En *Cognitive Aspects of Skilled Typewriting* (pp. 121–143). — **V-p**
16. Yamaguchi, M., & Logan, G. D. (2014). Pushing typists back on the learning curve: Revealing chunking in skilled typewriting. *JEP: HPP*, 40, 592–612. https://pubmed.ncbi.nlm.nih.gov/23875575/ — **V**
17. Yamaguchi, M., & Logan, G. D. (2016). Pushing typists back on the learning curve: Memory chunking in the hierarchical control of skilled typewriting. *JEP: LMC*, 42, 1919–1936. https://pubmed.ncbi.nlm.nih.gov/27336783/ — **V**
18. van den Bergh, M., Schmittmann, V. D., Hofman, A. D., & van der Maas, H. L. J. (2015). Tracing the development of typewriting skills in an adaptive e-learning environment. *Perceptual and Motor Skills*, 121, 727–745. https://doi.org/10.2466/23.25.PMS.121c26x6 — **V**
19. Pinet, S., Ziegler, J. C., & Alario, F.-X. (2016). Typing is writing: Linguistic properties modulate typing execution. *Psychonomic Bulletin & Review*, 23, 1898–1906. https://doi.org/10.3758/s13423-016-1044-3 — **V**
20. Pinet, S., Zielinski, C., Alario, F.-X., & Longcamp, M. (2022). Typing expertise in a large student population. *Cognitive Research: Principles and Implications*, 7:77. https://doi.org/10.1186/s41235-022-00424-3 — **V**
21. Pinet, S., & Nozari, N. (2022). Correction without consciousness in complex tasks: Evidence from typing. *Journal of Cognition*, 5(1). https://doi.org/10.5334/joc.202 — **V**
22. Kalfaoğlu, Ç., & Stafford, T. (2014). Performance breakdown effects dissociate from error detection effects in typing. *QJEP*, 67, 508–524. https://doi.org/10.1080/17470218.2013.820762 — **V**
23. Logan, G. D., Ulrich, J. E., & Lindsey, D. R. B. (2016). Different (key)strokes for different folks. *JEP: HPP*, 42. https://www.semanticscholar.org/paper/3e8e7d39e626bb7b765fce3d85af449a18f2be29 — **V-p**
24. Rieger, M., & Bart, V. K. E. (2016). Typing style and the use of different sources of information during typing. *Frontiers in Psychology*, 7:1908. https://doi.org/10.3389/fpsyg.2016.01908 — **V**
25. Keith, N., & Ericsson, K. A. (2007). A deliberate practice account of typing proficiency in everyday typists. *JEP: Applied*, 13, 135–145. https://pubmed.ncbi.nlm.nih.gov/17924799/ — **V**
26. Crump, M. J. C., Lai, W., & Brosowsky, N. P. (2019). Crunching big data with finger tips. En *Big Data in Cognitive Science* (Routledge). https://www.crumplab.com/Publications.html — **V-p**
27. [Preprint] Motor automaticity in natural keyboard typing (2026). bioRxiv. https://pmc.ncbi.nlm.nih.gov/articles/PMC13278139/ — **V-p (preprint)**
28. Palin, K., Feit, A. M., Kim, S., Kristensson, P. O., & Oulasvirta, A. (2019). How do people type on mobile devices? *MobileHCI '19*. https://doi.org/10.1145/3338286.3340120 — **V**

### Entrenamiento de mecanografía
29. Yechiam, E., Erev, I., Yehene, V., & Gopher, D. (2003). Melioration and the transition from touch-typing training to everyday use. *Human Factors*, 45, 671–684. https://doi.org/10.1518/hfes.45.4.671.27085 — **V**
30. Baddeley, A. D., & Longman, D. J. A. (1978). The influence of length and frequency of training session on the rate of learning to type. *Ergonomics*, 21, 627–635. https://doi.org/10.1080/00140137808931764 — **V**
31. Bryan, W. L., & Harter, N. (1899). Studies on the telegraphic language: The acquisition of a hierarchy of habits. *Psychological Review*, 6, 345–375. https://doi.org/10.1037/h0073117 — **V** (1897: *Psychological Review*, 4, 27–53 — **V-p**)
32. Keller, F. S. (1958). The phantom plateau. *JEAB*, 1, 1–13. https://doi.org/10.1901/jeab.1958.1-1 — **V**
33. Book, W. F. (1908). *The Psychology of Skill, with Special Reference to Its Acquisition in Typewriting*. https://books.google.com/books?id=VZMAAAAAMAAJ — **V-p**
34. Gray, W. D. (2017). Plateaus, dips, and leaps. *Cognitive Science*, 41, 1838–1870. https://doi.org/10.1111/cogs.12412 — **V**
35. Yamaguchi, M., Crump, M. J. C., & Logan, G. D. (2013). Speed–accuracy trade-off in skilled typewriting. *JEP: HPP*, 39, 678–699. https://doi.org/10.1037/a0030512 — **V**
36. Vékony, T., Pléh, C., Pesthy, O., Janacsek, K., & Nemeth, D. (2022). Speed and accuracy instructions affect two aspects of skill learning differently. *npj Science of Learning*, 7:27. https://doi.org/10.1038/s41539-022-00144-9 — **V**
37. Ericsson, K. A. (2006). The influence of experience and deliberate practice on the development of superior expert performance. En *The Cambridge Handbook of Expertise and Expert Performance* (pp. 685–706). — **V-p; la recomendación "10–20 % más rápido" NV**
38. West, L. J. (1983). *Acquisition of Typewriting Skills*. Bobbs-Merrill. — **NV** (citado vía Stager 1989)
39. Dvorak, A., Merrick, N. L., Dealey, W. L., & Ford, G. C. (1936). *Typewriting Behavior*. American Book Company. — **V-p** (vía Dhakal 2018)
40. Seim, C., et al. (2014). Passive haptic learning of Braille typing. *ISWC '14*. https://doi.org/10.1145/2634317.2634330 — **V**
41. Seim, C., Reynolds-Haertle, S., Srinivas, S., & Starner, T. (2016). Tactile taps teach rhythmic text entry. *ISWC '16*. https://doi.org/10.1145/2971763.2971768 — **V**
42. keybr.com — repositorio y ayuda. https://github.com/aradzie/keybr.com ; https://www.keybr.com/help — **V-p [FOLK]**
43. TypingClub/EdClub — On-error behavior (doc de producto). https://www.edclub.com/help/class-management/class-settings/on-error-behavior.html — **V-p [FOLK]**
44. "Why I built forced correction into my typing game" (dev.to, 2025). https://dev.to/clackpit_dev/why-i-built-forced-correction-into-my-typing-game-and-why-monkeytype-got-it-wrong-2n8l — **V [FOLK, sin evidencia]**
45. Torka typewriter metronome (artefacto histórico). https://oztypewriter.blogspot.com/2013/11/torka-typewriter-metronome.html — **V-p [FOLK/histórico]**

### Aprendizaje motor
46. Fitts, P. M., & Posner, M. I. (1967). *Human Performance*. Brooks/Cole. — **V-p**
47. Shea, J. B., & Morgan, R. L. (1979). Contextual interference effects on the acquisition, retention, and transfer of a motor skill. *JEP: Human Learning and Memory*, 5, 179–187. https://gwern.net/doc/psychology/spaced-repetition/1979-shea.pdf — **V**
48. Magill, R. A., & Hall, K. G. (1990). A review of the contextual interference effect in motor skill acquisition. *Human Movement Science*, 9, 241–289. https://www.sciencedirect.com/science/article/abs/pii/016794579090005X — **V**
49. Brady, F. (2004). Contextual interference: A meta-analytic study. *Perceptual and Motor Skills*, 99, 116–126. https://doi.org/10.2466/pms.99.1.116-126 — **V**
50. Czyż, S. H., Wójcik, A. M., Solarská, P., & Kiper, P. (2024). High contextual interference improves retention in motor learning: Systematic review and meta-analysis. *Scientific Reports*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11237090/ — **V**
51. The myth of contextual interference learning benefit in sports practice (2023). *Educational Research Review*. https://www.sciencedirect.com/science/article/abs/pii/S1747938X23000301 — **V-p**
52. Salmoni, A. W., Schmidt, R. A., & Walter, C. B. (1984). Knowledge of results and motor learning. *Psychological Bulletin*, 95, 355–386. — **V-p**
53. Winstein, C. J., & Schmidt, R. A. (1990). Reduced frequency of knowledge of results enhances motor skill learning. *JEP: LMC*, 16, 677–691. https://doi.org/10.1037/0278-7393.16.4.677 — **V**
54. Maxwell, J. P., Masters, R. S. W., Kerr, E., & Weedon, E. (2001). The implicit benefit of learning without errors. *QJEP-A*, 54, 1049–1068. https://doi.org/10.1080/713756014 — **V**
55. Wong, Yuen, Yam, Tsang, Uiga, & Capio (2026). A systematic review and meta-analysis of the effects of errorless motor learning on movement outcomes. *Frontiers in Psychology*. https://pmc.ncbi.nlm.nih.gov/articles/PMC13053278/ — **V**
56. Driskell, J. E., Willis, R. P., & Copper, C. (1992). Effect of overlearning on retention. *Journal of Applied Psychology*, 77, 615–622. — **V-p**
57. Shibata, K., et al. (2017). Overlearning hyperstabilizes a skill by rapidly making neurochemical processing inhibitory-dominant. *Nature Neuroscience*, 20, 470–475. https://doi.org/10.1038/nn.4490 — **V**
58. Walker, M. P., Brakefield, T., Morgan, A., Hobson, J. A., & Stickgold, R. (2002). Practice with sleep makes perfect. *Neuron*, 35, 205–211. https://doi.org/10.1016/S0896-6273(02)00746-8 — **V**
59. Shea, C. H., Lai, Q., Black, C., & Park, J.-H. (2000). Spacing practice sessions across days benefits the learning of motor skills. *Human Movement Science*, 19, 737–760. https://doi.org/10.1016/S0167-9457(00)00021-X — **V**
60. Donovan, J. J., & Radosevich, D. J. (1999). A meta-analytic review of the distribution of practice effect. *Journal of Applied Psychology*, 84, 795–805. https://gwern.net/doc/psychology/spaced-repetition/1999-donovan.pdf — **V**
61. Dutra, L. N., Campos, C. E., Costa, C. L. A., Ferreira, A. M., Couto, C. R., & Ugrinowitsch, H. (2026). Massed practice improves learning of serial motor skills. *QJEP*. https://doi.org/10.1177/17470218251369711 — **V**
62. Guadagnoli, M. A., & Lee, T. D. (2004). Challenge point. *Journal of Motor Behavior*, 36, 212–224. https://doi.org/10.3200/JMBR.36.2.212-224 — **V**
63. Wulf, G., & Lewthwaite, R. (2016). OPTIMAL theory of motor learning. *Psychonomic Bulletin & Review*, 23, 1382–1414. https://doi.org/10.3758/s13423-015-0999-9 — **V**
64. OPTIMAL theory's claims about motivation lack evidence in the motor learning literature (2024). *Psychology of Sport and Exercise*. https://www.sciencedirect.com/science/article/pii/S1469029224001018 — **V-p**
65. Chua, L.-K., Jiménez-Díaz, J., Lewthwaite, R., Kim, T., & Wulf, G. (2021). Superiority of external attentional focus for motor performance and learning. *Psychological Bulletin*, 147, 618–645. https://pubmed.ncbi.nlm.nih.gov/34843301/ — **V**
66. Wightman, D. C., & Lintern, G. (1985). Part-task training for tracking and manual control. *Human Factors*, 27, 267–283. https://doi.org/10.1177/001872088502700304 — **V**
67. A multi-representation approach to the contextual interference effect (2022). *Psychological Research*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9090686/ — **V-p**

### Ciencia cognitiva del aprendizaje
68. Wilson, R. C., Shenhav, A., Straccia, M., & Cohen, J. D. (2019). The Eighty Five Percent Rule for optimal learning. *Nature Communications*, 10:4646. https://doi.org/10.1038/s41467-019-12552-4 — **V**
69. Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way. En *Psychology and the Real World* (pp. 56–64). https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf — **V**
70. Soderstrom, N. C., & Bjork, R. A. (2015). Learning versus performance. *Perspectives on Psychological Science*, 10, 176–199. https://doi.org/10.1177/1745691615569000 — **V**
71. Kornell, N., & Bjork, R. A. (2008). Learning concepts and categories: Is spacing the "enemy of induction"? *Psychological Science*, 19, 585–592. https://doi.org/10.1111/j.1467-9280.2008.02127.x — **V**
72. Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin*, 132, 354–380. https://www.yorku.ca/ncepeda/publications/CPVWR2006.html — **V**
73. Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. *Psychological Science*, 19, 1095–1102. https://pubmed.ncbi.nlm.nih.gov/19076480/ — **V**
74. Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning. *ACL 2016*, 1848–1858. https://doi.org/10.18653/v1/P16-1174 — **V**
75. Ye, J., Su, J., & Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. *KDD '22*, 4381–4390. https://doi.org/10.1145/3534678.3539081 — **V**

### Ergonomía
76. Gerr, F., et al. (2002). A prospective study of computer users: I. *American Journal of Industrial Medicine*, 41, 221–235. https://doi.org/10.1002/ajim.10066 — **V**
77. Marcus, M., et al. (2002). A prospective study of computer users: II. Postural risk factors. *American Journal of Industrial Medicine*, 41, 236–249. https://doi.org/10.1002/ajim.10067 — **V**
78. McLean, L., Tingley, M., Scott, R. N., & Rickards, J. (2001). Computer terminal work and the benefit of microbreaks. *Applied Ergonomics*, 32, 225–237. https://doi.org/10.1016/S0003-6870(00)00071-5 — **V**

### Motivación y hábito
79. Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation. *American Psychologist*, 55, 68–78. https://selfdeterminationtheory.org/SDT/documents/2000_RyanDeci_SDT.pdf — **V**
80. Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review*, 32, 77–112. https://doi.org/10.1007/s10648-019-09498-w — **V**
81. Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed. *European Journal of Social Psychology*, 40, 998–1009. https://doi.org/10.1002/ejsp.674 — **V**

---

*Notas de método:* las cifras de Dhakal 2018 y Feit 2016 provienen de la lectura directa de los PDF; las de los demás trabajos provienen de abstracts, portales de autores, PubMed o resúmenes secundarios y se señalan como tales cuando hay duda. La sección 8 usa cuatro veredictos: **respaldada** (evidencia directa o extrapolación fuerte a favor), **neutra** (sin evidencia relevante en ninguna dirección), **matizar** (evidencia mixta o que sugiere una versión modificada de la decisión), **contradicha** (evidencia razonable en contra de la forma actual).
