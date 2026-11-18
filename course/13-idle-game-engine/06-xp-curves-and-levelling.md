# 13.6 · XP curves & levelling

> ⏱ 2 hours · Module 13 · The Idle Game Engine

## What you'll learn
- The shapes of XP curves (linear, polynomial, exponential) and what each feels like
- The classic exponential curve many idle RPGs use
- Precomputing a table, and finding a level with binary search
- Progress to the next level
- Balancing with time-to-level calculations

---

## Why the curve matters

The XP curve is the most important pacing tool in an idle RPG. It decides whether early levels feel snappy, and whether level 99 feels like an achievement or an impossibility.

Two functions define a curve:
- `xpForLevel(L)`: the **total** XP needed to reach level L (with `xpForLevel(1) = 0`).
- `levelFromXp(xp)`: the inverse, giving the highest L such that `xpForLevel(L) ≤ xp`.

## Shapes

| Curve | `xpForLevel(L)` | Feel |
|---|---|---|
| Linear | `100 × (L − 1)` | every level takes the same time. Boring, and late levels mean nothing |
| Polynomial | `50 × (L − 1)²` | gently increasing. Common in casual games |
| Exponential | grows by a constant % per level | early levels fly by, late levels are a serious commitment. **The classic idle RPG feel** |

## The classic exponential curve

A formula popularised by older MMORPGs and used by many idle RPGs: each level's XP increment grows by about 10% (2^(1/7) ≈ 1.104) per level:

```
xpForLevel(L) = floor( (1/4) × Σ_{i=1}^{L−1} floor( i + 300 × 2^(i/7) ) )
```

Some values:

| Level | Total XP |
|---|---|
| 1 | 0 |
| 2 | 83 |
| 3 | 174 |
| 10 | 1,154 |
| 50 | 101,333 |
| 92 | 6,517,253 |
| 99 | 13,034,431 |

A fun property: level 92 is about **half** the XP of level 99. The last seven levels cost as much as the first 92. That's the "exponential feel".

Using this particular formula is a mechanical choice (it's maths, not anyone's content), and you can tweak the constants to make your own curve: `300 → 250` for faster levelling, `/7 → /8` for a gentler late game.

## Implementing it efficiently

`xpForLevel` with a loop is O(L), which is fine on its own, but `levelFromXp` gets called on **every render** of every skill card and **every tick**. Precompute a table once:

```ts
export const MAX_LEVEL = 99;

// XP_TABLE[L] = total XP for level L  (index 0 unused, XP_TABLE[1] = 0)
export const XP_TABLE: readonly number[] = (() => {
  const table = [0, 0];
  let points = 0;
  for (let level = 1; level < MAX_LEVEL; level++) {
    points += Math.floor(level + 300 * 2 ** (level / 7));
    table.push(Math.floor(points / 4));
  }
  return table;
})();

export function xpForLevel(level: number): number {
  const clamped = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  return XP_TABLE[clamped]!;
}
```

### `levelFromXp` with binary search
The table is sorted, so binary search finds the level in about 7 comparisons instead of 99:

```ts
export function levelFromXp(xp: number): number {
  let lo = 1;
  let hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (XP_TABLE[mid]! <= xp) lo = mid;   // mid is reachable, so the answer is ≥ mid
    else hi = mid - 1;                    // mid is not reachable
  }
  return lo;
}
```

Binary search is a classic interview topic, and this is a nice real-world example of it. (A linear scan of 99 entries is also perfectly fast, so measure before optimising. The point here is to practise the technique.)

## Progress to the next level

Every skill card shows a bar:

```ts
export type LevelProgress = {
  level: number;
  xpIntoLevel: number;   // XP earned since reaching this level
  xpForNext: number;     // XP needed for this level → the next (the size of the bar)
  fraction: number;      // 0..1, and 1 at max level
};

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return { level, xpIntoLevel: 0, xpForNext: 0, fraction: 1 };
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, xpIntoLevel: xp - start, xpForNext: next - start, fraction: (xp - start) / (next - start) };
}
```

## Detecting level-ups in the tick

```ts
const before = levelFromXp(oldXp);
const after = levelFromXp(newXp);
if (after > before) events.push({ type: 'levelUp', skill, level: after });
```

A big XP gain can jump several levels at once (offline progress!). Emit one event with the final level, or one per level, and decide which suits your UI. Exercise 13-04 expects one event with the final level.

## Balancing: time to level

Combine the curve with action data to answer "how long does level 50 take?":

```
time to level L (using one action) = (xpForLevel(L) − currentXp) / action.xp × action.durationMs
```

Oak Tree (10 XP per 3 s) to level 50 (101,333 XP) is about 10,133 actions × 3 s ≈ 8.4 hours. That's why higher-level actions give more XP per second, and a balance spreadsheet makes sure each new unlock is *worth* switching to. Keep XP and durations in the data (13.2), and tuning is just editing numbers.

> **XP and floating point:** keep XP as **integers**. Bonuses like "+10% XP" produce fractions, so either round when awarding (`Math.round`), or accept fractional XP internally and floor only for display. Pick one, and test it (13.9).

## Check your understanding

1. Why precompute the XP table?
2. Using the table above, what level is a player with 100 XP? With 13,034,431 XP? With 999,999,999 XP?
3. Why does binary search use `Math.ceil` for `mid` in this formulation?
4. What should `levelProgress` return at the maximum level?

<details><summary>Answers</summary>

1. `levelFromXp` and `xpForLevel` are called constantly (every tick, every render). A table makes them O(1) or O(log n) with no repeated `2 **` maths.
2. Level 2 (83 ≤ 100 < 174). Level 99. Level 99 (capped).
3. With `lo = mid` on success, rounding down could make `mid === lo` forever (an infinite loop when `hi = lo + 1`). Rounding up guarantees progress.
4. A full bar (`fraction: 1`) with nothing left to earn (`xpForNext: 0`). The UI shows "MAX" (as you did in exercise 06-01).
</details>

**Practice:** exercise `13-02` xp-curve → `npm run watch 13-02`

---
[← Actions & ticks](05-actions-and-ticks.md) · [Module overview](README.md) · [Next: Randomness & loot tables →](07-randomness-and-loot-tables.md)
