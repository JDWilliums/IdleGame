import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import {
  ACTIONS,
  actionsForSkill,
  getAction,
  ITEMS,
  SKILLS,
  unlockedActions,
  validateGameData,
  type RawAction,
} from './exercise';

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

describe('lookups', () => {
  it('getAction returns a definition', () => {
    expect(getAction('smelt_bronze')).toMatchObject({ skill: 'smithing', durationMs: 2500 });
  });

  it('actionsForSkill sorts by level, then name', () => {
    expect(actionsForSkill('woodcutting')).toEqual(['chop_oak', 'chop_willow']);
    expect(actionsForSkill('mining')).toEqual(['mine_copper', 'mine_tin']); // same level → Copper before Tin
    expect(actionsForSkill('smithing')).toEqual(['smelt_bronze']);
  });

  it('unlockedActions filters by level', () => {
    expect(unlockedActions('woodcutting', 1)).toEqual(['chop_oak']);
    expect(unlockedActions('woodcutting', 9)).toEqual(['chop_oak']);
    expect(unlockedActions('woodcutting', 10)).toEqual(['chop_oak', 'chop_willow']);
  });
});

describe('validateGameData', () => {
  const action = (overrides: Partial<RawAction> = {}): RawAction => ({
    skill: 'mining',
    name: 'Rock',
    level: 1,
    durationMs: 1000,
    xp: 5,
    outputs: [{ item: 'tin_ore', qty: 1 }],
    ...overrides,
  });
  const items = { tin_ore: {}, copper_ore: {} };
  const skills = { mining: {} };

  it('accepts the real game data', () => {
    expect(validateGameData(ACTIONS, ITEMS, SKILLS)).toEqual([]);
  });

  it('accepts valid custom data', () => {
    expect(validateGameData({ a: action() }, items, skills)).toEqual([]);
  });

  it('reports an unknown skill', () => {
    expect(validateGameData({ a: action({ skill: 'fishing' }), b: action() }, items, skills)).toEqual([
      'a: unknown skill "fishing"',
    ]);
  });

  it('reports a bad level', () => {
    expect(validateGameData({ a: action({ level: 0 }) }, items, skills)).toEqual(['a: level must be between 1 and 99']);
    expect(validateGameData({ a: action({ level: 100 }) }, items, skills)).toEqual(['a: level must be between 1 and 99']);
    expect(validateGameData({ a: action({ level: 2.5 }) }, items, skills)).toEqual(['a: level must be between 1 and 99']);
  });

  it('reports a non-positive duration', () => {
    expect(validateGameData({ a: action({ durationMs: 0 }) }, items, skills)).toEqual(['a: durationMs must be positive']);
  });

  it('reports missing outputs', () => {
    expect(validateGameData({ a: action({ outputs: [] }) }, items, skills)).toEqual(['a: must have at least one output']);
  });

  it('reports unknown items in inputs and outputs', () => {
    const broken = action({ inputs: [{ item: 'gold_ore', qty: 1 }], outputs: [{ item: 'gold_bar', qty: 1 }] });
    expect(validateGameData({ a: broken }, items, skills)).toEqual([
      'a: unknown item "gold_ore"',
      'a: unknown item "gold_bar"',
    ]);
  });

  it('reports bad quantities once per action', () => {
    const broken = action({ inputs: [{ item: 'tin_ore', qty: 0 }], outputs: [{ item: 'copper_ore', qty: 1.5 }] });
    expect(validateGameData({ a: broken }, items, skills)).toEqual(['a: quantities must be positive whole numbers']);
  });

  it('reports skills with no actions, after action problems', () => {
    expect(
      validateGameData({ a: action({ durationMs: -1 }) }, items, { mining: {}, smithing: {}, cooking: {} }),
    ).toEqual(['a: durationMs must be positive', 'smithing: has no actions', 'cooking: has no actions']);
  });

  it('reports several problems in the documented order', () => {
    const broken = action({ skill: 'x', level: 0, durationMs: 0, outputs: [] });
    expect(validateGameData({ a: broken }, items, skills)).toEqual([
      'a: unknown skill "x"',
      'a: level must be between 1 and 99',
      'a: durationMs must be positive',
      'a: must have at least one output',
      'mining: has no actions',
    ]);
  });
});
