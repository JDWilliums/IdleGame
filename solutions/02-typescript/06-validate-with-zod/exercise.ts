// Reference solution for 02-06. Read it only AFTER your own version passes.
import { z } from 'zod';

export const SaveFileSchema = z.object({
  version: z.literal(1),
  playerName: z.string().trim().min(1).max(20), // trim runs BEFORE the length checks
  gold: z.number().int().nonnegative(),
  skills: z.record(z.string(), z.object({ xp: z.number().int().nonnegative() })),
  bank: z.record(z.string(), z.number().int().min(1)).default({}),
  lastSavedAt: z.number().int().positive(),
});

export type SaveFile = z.infer<typeof SaveFileSchema>;

export type ParseResult = { ok: true; save: SaveFile } | { ok: false; error: string };

export function parseSave(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }

  const result = SaveFileSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue && issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return { ok: false, error: `${where}: ${issue?.message ?? 'Invalid save'}` };
  }
  return { ok: true, save: result.data }; // the PARSED data, with defaults and transforms applied
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertIsString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string`);
  }
}
