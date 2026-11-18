# 13.8 · Offline progress

> ⏱ 3 hours · Module 13 · The Idle Game Engine

## What you'll learn
- When offline progress runs, and how to measure the time away
- Caps, and why they're a design decision as well as a technical one
- **Calculating** progress analytically instead of simulating it tick by tick
- Resource-limited actions, XP across many levels, and random drops in bulk
- The "While you were away" summary
- Edge cases: clocks going backwards, absurd gaps, actions finishing mid-absence

---

## When does offline progress happen?

Whenever the game wasn't ticking normally:
1. **On load**: the player opens the game after closing it (`now − state.lastUpdatedAt`).
2. **On return to a background tab**: `visibilitychange` → visible after timers were throttled or frozen.
3. **On wake from sleep**: the loop's first frame sees a huge gap (13.4's `onDroppedTime`).
4. **(Later) on another device**: the cloud save says progress stopped at time T (Module 18).

In each case you have **a state and an elapsed duration**, and you need the state *as if* it had been ticking the whole time.

## Measuring the time away

```ts
const elapsed = now - state.lastUpdatedAt;
```

Guard it:
- `elapsed < 0` means the clock went **backwards** (the user changed timezone or time, or an NTP correction happened). Treat it as 0.
- `elapsed` is absurdly large (years) because of a tampered clock or a corrupt timestamp. The cap handles it.
- Lesson 18.4 adds **server time**, so players can't cheat by changing their device clock.

## Caps

Most idle games cap offline progress, at 12 or 24 hours for example:
- **Design**: it rewards coming back occasionally and keeps the economy balanced.
- **Technical**: it bounds the work and keeps numbers sane.
- **Honesty**: tell the player! "You were away 3 days. Offline progress is capped at 12 hours."

```ts
const applied = Math.min(Math.max(0, elapsed), OFFLINE_CAP_MS);
```

## Simulate or calculate?

**Simulating** means running the normal `tick` for every step:

```ts
for (let t = 0; t < applied; t += STEP_MS) state = tick(state, STEP_MS).state;
// 12 hours / 100ms = 432,000 ticks, each allocating new objects. Seconds of frozen page on a phone.
```

**Calculating** means working out the answer with arithmetic, in O(1):

```
totalProgress = activeAction.progressMs + applied
possible      = floor(totalProgress / duration)            // completions time allows
affordable    = min over inputs of floor(bank[input] / qty) // completions resources allow
completions   = min(possible, affordable)
```

Then apply `completions` repetitions in **one step**: items × completions, XP × completions, inputs × completions.

Notice that this is *exactly* the batch form of the tick you designed in 13.5. If your tick already computes "how many completions fit in `dt`, limited by inputs", then **offline progress is just one big tick**, plus a cap and a summary:

```ts
export function calculateOfflineProgress(state: GameState, elapsedMs: number, capMs: number): OfflineResult {
  const appliedMs = Math.min(Math.max(0, elapsedMs), capMs);
  const { state: next, events } = tick(state, appliedMs);   // the same function!
  return { state: next, summary: summarise(state, next, events, elapsedMs, appliedMs) };
}
```

That's the payoff of designing the tick to handle **any** `dt` correctly. In exercise 13-06 the tests include a 30-day absence with a 100 ms action (about 26 million completions), and they require it to finish in a few milliseconds. A per-completion loop can't do that.

### What stops early
- **Out of inputs**: smelting stops when the ore runs out. The summary should say so ("Your smithing stopped after 2h 10m: out of Copper Ore").
- **Hitting max level** doesn't stop the action in most games (you keep the items), but XP stops at the cap if you cap it.
- **A full bank** (if you add slot limits): another limiting factor, `min(possible, affordable, spaceLeft)`.

### XP across many levels
Big offline gains can jump from level 30 to 41. `levelFromXp(oldXp)` vs `levelFromXp(newXp)` gives you both ends (13.6), so report "+11 levels".

### Random drops in bulk
Use **expected values** (13.7): `completions × probability`. Floor it, and maybe roll once for the fractional part. Never roll millions of times on the main thread.

## The "While you were away" summary

Players love this screen. Return a structured summary, not a string, so the UI can format it richly:

```ts
type OfflineSummary = {
  elapsedMs: number;          // how long they were actually away
  appliedMs: number;          // how much was simulated (after the cap)
  capped: boolean;
  actionId: ActionId | null;
  completions: number;
  itemsGained: Partial<Record<ItemId, number>>;
  itemsUsed: Partial<Record<ItemId, number>>;
  xpGained: number;
  levelsGained: number;
  stoppedReason: 'outOfInputs' | null;
};
```

```
╭──────────── While you were away (6h 12m) ────────────╮
│  🪓 Woodcutting · Oak Tree                            │
│  Completed 7,440 times                                │
│  +7,440 Oak Logs   +74,400 XP   Level 38 → 47 🎉      │
╰───────────────────────── [ Nice! ] ──────────────────╯
```

(Formatting those numbers is the next lesson.)

## Edge cases checklist

- [ ] no active action → nothing happens, but `lastUpdatedAt` still moves forward
- [ ] `elapsed` is 0 or negative → no change
- [ ] `elapsed` exceeds the cap → apply the cap, and mark the summary `capped`
- [ ] partial progress before leaving is counted (`progressMs + applied`)
- [ ] the remainder carries over into `progressMs` afterwards
- [ ] inputs run out partway → stop at that point, and report it
- [ ] multiple level-ups are reported correctly
- [ ] it runs in constant time, whatever the elapsed time

## Applying it in the app (preview of Module 14)

```ts
function catchUp(now: number) {
  const { state, summary } = calculateOfflineProgress(store.getState(), now - store.getState().lastUpdatedAt, CAP);
  store.setState({ ...state, lastUpdatedAt: now });
  if (summary.appliedMs > 60_000) showWhileYouWereAway(summary);   // don't nag for short gaps
}
```

Called on load, on becoming visible again, and when the loop reports dropped time.

## Check your understanding

1. Name three situations that trigger offline progress.
2. Why calculate offline progress instead of simulating every tick?
3. Smelting needs 3 ore per bar, the player has 100 ore, the action takes 5 s, and they were away 1 hour. How many bars?
4. What should happen when `now − lastUpdatedAt` is negative?
5. How should a 0.5% rare drop be handled over 40,000 offline completions?

<details><summary>Answers</summary>

1. Any three of: loading the game, returning to a background tab, waking from sleep (a large loop gap), resuming from a cloud save on another device.
2. Simulating hundreds of thousands (or millions) of ticks freezes the page and wastes battery. The result can be computed directly in constant time with the same rules.
3. Time allows 3,600 / 5 = 720 completions, ore allows floor(100 / 3) = 33. So 33 bars, then it stops (out of inputs) with 1 ore left.
4. Treat it as 0 (the clock went backwards), so apply no progress. Never award or subtract time for it.
5. With expected value: 40,000 × 0.005 = 200 drops (floored, perhaps with one roll for any fractional part), rather than 40,000 individual rolls.
</details>

**Practice:** exercise `13-06` offline-progress → `npm run watch 13-06`

---
[← Randomness & loot tables](07-randomness-and-loot-tables.md) · [Module overview](README.md) · [Next: Numbers & formatting →](09-numbers-and-formatting.md)
