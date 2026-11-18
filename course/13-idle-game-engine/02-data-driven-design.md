# 13.2 · Data-driven design

> ⏱ 2 hours · Module 13 · The Idle Game Engine

## What you'll learn
- Why game content should be **data**, not code
- Typed content definitions with `as const satisfies`, with derived id unions
- Lookups, relationships and referential integrity
- Validating content in tests, so typos fail CI instead of crashing players
- Changing content safely once players have saves

---

## Content is data

A bad way to add an action:

```ts
// ❌ logic per action: every new tree means editing engine code
if (actionId === 'chop_oak') { addItem('oak_log', 1); addXp('woodcutting', 10); duration = 3000; }
else if (actionId === 'chop_willow') { … }
```

The good way is to describe every action as **data**, and have **one** generic engine handle them all:

```ts
export const ACTIONS = {
  chop_oak:    { skill: 'woodcutting', name: 'Oak Tree',    level: 1,  durationMs: 3000, xp: 10, outputs: [{ item: 'oak_log', qty: 1 }] },
  chop_willow: { skill: 'woodcutting', name: 'Willow Tree', level: 10, durationMs: 4000, xp: 22, outputs: [{ item: 'willow_log', qty: 1 }] },
  smelt_bronze: {
    skill: 'smithing', name: 'Bronze Bar', level: 1, durationMs: 2500, xp: 8,
    inputs:  [{ item: 'copper_ore', qty: 1 }, { item: 'tin_ore', qty: 1 }],
    outputs: [{ item: 'bronze_bar', qty: 1 }],
  },
} as const satisfies Record<string, ActionDefinition>;
```

Adding a new tree, ore or recipe becomes a **data change**: no new engine code, no new bugs in the logic. Designers (or a future you) can add content quickly, and content can even come from JSON files or a CMS later.

This is how basically all content-heavy games work, and the same pattern appears in business software (product catalogues, configurable workflows, feature flags).

## Typing the definitions

```ts
export type SkillDefinition = { name: string; icon: string };

export type ItemDefinition = {
  name: string;
  category: 'log' | 'ore' | 'bar' | 'fish' | 'food' | 'tool';
  sellPrice: number;
};

export type ItemStack<I extends string = string> = { item: I; qty: number };

export type ActionDefinition = {
  skill: string;
  name: string;
  level: number;
  durationMs: number;
  xp: number;
  inputs?: readonly ItemStack[];
  outputs: readonly ItemStack[];
};
```

The data:

```ts
export const SKILLS = {
  woodcutting: { name: 'Woodcutting', icon: '🪓' },
  mining:      { name: 'Mining',      icon: '⛏️' },
  smithing:    { name: 'Smithing',    icon: '🔨' },
} as const satisfies Record<string, SkillDefinition>;

export const ITEMS = {
  oak_log:    { name: 'Oak Log',    category: 'log', sellPrice: 1 },
  willow_log: { name: 'Willow Log', category: 'log', sellPrice: 4 },
  copper_ore: { name: 'Copper Ore', category: 'ore', sellPrice: 2 },
  tin_ore:    { name: 'Tin Ore',    category: 'ore', sellPrice: 2 },
  bronze_bar: { name: 'Bronze Bar', category: 'bar', sellPrice: 9 },
} as const satisfies Record<string, ItemDefinition>;

export type SkillId = keyof typeof SKILLS;
export type ItemId = keyof typeof ITEMS;
export type ActionId = keyof typeof ACTIONS;
```

Exactly the pattern from exercise 02-01, now at the scale of a game.

### Making references type-safe

Can we make TypeScript reject `outputs: [{ item: 'oak_logg', qty: 1 }]`? Yes, by defining `ActionDefinition` in terms of the id unions:

```ts
type ActionDefinition = {
  skill: SkillId;
  inputs?: readonly ItemStack<ItemId>[];
  outputs: readonly ItemStack<ItemId>[];
  …
};
```

