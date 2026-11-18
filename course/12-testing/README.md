# Module 12 · Testing

**Time:** ~14 hours · **Prerequisites:** Modules 06–10. You've been *running* tests for the whole course, and now you'll learn to *write* them.

## Why this module matters
Tests let you change code without fear. Professional teams expect every PR to include tests, and interviewers regularly ask "how would you test this?" or set take-home tasks where tests count towards the grade. Your idle game especially needs them: the engine's maths (XP curves, offline progress, save migrations) must be right, because a bug there quietly corrupts players' saves. In this module you'll write tests for real, and they're graded by **mutation testing**: your tests have to catch deliberately planted bugs.

## Learning objectives
By the end of this module you can:
- decide what to test and at which level (unit, integration, end-to-end)
- write clear Vitest tests with good structure, matchers, mocks, fake timers and table tests
- test React components the way users use them, with Testing Library
- mock the network with MSW, test hooks, and test stores
- write end-to-end tests with Playwright, including a mobile viewport and fast-forwarded time
- use TDD (red → green → refactor) when it helps

## Lessons
| # | Lesson | Time |
|---|---|---|
| 12.1 | [Why & what to test](01-why-and-what-to-test.md) | 1h |
| 12.2 | [Vitest fundamentals](02-vitest-fundamentals.md) | 2.5h |
| 12.3 | [Testing React components](03-testing-react-components.md) | 2.5h |
| 12.4 | [Mocking the network & testing hooks](04-mocking-the-network.md) | 2h |
| 12.5 | [End-to-end tests with Playwright](05-end-to-end-with-playwright.md) | 2h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `12-01` | [write-unit-tests](../../exercises/12-testing/01-write-unit-tests/exercise.test.ts) | 12.2 |
| `12-02` | [write-component-tests](../../exercises/12-testing/02-write-component-tests/exercise.test.tsx) | 12.3 |

**These are graded differently.** You write the *test file*, and a grader (`mutation.test.ts`) runs your tests against the real code **and** against six hidden buggy versions. Your tests must pass on the real code and fail on every buggy version. If a mutant "survives", your tests have a gap.

Hints: [`exercises/12-testing/HINTS.md`](../../exercises/12-testing/HINTS.md)

## Project
**P2 · [Pocket Forge, a React mini idle game](../projects/P2-pocket-forge.md)** (~20h). Brings all of Part 2 together: state, effects, timers, a reducer or store, routing, styling and tests.

## Checkpoint quiz
1. What's the "testing trophy", and where should most of your tests sit?
2. Why is "test behaviour, not implementation" good advice? Give an example of an implementation-detail test.
3. `toBe` vs `toEqual`: when do you use each?
4. Which Testing Library query should you reach for first, and why?
5. `getBy`, `queryBy` and `findBy`: what's the difference?
6. Why mock the network with MSW instead of mocking `fetch` directly?
7. How do you test code that uses `setTimeout` or `Date.now()` without waiting?
8. What's a flaky test, and what are common causes in UI tests?

<details><summary>Answers</summary>

1. A shape for balancing test types: a base of static analysis (types, lint), some unit tests, **most** tests at the integration level (several units working together, e.g. a component with its children and hooks), and a few end-to-end tests at the top.
2. Implementation-detail tests break when you refactor, even if behaviour is unchanged, and they can pass while the user-visible behaviour is broken. Examples: asserting on a component's internal state, on a CSS class name, or that a specific private function was called.
3. `toBe` checks identity (`Object.is`): use it for primitives or "the same object". `toEqual` checks deep structural equality: use it for objects and arrays with the same contents.
4. `getByRole`. It finds elements the way assistive technology does, so it also checks that your markup is accessible.
5. `getBy` throws if not found (for asserting presence). `queryBy` returns `null` (for asserting absence). `findBy` returns a promise that waits for the element to appear (for async UI).
6. MSW intercepts at the network level, so your code (including your real API client, headers and JSON parsing) runs unchanged, and the same handlers work in tests, the browser and Storybook. Mocking `fetch` couples tests to *how* you call it.
7. Fake timers: `vi.useFakeTimers()`, `vi.advanceTimersByTime()` and `vi.setSystemTime()`. Or inject a clock (pass `now` as a parameter).
8. A test that sometimes passes and sometimes fails without code changes. Common causes: real timers and races, not awaiting async UI (`getBy` instead of `findBy`), shared state between tests, depending on test order, real network calls, randomness and animations.
</details>

## Extra practice
1. **Mutation testing for real.** Run StrykerJS on one of your earlier exercises (`npx stryker init`). It automates what the graders here do.
2. **TDD kata.** Build `levelFromXp` test-first: one failing test → make it pass → refactor, ten times.
3. **Test your 07-05 timer** with Playwright in `vite-sandbox` using `page.clock` to fast-forward.

**Next:** [Module 13 · The Idle Game Engine →](../13-idle-game-engine/README.md)
