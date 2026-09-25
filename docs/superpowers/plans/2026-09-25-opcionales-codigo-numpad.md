# Unidades opcionales · código y teclado numérico — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dos unidades opcionales al final de la ruta (Símbolos de código, Teclado numérico) que no alteran el camino principal.

**Spec:** `docs/superpowers/specs/2026-09-25-opcionales-codigo-numpad-design.md`

> **Estado:** ejecutado completo el 2026-09-25 (4 tareas), mergeado fast-forward a `master`.

### [x] Task 1: Motor — corpus `code.ts`, `codeText`, `numpadText`, `ExerciseSpec` `code`/`numpad`, `Unit/Lesson.optional`, `Lesson.numpad`, las dos unidades en `build.ts`, `nextLesson` principal primero. Tests. Commit.
### [x] Task 2: App — `useProgress` (`last` principal, desbloqueo de opcionales), Inicio cuenta solo principales, Ruta con rótulo «Opcionales». e2e. Commit.
### [x] Task 3: Teclado numérico en pantalla — `numpad.ts` (`numpadVerdict`, mapas de dedo y código), `Numpad`, `KeyGuide pad`, guardia en `useHiddenInput`/`TypingArea`, `LessonPlayer` sin muestras en lecciones `numpad`. Tests + e2e. Commit.
### [x] Task 4: Cierre — verificación completa, docs (spec/plan/backlog/memoria), merge ff.
