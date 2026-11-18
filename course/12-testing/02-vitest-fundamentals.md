# 12.2 · Vitest fundamentals

> ⏱ 2.5 hours · Module 12 · Testing

## What you'll learn
- Structure: `describe`, `it`/`test`, hooks
- The matchers you'll use daily, and choosing between them
- Table tests with `it.each`
- Testing errors and async code
- Mocks and spies: `vi.fn`, `vi.spyOn`, `vi.mock` (sparingly)
- Fake timers and fake dates
- Making randomness testable
- TDD: red → green → refactor
- Running, filtering, watching and coverage

---

## Structure

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { levelFromXp } from './xp';

describe('levelFromXp', () => {
  it('is level 1 with no XP', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  describe('at level boundaries', () => {
    it('reaches level 2 at exactly 83 XP', () => {
      expect(levelFromXp(83)).toBe(2);
    });
    it('is still level 1 at 82 XP', () => {
      expect(levelFromXp(82)).toBe(1);
    });
  });
});
```

- `describe` groups related tests (and can nest). `it` and `test` are identical: use `it` when the name reads as a sentence ("it reaches level 2…").
- Name tests after **behaviour**: `'reaches level 2 at exactly 83 XP'`, not `'test 3'` or `'levelFromXp works'`.
- `beforeEach`/`afterEach` run around every test in their `describe`. Use them for setup that **every** test needs (fresh stores, fake timers). Prefer a `setup()` helper function for anything more specific, because it's more explicit.
- `it.only` / `describe.only` focuses on one test while debugging. **Never commit them.** `it.skip` skips, and `it.todo('handles prestige')` notes a future test.

## Matchers

| Matcher | Use for |
|---|---|
| `toBe(x)` | primitives; the *same* object (`Object.is`) |
| `toEqual(obj)` | deep equality of objects and arrays (ignores `undefined` properties) |
| `toStrictEqual(obj)` | deep equality, also checking `undefined` properties and class types |
| `toMatchObject(partial)` | the object *contains* these properties (ignores extras) |
| `toContain(item)` / `toContainEqual(obj)` | an array or string includes it |
| `toHaveLength(n)` | arrays and strings |
| `toBeCloseTo(n, digits)` | **floating point**: `0.1 + 0.2` is not `0.3`! |
| `toBeGreaterThan(n)` etc. | comparisons |
| `toBeNull()` / `toBeUndefined()` / `toBeDefined()` | |
| `toBeTruthy()` / `toBeFalsy()` | ⚠️ vague, so prefer specific matchers |
| `toThrow()` / `toThrow(ErrorClass)` / `toThrow('message')` | errors (wrap the call in a function!) |
| `toHaveBeenCalled()` / `toHaveBeenCalledWith(…)` / `toHaveBeenCalledTimes(n)` | mocks and spies |
| `expect.any(Number)`, `expect.stringContaining('x')`, `expect.objectContaining({...})` | flexible partial matching inside `toEqual` |
| `.not.` | negate any matcher |

```ts
expect(sellAll(state)).toEqual({ ...state, bank: {}, gold: 145 });
expect(offlineSummary).toMatchObject({ itemsGained: { oak_log: 120 } });
expect(xpProgress(1540, 12)).toBeCloseTo(0.62, 2);
expect(() => formatDuration(-1)).toThrow(RangeError);      // a function, not formatDuration(-1)
```

Add a custom message to explain failures: `expect(value, 'gold after selling everything').toBe(145)`.

## Table tests: `it.each`

When the same behaviour has many cases, use a table:

```ts
it.each([
  [0, 1],
  [82, 1],
  [83, 2],
  [174, 3],
  [13_034_431, 99],
])('levelFromXp(%i) is %i', (xp, level) => {
  expect(levelFromXp(xp)).toBe(level);
});

// or with objects, for readability
it.each([
  { gold: 49, price: 50, canBuy: false },
  { gold: 50, price: 50, canBuy: true },   // the boundary!
])('gold $gold vs price $price → $canBuy', ({ gold, price, canBuy }) => { … });
```

## Errors and async

```ts
it('rejects invalid saves', async () => {
  await expect(loadSave('garbage')).rejects.toThrow('Invalid save');
});

it('resolves with the parsed save', async () => {
  await expect(loadSave(validJson)).resolves.toMatchObject({ version: 3 });
});
```

Always `await` (or `return`) promises in tests. An un-awaited assertion can pass *after* the test has already finished, or never run at all.

## Mocks and spies

### `vi.fn()`: a fake function that records its calls
```ts
const onLevelUp = vi.fn();
addXp(state, 'woodcutting', 100, { onLevelUp });
expect(onLevelUp).toHaveBeenCalledWith('woodcutting', 2);

const fakeFetch = vi.fn().mockResolvedValue(new Response('[]'));   // control what it returns
const flaky = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue('ok');
```

### `vi.spyOn(object, 'method')`: watch (or replace) a real method
```ts
const setItem = vi.spyOn(Storage.prototype, 'setItem');
saveLocally(state);
expect(setItem).toHaveBeenCalledWith('save', expect.any(String));

vi.spyOn(console, 'error').mockImplementation(() => {});   // silence expected noise
```

This repo's Vitest config has `restoreMocks: true`, so spies are restored after each test automatically.

### `vi.mock('module')`: replace a whole module (sparingly!)
```ts
vi.mock('./analytics', () => ({ track: vi.fn() }));
```

It's powerful, but module mocks are hoisted, implicit, and couple tests to file structure. Prefer **dependency injection**: pass the dependency in as a parameter (like the `fetchFn` parameters in exercises 03-02 and 10-02). Then a test just passes a fake. Code designed this way is easier to test *and* easier to read.

## Time: fake timers and dates

Never wait for real time in tests. It's slow and flaky.

```ts
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('autosaves 2 seconds after the last change', () => {
  const save = vi.fn();
  const scheduleSave = debounce(save, 2000);
  scheduleSave();
  vi.advanceTimersByTime(1999);
  expect(save).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(save).toHaveBeenCalledTimes(1);
});

it('computes offline time from the clock', () => {
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));    // Date.now() is now fixed
  …
});
```

- `vi.advanceTimersByTime(ms)` runs timers synchronously. `await vi.advanceTimersByTimeAsync(ms)` also flushes promises in between (you used it in 01-04).
- `vi.runAllTimers()` runs everything (careful with intervals!), and `vi.getTimerCount()` finds leaked timers (07-03).
- With React, wrap the advance in `act(() => …)` so state updates are flushed (07-05).

Even better for engine code: **pass time in**. A tick function `tick(state, dtMs)` or `computeOffline(state, now)` takes time as a parameter, so it needs no fakes at all. Your engine in Module 13 is designed this way.

## Randomness

`Math.random()` makes tests non-deterministic. Inject the random source:

```ts
type Rng = () => number;            // returns [0, 1)