Now a typo in an item id is a **compile error**. Since `ITEMS` and `SKILLS` are defined first, `ACTIONS` can reference their key types. (TypeScript can't check everything: "the level must be 1..99" or "every skill has at least one action" need runtime checks. See below.)

## Lookups and derived data

`ACTIONS[id]` is already O(1). For "all actions of a skill", compute once at module load:

```ts
export const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];   // a safe cast: exactly the keys

export const ACTIONS_BY_SKILL = Object.groupBy(ACTION_IDS, (id) => ACTIONS[id].skill);
// { woodcutting: ['chop_oak', 'chop_willow'], smithing: ['smelt_bronze'] }

export function actionsForSkill(skill: SkillId): ActionId[] {
  return (ACTIONS_BY_SKILL[skill] ?? []).toSorted((a, b) => ACTIONS[a].level - ACTIONS[b].level);
}
```

Static data never changes at runtime, so derived lookups can be computed once and shared freely. They're not state.

## Referential integrity: test your content

Types catch many mistakes, but not all. Write a **content validation** function and run it in a test, so mistakes fail CI instead of reaching players:

```ts
export function validateGameData(): string[] {
  const problems: string[] = [];
  for (const id of ACTION_IDS) {
    const a: ActionDefinition = ACTIONS[id];
    if (a.durationMs <= 0) problems.push(`${id}: durationMs must be positive`);
    if (a.level < 1 || a.level > 99) problems.push(`${id}: level out of range`);
    if (a.outputs.length === 0) problems.push(`${id}: has no outputs`);
    for (const stack of [...(a.inputs ?? []), ...a.outputs]) {
      if (!(stack.item in ITEMS)) problems.push(`${id}: unknown item ${stack.item}`);
      if (stack.qty <= 0) problems.push(`${id}: quantity must be positive`);
    }
  }
  for (const skill of Object.keys(SKILLS)) {
    if (!ACTION_IDS.some((id) => ACTIONS[id].skill === skill)) problems.push(`${skill}: has no actions`);
  }
  return problems;
}

// game-data.test.ts
it('has no content problems', () => expect(validateGameData()).toEqual([]));
```

You'll write this in exercise 13-01.

## Static data vs dynamic state

| Static data (definitions) | Dynamic state (13.3) |
|---|---|
| the same for every player | different for every player |
| ships with the code | saved and loaded |
| "Oak Tree takes 3 s and gives 10 XP" | "Ava has 1,540 Woodcutting XP and 312 Oak Logs" |
| never mutated | changes every tick |

**State references data by id**: `{ activeAction: { id: 'chop_oak', progressMs: 1200 } }`. Never copy definitions into state. If you rebalance Oak Tree to 2.5 s, every player picks it up automatically.

## Changing content after launch

Once real players have saves, your content ids are a **public contract**:
- **Adding** items and actions is safe.
- **Changing numbers** (durations, XP) is safe, because saves store XP and quantities, not derived values.
- **Renaming or removing an id** breaks saves (`bank: { log: 500 }` now refers to nothing). That needs a **migration** (13.10).
- Never reuse an old id for something different.

> Pick good ids from the start: lowercase `snake_case`, descriptive and stable (`oak_log`, not `item1` or `log`).

## Check your understanding

1. What's the benefit of defining actions as data instead of code?
2. How can TypeScript catch a typo in an action's output item id?
3. Why validate content in a test when TypeScript already checks types?
4. Your designer wants to rename `log` to `oak_log` after launch. What do you need?

<details><summary>Answers</summary>

1. One generic engine handles every action, so adding content is a data change with no new logic or bugs. It's also easier to read, balance, test and potentially load from external sources.
2. By typing `outputs` as `ItemStack<ItemId>[]`, where `ItemId = keyof typeof ITEMS`, so an unknown id is a compile error.
3. Types can't express every rule (positive durations, level ranges, every skill having an action, no duplicate names). A validation test catches those before players do.
4. A save migration that renames the key in every existing player's bank (and anywhere else it's referenced), plus a version bump.
</details>

## Further reading
- Game Programming Patterns (free online book by Robert Nystrom): the "Type Object" and "Data Locality" chapters
- TypeScript Handbook: [Indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) (revisit)

**Practice:** exercise `13-01` game-data → `npm run watch 13-01`

---
[← Anatomy of an idle game](01-anatomy-of-an-idle-game.md) · [Module overview](README.md) · [Next: Designing game state →](03-designing-game-state.md)
