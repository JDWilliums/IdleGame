/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 02-06 · validate-with-zod
 * Lesson:  02.7 Validating unknown data
 * Run:     npm run watch 02-06
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Your game loads saves from localStorage, where they may be corrupted, tampered
 * with, or from an old version. Validate them at the boundary.
 *
 * TASK 1 · SaveFileSchema (Zod)
 *   version:     exactly the number 1
 *   playerName:  a string, whitespace-trimmed, 1–20 characters (after trimming)
 *   gold:        an integer ≥ 0
 *   skills:      a record of skill id → { xp: integer ≥ 0 }
 *   bank:        a record of item id → integer ≥ 1. Defaults to {} if missing.
 *   lastSavedAt: a positive integer (a timestamp in ms)
 *
 * TASK 2 · SaveFile
 *   Replace `unknown` with the type INFERRED from the schema (one line).
 *
 * TASK 3 · parseSave(text: string): ParseResult
 *   Never throws.
 *   - text isn't valid JSON → { ok: false, error: "Invalid JSON" }
 *   - JSON is valid but fails the schema → { ok: false, error: "<path>: <message>" }
 *     for the FIRST issue, with the path joined by "." (e.g. "skills.fishing.xp: …").
 *     Use "(root)" when the path is empty.
 *   - success → { ok: true, save } where `save` is the PARSED data (trimmed name,
 *     defaults applied).
 *
 * TASK 4 · isRecord(value: unknown)
 *   A type guard for plain objects: true for {} / { a: 1 }, false for null,
 *   arrays, strings, numbers…   (return type: value is Record<string, unknown>)
 *
 * TASK 5 · assertIsString(value: unknown, name: string)
 *   An ASSERTION function (return type: asserts value is string). Throws a
 *   TypeError with the message `${name} must be a string` when it isn't one.
 */
import { z } from 'zod';

export const SaveFileSchema = z.object({
  // TODO (Task 1)
});

export type SaveFile = unknown; // TODO (Task 2)

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: string };

export function parseSave(text: string): ParseResult {
  throw new Error('Not implemented yet');
}

export function isRecord(value: unknown): boolean {
  throw new Error('Not implemented yet');
}

export function assertIsString(value: unknown, name: string): void {
  throw new Error('Not implemented yet');
}
