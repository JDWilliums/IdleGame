# 13.5 · Actions & ticks

> ⏱ 3 hours · Module 13 · The Idle Game Engine

## What you'll learn
- The algorithm at the heart of the engine: advancing an action by `dt`
- Progress carry-over, and multiple completions in one tick
- Inputs (consuming items), stopping when you run out, and level requirements
- Returning **events** for the UI instead of side effects
- Starting and stopping actions
- Testing the tick exhaustively

---

## The tick's contract

```ts
type TickResult = { state: GameState; events: GameEvent[] };

function tick(state: GameState, dtMs: number /*, rng */): TickResult;
```

It's pure: no `Date.now()`, no `Math.random()` (the RNG arrives in 13.7), no storage and no UI. It takes the state and the elapsed time, and returns the new state plus a list of things that happened.

## Advancing the active action

The core algorithm, step by step:

```
progress = activeAction.progressMs + dtMs
completions = floor(progress / duration)
remainder   = progress − completions × duration
```

Example: a 3,000 ms action with 2,500 ms banked, and a 1,000 ms tick:
- progress = 3,500 → **1 completion**, remainder **500 ms** carried into the next repetition.

With a 7,000 ms tick (catching up after a throttled background tab) and 1,000 ms banked:
- progress = 8,000 → **2 completions**, remainder **2,000 ms**.

> ⚠️ **Never reset progress to 0 on completion.** Discarding the remainder makes the action run slower than its stated duration, and players do notice.

For each completion:
1. **Check inputs**: if the action has inputs and the bank doesn't have enough for one more repetition, **stop** the action (set `activeAction` to `null`, with progress reset) and emit `actionStopped` with a reason.
2. **Consume the inputs.**
3. **Add the outputs** to the bank.
4. **Add XP** to the skill, and if the level increased, emit `levelUp`.
5. Update the stats.

### Doing it efficiently
Looping once per completion is fine for normal ticks (one or two completions). For big gaps it's wasteful, so compute how many completions are **affordable** up front:

```ts
function maxAffordable(bank: Bank, inputs: readonly ItemStack[] | undefined): number {
  if (!inputs || inputs.length === 0) return Infinity;
  return Math.min(...inputs.map((i) => Math.floor((bank[i.item] ?? 0) / i.qty)));
}

const possible = Math.floor(progress / duration);
const completions = Math.min(possible, maxAffordable(state.bank, action.inputs));
```

Then apply all the completions in one go (multiply quantities and XP by `completions`). If `completions < possible`, inputs ran out, so stop the action. This "batch" form is exactly what offline progress (13.8) needs too, so the same function serves both.

## Level requirements

Starting an action requires `levelFromXp(skillXp) >= action.level`. Check it in `startAction`, not in every tick: once you're doing an action, you're allowed to keep doing it.

```ts
function startAction(state: GameState, id: ActionId): GameState {
  const action = ACTIONS[id];
  const level = levelFromXp(state.skills[action.skill].xp);
  if (level < action.level) return state;                         // locked: no change
  if (state.activeAction?.id === id) return state;                // already doing it
  return { ...state, activeAction: { id, progressMs: 0 } };       // switching resets progress
}

function stopAction(state: GameState): GameState {
  return state.activeAction === null ? state : { ...state, activeAction: null };
}
```

## Events: the engine talks, the UI listens

The engine must not show toasts or play sounds. That would make it impure and tie it to the UI. Instead it **returns a description of what happened**:

```ts
export type GameEvent =
  | { type: 'actionCompleted'; actionId: ActionId; count: number }
  | { type: 'itemsGained'; itemId: ItemId; qty: number }
  | { type: 'itemsUsed'; itemId: ItemId; qty: number }
  | { type: 'xpGained'; skill: SkillId; xp: number }
  | { type: 'levelUp'; skill: SkillId; level: number }
  | { type: 'actionStopped'; actionId: ActionId; reason: 'outOfInputs' | 'manual' };
```

The shell decides what to do with them: a toast for `levelUp`, a floating "+1" for `itemsGained`, an `aria-live` announcement, a sound. Tests assert on them directly:

```ts
const { events } = tick(state, 3000);
expect(events).toContainEqual({ type: 'levelUp', skill: 'woodcutting', level: 2 });
```

It's a discriminated union (02.4) again, and the exhaustive `switch` in the UI's event handler guarantees every new event type gets handled.

## Putting it together

```ts
export function tick(state: GameState, dtMs: number): TickResult {
  const active = state.activeAction;
  if (active === null || dtMs <= 0) return { state, events: [] };

  const action: ActionDefinition = ACTIONS[active.id];
  const progress = active.progressMs + dtMs;
  const possible = Math.floor(progress / action.durationMs);
  if (possible === 0) {
    return { state: { ...state, activeAction: { ...active, progressMs: progress } }, events: [] };
  }

  const completions = Math.min(possible, maxAffordable(state.bank, action.inputs));
  const ranOut = completions < possible;
  // …apply inputs, outputs, XP and stats for `completions` repetitions…
  // …build the events…
  // …activeAction: ranOut ? null : { id, progressMs: progress − possible × duration }…
}
```

You'll implement the whole thing in exercise 13-04, with tests for every edge case:
- no active action, or zero or negative `dt` → unchanged state (the **same reference**)
- progress that doesn't complete → only `progressMs` changes
- exactly one completion, and the remainder carries over
- several completions in one tick
- inputs run out partway → partial completions, then stop
- not enough inputs for even one → stop immediately
- XP crosses one level, and several levels at once
- the inputs and state are never mutated

## Performance notes

A tick runs about 10 times a second, so it must be cheap:
- No looping over all items or skills unless needed. Touch only what changed.
- Return the **same state object** when nothing changes, so React and selectors skip work (14.3).
- Structural sharing: copy only the skill and bank entries that changed (01.1), or use Immer and measure.

## Check your understanding

1. A 2,000 ms action has 1,500 ms banked and the tick is 2,600 ms. How many completions, and what's the remainder?
2. Why shouldn't the tick function show a toast when the player levels up?
3. Smelting needs 2 copper per bar, the bank has 5 copper, and the tick covers 4 completions. What happens?
4. Why check level requirements in `startAction` rather than in `tick`?
5. Why return the same state object when nothing changed?

<details><summary>Answers</summary>

1. progress = 4,100 → 2 completions, remainder 100 ms.
2. That would make the engine impure and coupled to the UI, so it would be hard to test and impossible to run in a worker or on a server. It returns a `levelUp` event and the UI decides how to present it.
3. You can afford floor(5/2) = 2 completions. Do 2 (consume 4 copper, 1 left), then stop the action with an `actionStopped` event (reason `outOfInputs`).
4. The requirement gates *starting*. Once you're doing an action, continuing is allowed, and checking each tick would be wasted work (levels only go up anyway).
5. Referential equality tells React and store selectors that nothing changed, so they skip re-rendering. It's also cheaper.
</details>

**Practice:** exercise `13-04` action-ticks (do `13-02` xp-curve first) → `npm run watch 13-04`

---
[← The game loop](04-the-game-loop.md) · [Module overview](README.md) · [Next: XP curves & levelling →](06-xp-curves-and-levelling.md)
