import type { IntroCard } from './types'

export interface Tip {
  id: string
  title: string
  cards: IntroCard[]
}

export const TIP_INTRO: Tip = {
  id: 'intro',
  title: 'Antes de empezar',
  cards: [
    {
      title: 'Las manos en la fila guía',
      body:
        'Apoyá los dedos de la mano izquierda en A S D F y los de la derecha en J K L y la tecla que sigue. Los índices sienten un relieve en la F y la J: es la brújula para volver sin mirar. Los pulgares flotan sobre la barra espaciadora.',
      highlight: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
    },
    {
      title: 'Cada dedo tiene su territorio',
      body:
        'Cada tecla pertenece a un dedo, y siempre al mismo. En el teclado de la pantalla, los colores marcan qué dedo va a cada tecla. Después de presionar, el dedo vuelve a su tecla de la fila guía.',
      highlight: [],
    },
    {
      title: 'Ojos en la pantalla',
      body:
        'La regla más importante: no mirar el teclado. Al principio vas a ir lento y eso está bien. La velocidad llega sola cuando la precisión ya está.',
      highlight: [],
    },
  ],
}

export const TIP_POSTURE: Tip = {
  id: 'postura',
  title: 'Postura saludable',
  cards: [
    {
      title: 'Sentate bien',
      body:
        'Espalda apoyada, pies en el piso, hombros sueltos. Los codos a unos noventa grados y las muñecas rectas, sin apoyarlas en la mesa mientras escribís. La pantalla a la altura de los ojos.',
      highlight: [],
    },
    {
      title: 'Manos livianas',
      body:
        'No aplastes las teclas: un toque corto alcanza. Si sentís tensión en los dedos o en el cuello, pará, sacudí las manos y volvé.',
      highlight: [],
    },
  ],
}

export const TIP_IDEAS: Tip = {
  id: 'ideas',
  title: 'Pensá en ideas, no en dedos',
  cards: [
    {
      title: 'El objetivo es olvidarse de las manos',
      body:
        'Cuando escribís bien, no pensás en dónde está cada letra: pensás en lo que querés decir. Todo lo que hacemos acá apunta a eso. Si tenés que pensar en un dedo, todavía falta repetir un poco más, y no pasa nada.',
      highlight: [],
    },
    {
      title: 'Ritmo parejo',
      body:
        'Intentá que cada tecla suene a la misma distancia de la anterior, como un metrónomo lento. Es mejor un ritmo constante y lento que ráfagas rápidas con frenadas.',
      highlight: [],
    },
  ],
}

export const TIP_BREAK: Tip = {
  id: 'descanso',
  title: 'Tomá un descanso',
  cards: [
    {
      title: 'Descansar también entrena',
      body:
        'El cerebro consolida lo que practicaste mientras descansás, sobre todo al dormir. Diez o quince minutos por día rinden más que una hora de vez en cuando.',
      highlight: [],
    },
    {
      title: 'Mirá lejos',
      body:
        'Cada veinte minutos frente a la pantalla, mirá algo a veinte metros durante veinte segundos. Los ojos también se cansan de tipear.',
      highlight: [],
    },
  ],
}

export const TIP_SHIFT: Tip = {
  id: 'shift',
  title: 'La tecla Shift',
  cards: [
    {
      title: 'Dos Shift, una regla',
      body:
        'Hay un Shift a cada lado. Se usa siempre el de la mano contraria a la que escribe la letra: para una F mayúscula (índice izquierdo) apretás el Shift derecho con el meñique derecho. Así las manos no se retuercen.',
      highlight: ['F', 'J'],
    },
    {
      title: 'Apretar, escribir, soltar',
      body: 'Mantené Shift, tocá la letra, soltá Shift. Tres tiempos cortos. Con la práctica se vuelve un solo gesto.',
      highlight: [],
    },
  ],
}

export const TIP_ACCENTS: Tip = {
  id: 'acentos',
  title: 'Tildes: la tecla muerta',
  cards: [
    {
      title: 'Una tecla que espera',
      body:
        'En tu teclado la tilde (´) es una tecla “muerta”: al presionarla no aparece nada. Recién cuando presionás la vocal, salen juntas: á, é, í, ó, ú. Es un gesto de dos teclas que enseguida se vuelve uno solo.',
      highlight: ['á'],
    },
    {
      title: 'Diéresis',
      body: 'Con Shift, la misma tecla muerta hace la diéresis (¨) para la ü de pingüino o vergüenza.',
      highlight: ['ü'],
    },
  ],
}

export const TIP_NUMBERS: Tip = {
  id: 'numeros',
  title: 'La fila de números',
  cards: [
    {
      title: 'Un viaje largo',
      body:
        'Los números están dos filas arriba de la fila guía. Cada dedo sube en diagonal a su número y vuelve. Los índices cubren dos números cada uno (4 y 5, 6 y 7); los meñiques, el 1 y el 0.',
      highlight: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    },
  ],
}

export const TIP_SPEED: Tip = {
  id: 'velocidad',
  title: 'Ahora sí, velocidad',
  cards: [
    {
      title: 'Ya conocés todas las teclas',
      body:
        'Desde acá el trabajo es texto real: frases completas con mayúsculas, tildes, números y signos. Cada lección tiene una meta de velocidad un poco más alta. No la persigas: si la precisión se mantiene arriba del 97 %, la velocidad viene sola.',
      highlight: [],
    },
  ],
}
