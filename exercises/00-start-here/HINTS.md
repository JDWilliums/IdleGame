# Hints · Module 00

Open **one level at a time**. Give each level a real attempt before opening the next.

## 00-01 · hello-course

<details><summary>Level 1 · Nudge</summary>

- Strings have a method that removes whitespace from both ends.
- An empty string is *falsy* in JavaScript.
- Arrays have a method that "folds" a list into a single value.
- `Math` has functions for rounding down, rounding to nearest and rounding *up*.
</details>

<details><summary>Level 2 · Direction</summary>

- `welcomeMessage`: trim the name first, then pick between the trimmed name and `"adventurer"`. A template literal (backticks) builds the final string.
- `totalHours`: use `reduce`, starting from `0`, adding each module's `hours`.
- `weeksToFinish`: check for a bad `hoursPerWeek` *first* and `throw new Error(...)`. Otherwise divide and round **up**.
</details>

<details><summary>Level 3 · Walkthrough</summary>

1. `const trimmed = name.trim();`. Now `"   "` becomes `""`.
2. Use `trimmed || 'adventurer'`: if `trimmed` is `""` (falsy) you get the fallback.
3. Return `` `Welcome to Idle Game Academy, ${...}!` `` with that value inside `${}`.
4. For the total, `modules.reduce((sum, m) => sum + m.hours, 0)`. Without the `0`, an empty array throws.
5. For weeks, `if (hoursPerWeek <= 0) throw new Error('...')`, then `return Math.ceil(totalHours / hoursPerWeek)`.
</details>
