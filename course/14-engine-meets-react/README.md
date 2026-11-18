# Module 14 · Connecting the Engine to React

**Time:** ~12 hours · **Prerequisites:** Module 13, and lessons 08.5 (stores), 09.5 (performance) and 07.4 (effects)

## Why this module matters
You have a pure engine. Now you need it to drive a smooth, battery-friendly mobile UI that updates ten times a second, survives tab switches and phone sleeps, doesn't double up when the game is open in two tabs, and never loses progress. Getting this layer right is the difference between an idle game that feels polished and one that stutters, drains batteries and corrupts saves. The patterns (external stores, transient updates, lifecycle handling, leader election between tabs) also show up in any real-time app: dashboards, trading UIs, collaborative editors, live sports.

## Learning objectives
By the end of this module you can:
- design the runtime layer: an engine store, a loop, a clock, and React as a subscriber
- build a Zustand store around a pure engine, with actions, events and selectors
- render high-frequency updates efficiently (narrow selectors, transient updates, CSS-driven animation)
- handle page visibility, page hide, sleep and resume correctly
- prevent the game running in two tabs at once
- decide when a Web Worker is worth it

## Lessons
| # | Lesson | Time |
|---|---|---|
| 14.1 | [Architecture: the engine lives outside React](01-architecture-engine-outside-react.md) | 2h |
| 14.2 | [Building the game store](02-building-the-game-store.md) | 2.5h |
| 14.3 | [Rendering fast updates](03-rendering-fast-updates.md) | 2.5h |
| 14.4 | [Page lifecycle & multiple tabs](04-page-lifecycle-and-multiple-tabs.md) | 2h |
| 14.5 | [Web Workers (optional)](05-web-workers.md) | 1h |

## Exercises
| Id | Exercise | After lesson |
|---|---|---|
| `14-01` | [game-store](../../exercises/14-engine-meets-react/01-game-store/exercise.tsx) | 14.2 |
| `14-02` | [smooth-progress-bar](../../exercises/14-engine-meets-react/02-smooth-progress-bar/exercise.tsx) | 14.3 |
| `14-03` | [use-page-visibility](../../exercises/14-engine-meets-react/03-use-page-visibility/exercise.ts) | 14.4 |

Hints: [`exercises/14-engine-meets-react/HINTS.md`](../../exercises/14-engine-meets-react/HINTS.md)

## Checkpoint quiz
1. Why shouldn't the game loop live in a component's `useEffect` that calls `setState`?
2. What does React "own" in this architecture, and what does it not?
3. How do the engine's events reach the UI without being stored in state?
4. Name three ways to render a progress bar that advances every frame, and their trade-offs.
5. What should happen when the page becomes hidden? And when it becomes visible again?
6. What goes wrong if the game runs in two tabs at once? How do you prevent it?
7. When is a Web Worker worth the complexity?

<details><summary>Answers</summary>

1. The loop would be tied to one component's lifecycle (restarting on remounts, doubling under StrictMode if cleanup is wrong), every tick would re-render that component and its children, and non-React code (offline catch-up, saving) couldn't easily reach the state.
2. React owns *rendering* (and UI state like open menus). It doesn't own the simulation (the engine plus the store), time (the loop or clock), or persistence (save and sync).
3. The store's `advance()` collects the events returned by `tick` and passes them to subscribed listeners (an event emitter). UI code subscribes in an effect and shows toasts or announcements.
4. (a) React state per frame: simple but costly re-renders. (b) A store subscription plus a ref writing the style/CSS variable directly: smooth with no re-renders, but more manual. (c) A CSS animation keyed to the action's start and duration: the cheapest and smoothest, but it needs care for pauses and resyncing.
5. Hidden: save immediately (the user may never return), and optionally pause the loop. Visible: run offline catch-up for the time since `lastUpdatedAt`, show a summary if it was long, and resume the loop.
6. Both tabs advance the same save, so progress doubles, and the saves overwrite each other (lost progress or conflicts). Use leader election (Web Locks, BroadcastChannel, or a `localStorage` heartbeat) so only one tab runs the game, and show "open in another tab" in the others.
7. When simulation work is heavy enough to cause jank on the main thread (complex combat simulations, big offline simulations that can't be computed analytically, or path-finding). For a simple tick computed in microseconds, it's not worth it.
</details>

## Extra practice
1. **Event-to-toast pipeline.** Build a `useGameEvents(handler)` hook and a toast queue that groups rapid `itemsGained` events ("+3 Oak Logs" rather than three separate toasts).
2. **Performance budget.** In `vite-sandbox`, render 200 skill cards subscribed to a store ticking at 10 Hz. Use the Profiler to get commits per tick down to one small component.
3. **Web Locks.** Re-implement the single-tab guard from 14-03 with `navigator.locks.request` and compare.

**Next:** [Module 15 · Node.js & Express →](../15-node-and-express/README.md)
