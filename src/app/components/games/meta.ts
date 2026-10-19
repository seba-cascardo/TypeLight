import type { GameId } from '@/engine/curriculum'
import type { GhostSource } from '@/engine/games'
import type { KeycapVariant } from '../Keycap'

export interface GameMeta {
  title: string
  blurb: string
  glyph: string
  variant: KeycapVariant
}

export const GAME_META: Record<GameId, GameMeta> = {
  rain: { title: 'Lluvia de teclas', blurb: 'Reflejo: atrapá cada tecla antes de que caiga al agua.', glyph: '▼', variant: 'coral' },
  rhythm: { title: 'Al compás', blurb: 'Ritmo: tocá cada tecla justo cuando entra en la zona.', glyph: '♪', variant: 'lav' },
  balloons: { title: 'Globos de palabras', blurb: 'Palabras enteras, de corrido, antes de que se escapen.', glyph: '○', variant: 'secondary' },
  race: { title: 'Carrera contra tu fantasma', blurb: 'Frases reales contra tu mejor de la semana.', glyph: '⚑', variant: 'primary' },
  sudden: { title: 'Muerte súbita', blurb: 'Texto real: el primer error termina. Puntaje = caracteres.', glyph: '⚡', variant: 'sun' },
}

/** Carrera: who the ghost is, after «Fantasma a N PPM ·». */
export const GHOST_FROM: Record<GhostSource, string> = {
  lesson: 'la meta de esta lección',
  week: 'tu mejor de la semana',
  goal: 'la meta de la unidad',
  month: 'vos hace 30 días',
}
