// Type tests for 13-01. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { ACTIONS, getAction, type ActionDefinition, type ActionId, type ItemStack } from './exercise';

type _t1 = Expect<Equal<ActionId, 'chop_oak' | 'chop_willow' | 'mine_tin' | 'mine_copper' | 'smelt_bronze'>>;
type _t2 = Expect<Equal<(typeof ACTIONS)['chop_oak']['durationMs'], 3000>>; // literals kept
type _t3 = Expect<(typeof ACTIONS)[ActionId] extends ActionDefinition ? true : false>; // checked
type _t4 = Expect<Equal<ReturnType<typeof getAction>, ActionDefinition>>;
type _t5 = Expect<Equal<ItemStack['item'], 'oak_log' | 'willow_log' | 'copper_ore' | 'tin_ore' | 'bronze_bar'>>;

export const fine: ActionDefinition = {
  skill: 'mining',
  name: 'x',
  level: 1,
  durationMs: 1,
  xp: 1,
  outputs: [{ item: 'tin_ore', qty: 1 }],
};
export const withInputs: ActionDefinition = {
  skill: 'smithing',
  name: 'x',
  level: 1,
  durationMs: 1,
  xp: 1,
  inputs: [{ item: 'tin_ore', qty: 1 }],
  outputs: [{ item: 'bronze_bar', qty: 1 }],
};
export const badItem: ActionDefinition = {
  skill: 'mining',
  name: 'x',
  level: 1,
  durationMs: 1,
  xp: 1,
  // @ts-expect-error: 'gold_ore' is not an ItemId
  outputs: [{ item: 'gold_ore', qty: 1 }],
};
export const badSkill: ActionDefinition = {
  // @ts-expect-error: 'fishing' is not a SkillId
  skill: 'fishing',
  name: 'x',
  level: 1,
  durationMs: 1,
  xp: 1,
  outputs: [{ item: 'tin_ore', qty: 1 }],
};
// @ts-expect-error: outputs are required
export const noOutputs: ActionDefinition = { skill: 'mining', name: 'x', level: 1, durationMs: 1, xp: 1 };

// @ts-expect-error: unknown action id
getAction('chop_maple');
