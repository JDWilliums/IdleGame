import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import { assertIsString, isRecord, parseSave } from './exercise';

const validSave = {
  version: 1,
  playerName: '  Ava  ',
  gold: 120,
  skills: { woodcutting: { xp: 450 }, fishing: { xp: 0 } },
  bank: { oak_log: 30 },
  lastSavedAt: 1_700_000_000_000,
};

const text = (value: unknown) => JSON.stringify(value);

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

describe('parseSave: valid saves', () => {
  it('returns the parsed save with the name trimmed', () => {
    const result = parseSave(text(validSave));
    expect(result).toEqual({ ok: true, save: { ...validSave, playerName: 'Ava' } });
  });

  it('defaults a missing bank to {}', () => {
    const { bank: _bank, ...noBank } = validSave;
    const result = parseSave(text(noBank));
    expect(result.ok && result.save.bank).toEqual({});
  });
});

describe('parseSave: invalid input', () => {
  it('rejects invalid JSON without throwing', () => {
    expect(parseSave('{ not json')).toEqual({ ok: false, error: 'Invalid JSON' });
    expect(parseSave('')).toEqual({ ok: false, error: 'Invalid JSON' });
  });

  const cases: Array<[string, unknown, string]> = [
    ['wrong version', { ...validSave, version: 2 }, 'version: '],
    ['blank name', { ...validSave, playerName: '    ' }, 'playerName: '],
    ['long name', { ...validSave, playerName: 'x'.repeat(21) }, 'playerName: '],
    ['negative gold', { ...validSave, gold: -5 }, 'gold: '],
    ['fractional gold', { ...validSave, gold: 1.5 }, 'gold: '],
    ['bad xp', { ...validSave, skills: { fishing: { xp: 'lots' } } }, 'skills.fishing.xp: '],
    ['zero-quantity bank stack', { ...validSave, bank: { oak_log: 0 } }, 'bank.oak_log: '],
    ['missing timestamp', { ...validSave, lastSavedAt: undefined }, 'lastSavedAt: '],
  ];

  it.each(cases)('rejects %s, reporting the path', (_label, input, expectedPrefix) => {
    const result = parseSave(text(input));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.startsWith(expectedPrefix)).toBe(true);
      expect(result.error.length).toBeGreaterThan(expectedPrefix.length); // includes Zod's message
    }
  });

  it('uses (root) when the whole value is wrong', () => {
    const result = parseSave(text([1, 2, 3]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.startsWith('(root): ')).toBe(true);
  });
});

describe('isRecord', () => {
  it('accepts plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });
  it('rejects everything else', () => {
    for (const v of [null, undefined, [], [1], 'x', 1, true]) expect(isRecord(v)).toBe(false);
  });
});

describe('assertIsString', () => {
  it('does nothing for strings', () => {
    expect(() => assertIsString('hi', 'name')).not.toThrow();
  });
  it('throws a TypeError naming the value', () => {
    expect(() => assertIsString(5, 'playerName')).toThrow(TypeError);
    expect(() => assertIsString(null, 'playerName')).toThrow('playerName must be a string');
  });
});
