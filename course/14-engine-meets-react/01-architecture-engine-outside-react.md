# 14.1 · Architecture: the engine lives outside React

> ⏱ 2 hours · Module 14 · Connecting the Engine to React

## What you'll learn
- Why a component-driven game loop goes wrong
- The layered runtime: engine → store → loop → React
- Who owns what: state, time, persistence, rendering
- How player input flows in and how events flow out
- Starting the runtime once, safely, even under StrictMode

---

## The tempting (wrong) approach

```tsx
function Game() {
  const [state, setState] = useState(createInitialState);
  useInterval(() => {
    setState((s) => tick(s, 100).state);    // the engine runs "inside" React
  }, 100);
  return <App state={state} />;              // everything re-renders 10×/second
}
```

It works for a demo (it's roughly what P2 did!), but:
- **Every tick re-renders the whole tree** under `Game`: the bank, the shop, the settings, everything.
- **The loop's lifetime is tied to a component.** Remount it (a route change, an error boundary reset, StrictMode in dev) and the loop restarts.
- **Non-React code can't reach the state**: offline catch-up on load, the save system, the sync engine, devtools.
- **Events have nowhere to go.** Toasts for level-ups get bolted on with effects that watch state (07.5's anti-pattern).

## The layered runtime

```
                       ┌──────────────────────────────────────┐
   player taps ───────►│ store actions: startAction, sell…    │
                       │                                      │
   loop (timer) ──────►│ advance(dt) → tick(state, dt, rng)   │──── events ───► toasts, sounds,
   clock (now)         │                                      │                 aria-live
                       │ GAME STORE (Zustand, vanilla)        │
   save/sync ◄────────►│  state: GameState                    │
                       └──────────────┬───────────────────────┘
                                      │ subscribe(selector)
                       ┌──────────────▼───────────────────────┐
                       │ REACT: renders slices of state,      │
                       │ calls store actions on user input    │
                       └──────────────────────────────────────┘
```

| Layer | Owns | Knows about |
|---|---|---|
| **Engine** (Module 13) | the rules | nothing outside itself: pure functions |
| **Store** | the current `GameState`, and event fan-out | the engine |
| **Runtime** (loop + clock + lifecycle) | *time*: when to advance, catch up and save | the store, timers, `document` events |
| **Persistence** (save + sync) | durability | the store, storage, the API |
| **React** | *rendering* and UI-only state | the store (read via selectors, write via actions) |

The key shift is that **React is a view of the game, not the game itself.** You could swap React for Vue, or run the store in a Node test, and the game would behave identically.

## Input flows in, events flow out

**Input**: components call store actions, which call engine functions:

```tsx
const startAction = useGameStore((s) => s.startAction);
<button onClick={() => startAction('chop_oak')}>Chop</button>
```

**Output**: the store runs `tick`, keeps the new state, and **emits** the returned events to subscribers:

```ts
advance(dt) {
  const { state, events } = tick(get().game, dt, rng);
  if (state !== get().game) set({ game: state });
  if (events.length > 0) emit(events);          // listeners: toasts, sounds, analytics
}
```

The UI subscribes once, near the top:

```tsx
useEffect(() => gameEvents.subscribe((events) => {
  for (const e of events) if (e.type === 'levelUp') toast(`${SKILLS[e.skill].name} is now level ${e.level}!`);
}), []);
```

Events are **not stored in state**, because they're things that *happened*, not facts about the present (13.3).

## Starting the runtime once

The runtime is app infrastructure, not a component concern. Create it at **module scope**, or in the app's entry file, and start it from one place:

```ts
// game/runtime.ts
export const gameStore = createGameStore(loadInitialState());
export const gameLoop = createGameLoop({
  stepMs: 100,
  maxStepsPerFrame: 50,
  now: () => performance.now(),
  update: (dt) => gameStore.getState().advance(dt),
  onDroppedTime: (ms) => gameStore.getState().catchUp(Date.now()),   // big gap → offline maths
});

let intervalId: ReturnType<typeof setInterval> | undefined;
export function startRuntime() {
  if (intervalId !== undefined) return;            // idempotent: safe under StrictMode
  gameLoop.start();
  intervalId = setInterval(() => gameLoop.frame(), 100);
}
export function stopRuntime() {
  clearInterval(intervalId);
  intervalId = undefined;
  gameLoop.stop();
}
```

```tsx
// App.tsx
useEffect(() => {
  startRuntime();
  return stopRuntime;          // StrictMode's mount → unmount → mount: start, stop, start. Fine.
}, []);
```

Because `startRuntime` is idempotent and the cleanup really stops it, StrictMode's double-mount ends with exactly one running loop. That's lesson 07.4's "setup and cleanup are symmetrical" principle.

> An alternative is to start the runtime in `main.tsx` before rendering. Either way, keep it **out of** feature components.

## What lives where (your capstone)

```
src/
  game/
    data/          ← skills, items, actions (13.2)
    engine/        ← tick, xp, loot, offline, migrations (13.x), all pure and unit tested
    store.ts       ← createGameStore (14.2)
    runtime.ts     ← loop + lifecycle + autosave wiring (14.1, 14.4)
    selectors.ts   ← selectLevel, selectBankValue… (14.2)
  features/
    skills/ bank/ shop/   ← React components using selectors + actions
```

You'll set up exactly this in capstone milestones C02–C04.

## Check your understanding

1. Name three problems with running the loop inside a component via `setState`.
2. Which layer is allowed to call `Date.now()` or `setInterval`?
3. Why are events emitted rather than stored?
4. Why must `startRuntime` be idempotent?

<details><summary>Answers</summary>

1. Any three of: the whole tree re-renders every tick, the loop restarts with the component's lifecycle (remounts, StrictMode), non-React code can't access the state, and events have no clean channel.
2. The runtime/shell layer (loop, clock, lifecycle). The engine receives time as a parameter, and React only reads state and calls actions.
3. They describe momentary happenings (a level-up just occurred), not durable facts. Storing them would mean clearing them later, re-triggering on remount, and bloating saves.
4. It may be called more than once (StrictMode double-mounting, hot reloads, several entry points). Without a guard you'd run two loops, which doubles the game speed.
</details>

---
[Module overview](README.md) · [Next: Building the game store →](02-building-the-game-store.md)
