# Backlog

Pendientes acordados con Seba, en orden de llegada. Los "hechos" se borran de acá y quedan en git.

## Pendientes

- **Ola 5 · lo que quedó** (§5 Ola 5): **modo lectura** (punto 35, L: libros rioplatenses de dominio público por párrafos, «stop on word») y **teclado numérico y símbolos de código** como unidades opcionales (punto 36, M). Piden corpus y unidades nuevas: conviene que Seba diga si los quiere antes de invertir.
- **Revisión con Seba** de todo lo hecho en la sesión nocturna (Olas 2–5 + pasada de calidad): copy y consistencia de las pantallas nuevas con él delante, y bugs sobre uso real (el modelo v2 y las tablas de bigramas/palabras recién empiezan a llenarse). Lo automático ya pasó: 211 unitarios, 33 e2e, rutas con carga diferida (chunk principal 684 → 421 KB).

## Ideas sueltas (sin compromiso)

- Sílabas y palabras como notas de Al compás en la unidad Velocidad (hoy son letras sueltas).
- Cortar la línea de tendencia del chart de referencia en la marca «sin ayuda» (hoy la media móvil cruza la discontinuidad).
- En la Carrera, Enter sigue funcionando aunque el auto-chequeo de forma no se haya respondido (en el Reto y el examen, no): decidir si vale la pena gatearlo también ahí.
- Hito y resumen semanal pueden coincidir el mismo día en Inicio (dos tarjetas cerrables): si molesta, mostrar una por vez.
- «Cap de atraso» del punto 20 del reporte: la app no muestra backlog en ningún lado, así que no había nada que capar.
- La Carrera no alimenta bigramas ni palabras (solo lecciones, Repaso, Reto, examen y el drill de palabras): si hace falta, `GameResult.typing` puede llevar `bigrams`/`words` como lleva `samples`.
- «Consistencia por bigrama» (punto 23, reemplazo de Ritmo parejo): quedó Fluidez (rollover) en su lugar; la desviación por bigrama no se muestra.
- Muerte súbita no está en la ruta (solo en «Jugar»); si Seba la quiere en la dieta, entra como hueco de juego como los demás.
- El texto propio no tiene historial: cada vez se pega de nuevo (a propósito: no es una biblioteca).
- Un día de juego puede coincidir con que la lección siguiente también sea Al compás (dos «Al compás» en la misma rutina): raro y benigno; si molesta, `warmupGame` puede mirar la lección siguiente.
