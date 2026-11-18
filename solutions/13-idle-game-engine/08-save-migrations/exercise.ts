// Reference solution for 13-08. Read it only AFTER your own version passes.
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
  const totals: Record<string, number> = {};
  for (const { id, qty: amount } of save.items) totals[id] = (totals[id] ?? 0) + amount;
  return {
    version: 2,
    gold: save.gold,
    skills: Object.fromEntries(Object.entries(save.xp).map(([id, value]) => [id, { xp: value }])),
    bank: Object.fromEntries(Object.entries(totals).filter(([, amount]) => amount > 0)),
    lastSavedAt: save.savedAt,
  };
}

export function migrateV2toV3(save: SaveV2): SaveV3 {
  const { log, ...rest } = save.bank;
  const bank = log === undefined ? rest : { ...rest, oak_log: (rest.oak_log ?? 0) + log }; // MERGE, never overwrite
  return {
    ...save,
    version: 3,
    bank,
    createdAt: save.lastSavedAt,
    settings: { sound: true, notifications: false },
  };
}

const CORRUPTED: LoadResult = { ok: false, error: 'Save is corrupted' };

export function loadSave(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Save is not valid JSON' };
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw) || !('version' in raw) || typeof raw.version !== 'number') {
    return { ok: false, error: 'Save has no version' };
  }
  const version = raw.version;
  if (version > CURRENT_SAVE_VERSION) {
    return { ok: false, error: `Save is from a newer version of the game (v${version})` };
  }
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, error: `Unknown save version (v${version})` };
  }

  // Validate at the input version, then walk the migration chain.
  let current: SaveV1 | SaveV2 | SaveV3;
  if (version === 1) {
    const parsed = SaveV1Schema.safeParse(raw);
    if (!parsed.success) return CORRUPTED;
    current = migrateV2toV3(migrateV1toV2(parsed.data));
  } else if (version === 2) {
    const parsed = SaveV2Schema.safeParse(raw);
    if (!parsed.success) return CORRUPTED;
    current = migrateV2toV3(parsed.data);
  } else {
    current = raw as SaveV3; // validated just below
  }

  const final = SaveV3Schema.safeParse(current);
  if (!final.success) return CORRUPTED;
  return { ok: true, save: final.data, migratedFrom: version };
}

export function exportSave(save: SaveV3): string {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function importSave(code: string): LoadResult {
  let text: string;
  try {
    const binary = atob(code.trim()); // throws on invalid base64
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: 'Save code is not valid' };
  }
  return loadSave(text);
}
