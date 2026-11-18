# 12.4 · Mocking the network & testing hooks

> ⏱ 2 hours · Module 12 · Testing

## What you'll learn
- Why to mock at the network level, with MSW
- Writing MSW handlers, per-test overrides, and error and slow responses
- Testing custom hooks with `renderHook` and `act`
- Testing stores
- Dependency injection as a testing strategy

---

## Options for faking the server

| Approach | How | Downside |
|---|---|---|
| `vi.mock('./api')` | replace your API module | your real client code (headers, parsing, errors) never runs |
| a fake `fetch` (`vi.fn`) | pass or mock `fetch` | tied to *how* you call fetch; verbose responses |
| **MSW (Mock Service Worker)** | intercept **requests** at the network layer | a little setup |
| a real test server | run your API | slow, needs a database; better suited to E2E |

**MSW** is the industry standard for frontend tests. Your app code runs completely unchanged (the real `fetch`, the real API client, the real Zod parsing), and only the network response is faked. The same handlers can also power a fake backend in the browser during development.

## MSW setup

```bash
npm install -D msw
```

```ts
// src/test/handlers.ts: the "happy path" fake API
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/leaderboard', ({ request }) => {
    const skill = new URL(request.url).searchParams.get('skill');
    return HttpResponse.json([{ name: 'Ava', level: 50, skill }]);
  }),
  http.put('/api/save', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ revision: 2, savedAt: Date.now(), echo: body });
  }),
];
```

```ts
// src/test/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

```ts
// vitest.setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/test/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));  // fail on unexpected requests
afterEach(() => server.resetHandlers());                          // undo per-test overrides
afterAll(() => server.close());
```

> In jsdom, relative URLs like `/api/x` resolve against `http://localhost`. In Node tests, use absolute URLs.

## Per-test overrides

Test the unhappy paths by overriding a handler for one test:

```tsx
import { http, HttpResponse, delay } from 'msw';
import { server } from '../test/server';

it('shows an error when the leaderboard fails', async () => {
  server.use(http.get('/api/leaderboard', () => new HttpResponse(null, { status: 500 })));
  renderWithProviders(<Leaderboard skill="fishing" />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
});

it('shows a spinner while loading', async () => {
  server.use(http.get('/api/leaderboard', async () => { await delay('infinite'); return HttpResponse.json([]); }));
  renderWithProviders(<Leaderboard skill="fishing" />);
  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
});

it('handles a network failure', async () => {
  server.use(http.get('/api/leaderboard', () => HttpResponse.error()));
  …
});
```

**Assert on what the user sees**, not on "fetch was called with…". If you need to check what was *sent*, capture it in the handler:

```ts
let sent: unknown;
server.use(http.put('/api/save', async ({ request }) => { sent = await request.json(); return HttpResponse.json({ revision: 3 }); }));
…
expect(sent).toMatchObject({ version: 3 });
```

## Testing hooks

Most hooks are best tested **through a component** that uses them (an integration test). For reusable hooks with an interesting API, use `renderHook`:

```ts
import { act, renderHook } from '@testing-library/react';

it('toggles', () => {
  const { result } = renderHook(() => useToggle(false));
  act(() => result.current[1]());           // call toggle inside act
  expect(result.current[0]).toBe(true);
});

it('reacts to new props', () => {
  const { result, rerender } = renderHook(({ delay }) => useDebouncedValue('x', delay), {
    initialProps: { delay: 100 },
  });
  rerender({ delay: 500 });
  …
});
```

- `result.current` always holds the **latest** return value. Don't destructure it once and expect it to update.
- `act(() => …)` wraps anything that updates state outside a user event (calling a returned function, advancing fake timers, firing store updates), so React processes it before you assert.
- `renderHook(..., { wrapper })` provides context (QueryClient, store providers).

You've used all of this in exercises 07-03, 07-04 and 10-02. Re-read those test files now with this lesson in mind.

## Testing stores

Zustand stores (and your game store) are plain objects, so test them **without React** first:

```ts
it('buying deducts gold', () => {
  const store = createShopStore(100);       // a factory → a fresh store per test (08-04)
  store.getState().buy('bronze_axe');
  expect(store.getState().gold).toBe(50);
});
```

Then test a component or two **with** a store, to check the wiring.

If you only have a singleton store, reset it between tests:

```ts
const initial = useGameStore.getState();
afterEach(() => useGameStore.setState(initial, true));   // true = replace, not merge
```

## Dependency injection: designing for tests

The recurring theme of this module: **code that receives its dependencies is easy to test.**

```ts
// hard to test: hidden dependencies on the real clock, real randomness and real storage
function runOfflineProgress() {
  const save = JSON.parse(localStorage.getItem('save')!);
  const elapsed = Date.now() - save.lastSavedAt;
  const roll = Math.random();
  …
}

// easy to test: everything comes in through parameters
function runOfflineProgress(save: SaveFile, now: number, rng: Rng): OfflineResult { … }
```

In tests you pass a fixed `now` and a seeded `rng`, with no fakes and no mocks. Your game engine in Module 13 is built entirely this way, and that's why it can have hundreds of fast, deterministic tests.

## Check your understanding

1. What's the main advantage of MSW over `vi.mock('./api')`?
2. Why set `onUnhandledRequest: 'error'`?
3. Why does `const [on] = result.current` before an `act` call give a stale value afterwards?
4. How would you make `runOfflineProgress` testable without fake timers?

<details><summary>Answers</summary>

1. Your real API client code runs (URL building, headers, JSON parsing, error handling, validation), and only the network is faked, so tests catch bugs in that code too.
2. So a test fails loudly when the code makes a request you didn't expect or forgot to mock, instead of hanging or hitting a real server.
3. You captured a value from that moment. `result.current` is replaced with the new return value after each render, so read `result.current` again after `act`.
4. Inject time (and randomness and the save) as parameters: `runOfflineProgress(save, now, rng)`. Tests pass fixed values.
</details>

## Further reading
- MSW docs: https://mswjs.io ("Quick start", "Network behavior: Node.js", "Overriding responses")
- Testing Library: [`renderHook`](https://testing-library.com/docs/react-testing-library/api#renderhook)
- Zustand docs: "Testing"

---
[← Testing React components](03-testing-react-components.md) · [Module overview](README.md) · [Next: End-to-end tests with Playwright →](05-end-to-end-with-playwright.md)
