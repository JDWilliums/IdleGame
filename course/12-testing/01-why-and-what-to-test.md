# 12.1 · Why & what to test

> ⏱ 1 hour · Module 12 · Testing

## What you'll learn
- What tests are actually for
- Unit, integration and end-to-end tests, and the "testing trophy"
- "Test behaviour, not implementation"
- What deserves the most testing in your game
- Properties of a good test

---

## What tests are for

1. **Confidence to change code.** Refactor the tick loop, upgrade React, rename things, and know you didn't break anything. This is the big one.
2. **Catching regressions.** A bug fixed with a test stays fixed.
3. **Documentation that can't go stale.** You've been reading test files all course to understand what code should do.
4. **Design feedback.** Code that's hard to test is usually tangled. Pure functions and injected dependencies are easy to test, and that's no coincidence.

Tests are **not** for proving there are no bugs (they can't), and they aren't for hitting a coverage number.

## Kinds of tests

| Kind | Tests | Speed | Confidence per test | Example in your game |
|---|---|---|---|---|
| **Static** | types and lint | instant | catches typos and type errors | `tsc`, oxlint |
| **Unit** | one function or module in isolation | ms | narrow | `levelFromXp(83) === 2` |
| **Integration** | several units together | ms to s | high | rendering `<BankScreen>` with a real store, clicking "Sell", seeing the gold update |
| **End-to-end (E2E)** | the whole app in a real browser, often with a real backend | seconds | highest | sign up → play → reload on "another device" → progress is there |

## The testing trophy

Kent C. Dodds' "testing trophy" (an update of the older "test pyramid"):

```
         ___
        / E2E \          a few: critical user journeys
       /--------\
      /Integration\      MOST tests: components + hooks + store together
     /------------\
    /     Unit     \     pure logic: engine maths, reducers, utilities
   /----------------\
  /      Static      \   TypeScript + lint: always on
```

*"Write tests. Not too many. Mostly integration."* (Guillermo Rauch) Integration tests give the best ratio of confidence to cost for UI code. One test that renders the bank, clicks sell and checks the gold covers the component, its children, the store and the formatting together.

**For your game engine, though, unit tests are king.** The engine is pure functions with tricky maths and many edge cases, which is exactly what unit tests are best at.

## Test behaviour, not implementation

Test **what the user (or the caller) observes**, not how the code achieves it.

```tsx
// ❌ an implementation detail: breaks if you rename the state or switch to a reducer
expect(component.state.isOpen).toBe(true);
expect(container.querySelector('.modal--open')).not.toBeNull();
expect(setIsOpenSpy).toHaveBeenCalledWith(true);

// ✅ behaviour: what the user experiences
await userEvent.click(screen.getByRole('button', { name: 'Open shop' }));
expect(screen.getByRole('dialog', { name: 'Village shop' })).toBeVisible();
```

A good test:
- **fails when behaviour breaks**, and
- **passes when you refactor** without changing behaviour.

An implementation-detail test fails at both: it breaks on harmless refactors and can pass while users see a bug.

## What to test in your game

High value, so test thoroughly:
- **Engine maths**: XP curves, level boundaries, action timing, offline progress caps, loot probabilities (with a seeded RNG).
- **Save migrations**: every old version upgrades correctly, and corrupted saves are rejected safely.
- **Reducers and store actions**: buying, selling, crafting rules, can't-afford cases.
- **Sync conflict logic**: what happens when the cloud save is newer, older or diverged.
- **The API**: validation, auth required, can't read or overwrite someone else's save.

Medium value:
- key components (skill card states, bank filtering, forms) with integration tests

Lower value, so skip or keep light:
- static markup with no logic
- third-party library behaviour (don't test that React Router routes)
- styling (catch visual bugs with your eyes, or visual regression tools later)

A handful of E2E tests:
- sign up → start an action → reload → the action continues
- offline progress after a simulated long absence
- cross-device: save on device A, open device B, see the same progress

## Coverage

Coverage tools (`vitest --coverage`) report which lines your tests executed. They're useful for **finding untested areas**, but high coverage doesn't mean good tests. A test that runs every line without asserting anything gives 100% coverage and zero confidence. That's why this course grades your tests with **mutation testing** instead: it checks whether your tests *notice* when the code is wrong.

## Properties of a good test

- **Readable**: the name says what behaviour is expected (`'refunds half the price, rounded down'`).
- **Arrange → Act → Assert**: set up, do one thing, check the result.
- **Independent**: no shared mutable state, and any order works.
- **Deterministic**: no real time, randomness or network (inject or fake them).
- **Fast**: milliseconds, so you run them constantly.
- **Fails for one reason**: focused, with a clear failure message.

```ts
it('refunds half the price, rounded down', () => {
  // Arrange
  const store = createShopStore(25);
  store.getState().buy('net');           // costs 25
  // Act
  store.getState().sell('net');
  // Assert
  expect(store.getState().gold).toBe(12);
});
```

## Check your understanding

1. Why are integration tests often the best value for UI code?
2. Why do unit tests suit your game engine especially well?
3. A test checks that a component has the class `skill-card--active`. What's wrong with that, and what would be better?
4. Why isn't 100% coverage the goal?

<details><summary>Answers</summary>

1. One test exercises many pieces together the way they really run, which gives high confidence about what users experience, while staying fast in jsdom.
2. The engine is pure functions (input → output) with lots of edge cases and maths. Unit tests are fast, precise and easy to write for exactly that.
3. It tests an implementation detail. A CSS refactor breaks it, and it doesn't prove anything the user perceives. Assert on something user-visible instead: an "Active" badge, `aria-pressed="true"`, or the "Stop" button text.
4. Coverage measures what was *executed*, not what was *checked*. You can reach 100% with useless tests. Aim for tests that catch real bugs, which is what mutation testing measures.
</details>

## Further reading
- Kent C. Dodds: *"Write tests. Not too many. Mostly integration."* and *"The Testing Trophy and Testing Classifications"*
- Martin Fowler: *"The Practical Test Pyramid"*

---
[Module overview](README.md) · [Next: Vitest fundamentals →](02-vitest-fundamentals.md)
