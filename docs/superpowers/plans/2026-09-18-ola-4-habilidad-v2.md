# Ola 4 · Modelo de habilidad v2 — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** EMA ponderada con olvido y dominio sostenido; bigramas con clases; palabras problemáticas con «practicar estas»; cualidades de la debilidad; predicción hacia la meta; métricas de tecla muerta.

**Architecture:** motor puro (`engine/typing`: `bigramSamples`, `wordSamples`, `deadKeyStats`; `engine/stats`: EMA v2, `bigrams.ts`, `words.ts`, `qualities.ts`, `forecast.ts`; `engine/layouts`: `rowFor`), store v6 (`bigrams`, `words`, `KeyStat.halfLife/daysSeen`, `SessionRecord.dead`), UI en Progreso (Transiciones, Palabras, predicción), Repaso (bigramas débiles, «Hoy pesa») y Reto (palabras que se resistieron → `/practica/palabras`).

**Spec:** `docs/superpowers/specs/2026-09-18-ola-4-habilidad-v2-design.md`

> **Estado:** en ejecución en la rama `ola-4`.

## Global Constraints

Motor puro. Lint: 4 advertencias previas. Build solo antes del merge. Patches con Python desde Write.

---

### Task 1: EMA v2 con olvido (`updateKeyStats`, `weaknessScore`, `mastery`)
- [ ] Tests en `stats.test.ts`/`progress.test.ts`: α ponderado (100 muestras + 1 error → errorEma ≈ 0.01), piso 0.1, `halfLife` sube/baja, `daysSeen`, `weaknessScore` con gap, `mastery` con `daysSeen` y decaimiento. Implementar. Commit.

### Task 2: Bigramas, palabras, tecla muerta en el motor de tipeo
- [ ] `engine/typing`: `bigramSamples`, `wordSamples`, `deadKeyStats` con tests. Commit.

### Task 3: `engine/stats`: `bigrams.ts`, `words.ts`, `qualities.ts`, `forecast.ts`; `engine/layouts.rowFor`; `adaptiveText` con bigramas
- [ ] Tests por módulo. Commit.

### Task 4: Store v6 + backup
- [ ] Migración (halfLife/daysSeen, bigrams/words vacíos), `recordSession` actualiza bigramas y palabras, `dead` en la sesión, reset, validador. Tests. Commit.

### Task 5: UI — Repaso, Reto («Practicar estas» + `/practica/palabras`), Progreso (Transiciones, Palabras, predicción, Tildes), snapshot con olvido
- [ ] e2e `habilidad.spec.ts`. Commit.

### Task 6: Cierre — verificación completa, docs, merge ff, push.
