/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-08 · save-migrations
 * Lesson:  13.10 Saving, versioning & migrations
 * Run:     npm run watch 13-08
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Your game has shipped three save formats. Every old save must keep loading,
 * and nothing must ever be silently lost. The schemas for each version are
 * PROVIDED below. You write the migrations and the loader.
 *
 * TASK 1 · migrateV1toV2(save: SaveV1): SaveV2
 *   - skills: xp record → { [skill]: { xp } }
 *   - bank: from the items ARRAY. The same id can appear more than once, so
 *     SUM the quantities. Leave out ids whose total is ≤ 0.
 *   - lastSavedAt = savedAt;  version = 2
 *
 * TASK 2 · migrateV2toV3(save: SaveV2): SaveV3
 *   - rename the item 'log' to 'oak_log', MERGING with any existing oak_log
 *   - createdAt = lastSavedAt (the best guess we have)
 *   - settings = { sound: true, notifications: false }
 *   - version = 3
 *
 * TASK 3 · loadSave(text: string): LoadResult
 *   Errors (exact messages):
 *     invalid JSON                              → 'Save is not valid JSON'
 *     not an object, or no numeric `version`    → 'Save has no version'
 *     version > CURRENT_SAVE_VERSION            → `Save is from a newer version of the game (v${n})`
 *     version not an integer ≥ 1                → `Unknown save version (v${n})`
 *     fails its version's schema (before or after migrating) → 'Save is corrupted'
 *   Success → { ok: true, save: <a valid SaveV3>, migratedFrom: <the original version> }
 *   Validate the input with ITS version's schema, migrate step by step, and
 *   validate the final result with SaveV3Schema.
 *
 * TASK 4 · exportSave(save) / importSave(code)
 *   exportSave: JSON → UTF-8 bytes → base64. It must handle non-ASCII text, like
 *     an emoji in a skill name. Use TextEncoder.
 *   importSave: base64 → bytes → text (TextDecoder) → loadSave(text).
 *     Invalid base64 → { ok: false, error: 'Save code is not valid' }.
 */
import { z } from 'zod';

// ─── provided: the three save formats ────────────────────────────────────────
export const CURRENT_SAVE_VERSION = 3;

const xp = z.number().int().nonnegative();
const qty = z.number().int();

export const SaveV1Schema = z.object({
  version: z.literal(1),
  gold: z.number().int().nonnegative(),
  xp: z.record(z.string(), xp),
  items: z.array(z.object({ id: z.string(), qty })),
  savedAt: z.number(),
});

export const SaveV2Schema = z.object({
  version: z.literal(2),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp })),
  bank: z.record(z.string(), z.number().int().positive()),
  lastSavedAt: z.number(),
});

export const SaveV3Schema = z.object({
  version: z.literal(3),
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp })),
  bank: z.record(z.string(), z.number().int().positive()),
  lastSavedAt: z.number(),
  createdAt: z.number(),
  settings: z.object({ sound: z.boolean(), notifications: z.boolean() }),
});

export type SaveV1 = z.infer<typeof SaveV1Schema>;
export type SaveV2 = z.infer<typeof SaveV2Schema>;
export type SaveV3 = z.infer<typeof SaveV3Schema>;

export type LoadResult = { ok: true; save: SaveV3; migratedFrom: number } | { ok: false; error: string };
// ─────────────────────────────────────────────────────────────────────────────

export function migrateV1toV2(save: SaveV1): SaveV2 {
  throw new Error('Not implemented yet');
}

export function migrateV2toV3(save: SaveV2): SaveV3 {
  throw new Error('Not implemented yet');
}

export function loadSave(text: string): LoadResult {
  throw new Error('Not implemented yet');
}

export function exportSave(save: SaveV3): string {
  throw new Error('Not implemented yet');
}

export function importSave(code: string): LoadResult {
  throw new Error('Not implemented yet');
}
