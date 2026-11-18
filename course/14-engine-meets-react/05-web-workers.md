# 14.5 · Web Workers (optional)

> ⏱ 1 hour · Module 14 · Connecting the Engine to React

## What you'll learn
- What Web Workers are, and their limits
- Moving the engine into a worker, and what that changes
- Messaging costs (structured cloning) and Comlink
- A decision guide: when it's worth it

---

## Off the main thread

A **Web Worker** runs JavaScript on a **separate thread**. Heavy computation there can't freeze the UI:

```ts
// engine.worker.ts
self.onmessage = (event: MessageEvent<{ type: 'simulate'; state: GameState; ms: number }>) => {
  const result = heavySimulation(event.data.state, event.data.ms);
  self.postMessage(result);
};
```

```ts
// main thread (Vite understands this syntax and bundles the worker for you)
const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'simulate', state, ms: 8 * HOUR });
worker.onmessage = (e) => applyResult(e.data);
```

Limits:
- **No DOM access**, and no `window`/`document`/`localStorage` (IndexedDB *is* available).
- **Communication is by message passing**: data is **copied** with the structured clone algorithm. A 200 KB state copied ten times a second adds up.
- More moving parts: a message protocol, error handling across threads, and harder debugging.

## Comlink

Writing message protocols by hand is tedious. **Comlink** (a small Google library) makes a worker look like an async object:

```ts
// worker
import { expose } from 'comlink';
expose({ simulate: (state: GameState, ms: number) => heavySimulation(state, ms) });

// main
import { wrap } from 'comlink';
const engine = wrap<{ simulate: (s: GameState, ms: number) => OfflineResult }>(worker);
const result = await engine.simulate(state, 8 * HOUR);
```

## Architectures

1. **Engine on the main thread, heavy jobs in a worker** *(recommended if you need a worker at all)*: the normal 10 Hz tick stays on the main thread (microseconds), and only expensive one-offs go to the worker (simulating a long combat session that can't be computed analytically, or generating content).
2. **The whole engine in a worker**: the worker owns the state and ticks, and posts snapshots or diffs to the main thread, where a store mirrors them. It's more robust against main-thread jank, and timers in workers are sometimes throttled less in background tabs, but you get the latency and copying costs plus significant complexity.

## Decision guide

| Situation | Worker? |
|---|---|
| a tick takes microseconds (your capstone's skills) | ❌ no |
| offline progress computed analytically (13.8) | ❌ no |
| offline progress must *simulate* (combat with lots of randomness and state) for hours | ✅ yes, for that job |
| path-finding, procedural generation, big data processing | ✅ yes |
| "it might be faster" without measuring | ❌ measure first (09.5) |

For the capstone you most likely **won't need** a worker, and that's a perfectly good engineering decision to explain in an interview: you measured, the tick is fast, and adding a worker would add complexity without benefit. If combat simulation (C11) turns out to be heavy, you'll know exactly where a worker would go.

## Check your understanding

1. Why can't a worker update a React component directly?
2. What's the hidden cost of sending the entire game state to a worker every tick?
3. Give one job in an idle RPG where a worker makes sense.

<details><summary>Answers</summary>

1. Workers have no DOM access and don't share memory with the main thread's JavaScript objects. They can only send messages, which main-thread code turns into store updates.
2. Structured cloning: the whole object is copied on every message, which costs CPU and memory in proportion to its size.
3. Simulating many hours of complex combat for offline progress, or anything else heavy enough to cause visible jank if it ran on the main thread.
</details>

## Further reading
- MDN: [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- Vite docs: [Web Workers](https://vite.dev/guide/features#web-workers)
- Comlink: https://github.com/GoogleChromeLabs/comlink

**🎉 That's Part 3 done.** You have an engine and you know how to drive a UI with it. Next comes the backend that will make it playable across devices.

---
[← Page lifecycle & multiple tabs](04-page-lifecycle-and-multiple-tabs.md) · [Module overview](README.md) · [Next module: Node.js & Express →](../15-node-and-express/README.md)
