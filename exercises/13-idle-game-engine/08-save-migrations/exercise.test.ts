import { describe, expect, it } from 'vitest';
import {
  exportSave,
  importSave,
  loadSave,
  migrateV1toV2,
  migrateV2toV3,
  SaveV3Schema,
  type SaveV1,
  type SaveV2,
  type SaveV3,
} from './exercise';

// Fixtures: real saves as they were written by each version of the game.
const v1: SaveV1 = {
  version: 1,
  gold: 120,
  xp: { woodcutting: 450, mining: 30 },
  items: [
    { id: 'log', qty: 20 },
    { id: 'copper_ore', qty: 4 },
    { id: 'log', qty: 5 }, // duplicates happened in v1!
    { id: 'tin_ore', qty: 0 }, // and empty stacks
  ],
  savedAt: 1_700_000_000_000,
};

const v2: SaveV2 = {
  version: 2,
  gold: 300,
  skills: { woodcutting: { xp: 900 } },
  bank: { log: 10, oak_log: 3, copper_ore: 7 },
  lastSavedAt: 1_710_000_000_000,
};

const v3: SaveV3 = {
  version: 3,
  gold: 5,
  skills: { fishing: { xp: 12 } },
  bank: { raw_shrimp: 2 },
  lastSavedAt: 1_720_000_000_000,
  createdAt: 1_715_000_000_000,
  settings: { sound: false, notifications: true },
};

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

describe('migrateV1toV2', () => {
  it('restructures skills and merges the items array into a bank', () => {
    expect(migrateV1toV2(deepFreeze(structuredClone(v1)))).toEqual({
      version: 2,
      gold: 120,
      skills: { woodcutting: { xp: 450 }, mining: { xp: 30 } },
      bank: { log: 25, copper_ore: 4 },
      lastSavedAt: 1_700_000_000_000,
    });
  });
});

describe('migrateV2toV3', () => {
  it('renames log → oak_log by merging, and adds new fields', () => {
    expect(migrateV2toV3(deepFreeze(structuredClone(v2)))).toEqual({
      version: 3,
      gold: 300,
      skills: { woodcutting: { xp: 900 } },
      bank: { oak_log: 13, copper_ore: 7 },
      lastSavedAt: 1_710_000_000_000,
      createdAt: 1_710_000_000_000,
      settings: { sound: true, notifications: false },
    });
  });

  it('leaves banks without logs alone', () => {
    const save = { ...v2, bank: { copper_ore: 1 } };
    expect(migrateV2toV3(save).bank).toEqual({ copper_ore: 1 });
  });
});

describe('loadSave', () => {
  it('loads a current save unchanged', () => {
    expect(loadSave(JSON.stringify(v3))).toEqual({ ok: true, save: v3, migratedFrom: 3 });
  });

  it('migrates v2 → v3', () => {
    const result = loadSave(JSON.stringify(v2));
    expect(result).toMatchObject({ ok: true, migratedFrom: 2 });
    if (result.ok) expect(result.save.bank).toEqual({ oak_log: 13, copper_ore: 7 });
  });

  it('migrates v1 all the way to v3', () => {
    const result = loadSave(JSON.stringify(v1));
    expect(result).toMatchObject({ ok: true, migratedFrom: 1 });
    if (result.ok) {
      expect(SaveV3Schema.safeParse(result.save).success).toBe(true);
      expect(result.save.bank).toEqual({ oak_log: 25, copper_ore: 4 });
      expect(result.save.createdAt).toBe(v1.savedAt);
    }
  });

  it('rejects invalid JSON', () => {
    expect(loadSave('{oops')).toEqual({ ok: false, error: 'Save is not valid JSON' });
  });

  it('rejects saves with no version', () => {
    expect(loadSave('{"gold":1}')).toEqual({ ok: false, error: 'Save has no version' });
    expect(loadSave('[1,2]')).toEqual({ ok: false, error: 'Save has no version' });
    expect(loadSave('"hello"')).toEqual({ ok: false, error: 'Save has no version' });
    expect(loadSave('{"version":"3"}')).toEqual({ ok: false, error: 'Save has no version' });
  });

  it('refuses saves from a newer version of the game', () => {
    expect(loadSave(JSON.stringify({ ...v3, version: 4 }))).toEqual({
      ok: false,
      error: 'Save is from a newer version of the game (v4)',
    });
  });

  it('rejects unknown versions', () => {
    expect(loadSave('{"version":0}')).toEqual({ ok: false, error: 'Unknown save version (v0)' });
    expect(loadSave('{"version":1.5}')).toEqual({ ok: false, error: 'Unknown save version (v1.5)' });
  });

  it('rejects corrupted saves at any version', () => {
    expect(loadSave(JSON.stringify({ ...v1, gold: -5 }))).toEqual({ ok: false, error: 'Save is corrupted' });
    expect(loadSave(JSON.stringify({ ...v2, bank: { log: 'lots' } }))).toEqual({ ok: false, error: 'Save is corrupted' });
    expect(loadSave(JSON.stringify({ ...v3, settings: null }))).toEqual({ ok: false, error: 'Save is corrupted' });
  });
});

describe('export / import', () => {
  it('round-trips a save, including non-ASCII text', () => {
    const save: SaveV3 = { ...v3, skills: { '🎣 fishing': { xp: 12 } } };
    const code = exportSave(save);
    expect(code).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(importSave(code)).toEqual({ ok: true, save, migratedFrom: 3 });
  });

  it('runs imported old saves through migrations', () => {
    const code = Buffer.from(JSON.stringify(v1), 'utf8').toString('base64');
    expect(importSave(code)).toMatchObject({ ok: true, migratedFrom: 1 });
  });

  it('rejects codes that are not valid base64', () => {
    expect(importSave('not base64!!')).toEqual({ ok: false, error: 'Save code is not valid' });
  });
});