function rollLoot(table: LootTable, rng: Rng = Math.random) { … }

it('drops the rare gem when the roll is low enough', () => {
  expect(rollLoot(table, () => 0.001)).toBe('gem');
  expect(rollLoot(table, () => 0.999)).toBe('oak_log');
});
```

Lesson 13.7 builds a **seeded** RNG, which gives the same sequence for the same seed, so whole simulations are reproducible.

## Snapshot tests (use sparingly)

```ts
expect(formatOfflineReport(summary)).toMatchInlineSnapshot(`"You were away 3h 20m and gained 400 Oak Logs"`);
```

Snapshots record output and fail if it changes. They're handy for small, stable outputs (inline snapshots are best). Large component snapshots get rubber-stamped ("just update the snapshot") and stop catching anything.

## TDD: red → green → refactor

Test-driven development means writing the test **first**:

1. **Red**: write a failing test for the next small piece of behaviour.
2. **Green**: write the *simplest* code that passes.
3. **Refactor**: clean up with the tests as your safety net.
4. Repeat.

```ts
// RED: it doesn't exist yet
it('gives level 1 for 0 XP', () => expect(levelFromXp(0)).toBe(1));
// GREEN: the simplest thing:   const levelFromXp = (_xp: number) => 1;
// RED: the next case forces real logic
it('gives level 2 at 83 XP', () => expect(levelFromXp(83)).toBe(2));
// GREEN → REFACTOR → …
```

TDD shines for **well-specified logic**: engine maths, parsers, reducers, migrations. It's less useful for exploratory UI work. You've effectively been doing TDD all course, because the tests came first! Try it for real when building the capstone engine.

## Running tests

```bash
npx vitest                      # watch mode: re-runs affected tests on save
npx vitest run                  # once (CI)
npx vitest run xp               # only files matching "xp"
npx vitest -t "level boundary"  # only tests whose name matches
npx vitest --coverage           # coverage report (needs @vitest/coverage-v8)
npx vitest --ui                 # a browser UI (needs @vitest/ui)
```

The **Vitest VS Code extension** (recommended in this repo) runs and debugs tests from the gutter.

## Check your understanding

1. Why does `expect(formatDuration(-1)).toThrow()` not work?
2. `toEqual` or `toBe` for comparing two save objects with the same contents?
3. How do you test a debounced autosave without waiting two real seconds?
4. Your loot function calls `Math.random()` internally. How do you make it testable?
5. What are the three steps of TDD?

<details><summary>Answers</summary>

1. `formatDuration(-1)` runs **before** `expect` and throws, so the test errors out before the matcher can catch it. Wrap it: `expect(() => formatDuration(-1)).toThrow()`.
2. `toEqual`. They're different objects (so `toBe` fails) with the same structure.
3. Fake timers: `vi.useFakeTimers()`, trigger the change, `vi.advanceTimersByTime(2000)`, then assert.
4. Inject the random number source as a parameter (defaulting to `Math.random`) and pass a fixed or seeded function in tests.
5. Red (write a failing test), green (make it pass simply), refactor (improve the code while the tests stay green).
</details>

## Further reading
- Vitest docs: https://vitest.dev ("Getting Started", "API: expect", "Mocking", "Timers")

**Practice:** exercise `12-01` write-unit-tests → `npm run watch 12-01`

---
[← Why & what to test](01-why-and-what-to-test.md) · [Module overview](README.md) · [Next: Testing React components →](03-testing-react-components.md)
