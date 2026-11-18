# 13.9 · Numbers & formatting

> ⏱ 1.5 hours · Module 13 · The Idle Game Engine

## What you'll learn
- How JavaScript numbers work (64-bit floats) and the traps that follow
- Keeping currencies and XP as integers
- `MAX_SAFE_INTEGER`, and what to do if your numbers get astronomically large
- Formatting numbers for players: compact (`1.23K`), grouped (`1,234`), rates and percentages
- Rounding: display vs storage

---

## Numbers are floats

Every JavaScript `number` is an IEEE-754 **64-bit floating-point** value. That means:

```js
0.1 + 0.2;               // 0.30000000000000004
0.1 + 0.2 === 0.3;       // false
1.1 * 3;                 // 3.3000000000000003
```

Decimal fractions like 0.1 can't be represented exactly in binary, just as 1/3 can't be written exactly in decimal.

Consequences for your game:
- **Never compare floats with `===`**: use a tolerance (`Math.abs(a - b) < 1e-9`), or better, avoid floats.
- **Keep currencies, quantities and XP as integers.** Gold is `120`, not `1.20`. If you need fractional rates ("0.5 gold per second"), accumulate in a float but award whole units, or store "milligold".
- **Repeated float addition drifts**: adding 0.1 a million times gives 100000.00000133288. Over a long idle session, that's how bugs creep in. Integer maths doesn't drift (within the safe range).

```ts
// ❌ drift
progress += dt * speedMultiplier;          // 1.1 × 100 every tick, forever

// ✅ integer-friendly: compute from totals, or round at the boundary
const completions = Math.floor((progressMs + dtMs) / durationMs);
```

## The safe integer limit

Floats represent integers exactly only up to `Number.MAX_SAFE_INTEGER = 2^53 − 1 = 9,007,199,254,740,991` (about 9 quadrillion):

```js
2 ** 53 === 2 ** 53 + 1;        // true 😱
Number.isSafeInteger(9007199254740992);   // false
```

- **Idle RPGs** (your capstone): 99 levels of XP is 13 million, and banks hold millions of items. You're nowhere near the limit. Still, add an assertion in your tick tests that values stay safe integers, because it's cheap insurance.
- **Incremental games** whose numbers explode (1e100, 1e308, beyond) use libraries like **break_infinity.js** or **break_eternity.js**, which store numbers as a mantissa plus an exponent. `BigInt` handles huge integers exactly, but it's slower and can't mix with normal numbers or be JSON-serialised directly.
- `Number.MAX_VALUE` is about 1.8e308. Beyond it you get `Infinity`, and `NaN` follows soon after. Validate saves for `NaN`/`Infinity` (Zod's `z.number()` rejects both by default ✅).

## Formatting for players

### Grouping
```ts
(1234567).toLocaleString('en-US');      // "1,234,567"
new Intl.NumberFormat('en-GB').format(1234567.891);   // "1,234,567.891"
```

Pass a locale explicitly in tests (06-01 did) for deterministic output. In the UI you might use the player's locale (`undefined` = the browser default), which gives "1.234.567" in German. That's a nice touch.

### Compact notation
Idle games show big numbers compactly: `1.23K`, `45.6M`, `7.89B`.

`Intl.NumberFormat` has this built in:

```ts
new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(1234);   // "1.2K"
```

but it varies slightly between browsers and locales, and games usually want **exact control** (always 3 significant digits, suffixes up to "Qa"/"Qi", then scientific notation). So they write their own, as you will in exercise 13-07:

| Input | Output |
|---|---|
| 999 | `999` |
| 1,234 | `1.23K` |
| 12,345 | `12.3K` |
| 123,456 | `123K` |
| 999,999 | `1.00M` ⚠️ not `1000K` |
| 1,500,000 | `1.50M` |
| 2.5e12 | `2.50T` |
| 1e18 | `1.00e18` (beyond the suffixes) |
| −1,234 | `-1.23K` |

The tricky part is the **rollover**: 999,999 rounds to "1000K" if you pick the suffix *before* rounding. You need to round first, then check whether it rolled over into the next unit.

### Keep the UI steady
```css
.number { font-variant-numeric: tabular-nums; }   /* equal-width digits: no jiggling as numbers change */
```

### Rates, durations and percentages
```ts
formatRate(xpPerMs)        // "12.5 XP/s"   (multiply by 1000 for per second)
formatDuration(ms)         // "3h 20m"      (you tested this in 12-01!)
formatPercent(0.4567)      // "45.7%"
```

## Rounding: display vs storage

**Store exact values, and round only for display.** The UI might show `1.23K`, but the bank holds `1234`. If you rounded the stored value, players would lose items.

The rounding functions:
- `Math.floor` for "how many whole items/levels you have" (never round up what the player hasn't earned)
- `Math.round` for display-only approximations
- `toFixed(n)` returns a **string** with `n` decimals (rounding is mostly half-up, with float quirks: `(1.005).toFixed(2)` is `"1.00"`!)

## Check your understanding

1. Why should gold be stored as an integer?
2. What happens at `2 ** 53 + 1`?
3. Why does a naive compact formatter turn 999,999 into "1000K"?
4. Should the bank store `1.23K` or `1234`?
5. Why use `tabular-nums` in an idle game?

<details><summary>Answers</summary>

1. Integers are exact (within the safe range), so there's no rounding drift. Fractional floats accumulate errors, and `0.1 + 0.2 !== 0.3`.
2. It equals `2 ** 53`: integers above `MAX_SAFE_INTEGER` can't all be represented, so precision is lost.
3. It picks the "K" suffix because 999,999 < 1,000,000, then rounds 999.999 to "1000". You must round first and move up to the next suffix if the rounded value reaches 1000.
4. `1234`. Store exact values and format only for display.
5. Numbers change constantly. Proportional digits have different widths, so text shifts left and right as values tick. Tabular digits keep it steady.
</details>

## Further reading
- MDN: [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER), [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- *"What Every Programmer Should Know About Floating-Point Arithmetic"* (floating-point-gui.de)

**Practice:** exercise `13-07` format-numbers → `npm run watch 13-07`

---
[← Offline progress](08-offline-progress.md) · [Module overview](README.md) · [Next: Saving, versioning & migrations →](10-saving-versioning-and-migrations.md)
