# 14.4 · Page lifecycle & multiple tabs

> ⏱ 2 hours · Module 14 · Connecting the Engine to React

## What you'll learn
- The page lifecycle: visible, hidden, frozen, discarded, and bfcache
- What the runtime does on each transition
- Saving reliably when the user leaves
- Why the game must not run in two tabs, and three ways to prevent it
- Putting it together in a `useGameLifecycle` hook

---

## The page lifecycle

Browsers move pages through states to save battery and memory, and mobile browsers are aggressive about it:

```
          visibilitychange               (mobile: app switch, screen lock)
 ACTIVE ◄──────────────────► HIDDEN ──────────────────────────► FROZEN ──► DISCARDED
 (focused, visible)          (other tab, minimised)    freeze     (no JS runs)  (page killed;
                              timers throttled          event                    reload on return)
         ▲                                                 │
         └───────────────── resume event ◄─────────────────┘
 pagehide/pageshow: leaving or returning to the page (including the back/forward cache)
```

What this means for your game:
- **Hidden**: timers are throttled to about 1/s, then about 1/min (01.4).
- **Frozen**: *no JavaScript runs at all*, which is common on mobile.
- **Discarded**: the page is killed silently. Unsaved progress is **gone** unless you saved on `hidden`.
- **bfcache**: navigating away and back can restore the page *instantly* from memory, timers and all, which fires `pageshow` with `event.persisted === true`.

> 🧠 **The rule:** the last event you can rely on is **`visibilitychange` → `hidden`**. After it, your page may never run JavaScript again. Save there.

## What the runtime does

| Event | Action |
|---|---|
| `visibilitychange` → **hidden** | **save now** (local), and queue a cloud sync (Module 18). Optionally stop the loop, since throttled ticks are wasteful and catch-up handles the gap. |
| `visibilitychange` → **visible** | **catch up** offline progress since `lastUpdatedAt`, show a summary if it was long, and restart the loop |
| `pagehide` | save again (belt and braces). This also covers navigation to another site |
| `pageshow` with `persisted` | restored from bfcache, so catch up as for visible |
| the loop's `onDroppedTime` | a big gap noticed mid-session (sleep), so catch up |

Avoid `beforeunload` and `unload`: they're unreliable on mobile, and `unload` disables the bfcache. (`beforeunload` is still useful for desktop "you have unsaved changes" prompts, which an autosaving game doesn't need.)

### Saving fast and safely on hide
- **Local save**: `localStorage.setItem` is synchronous, so it will complete before the page freezes. 
- **Network save**: a normal `fetch` may be cancelled when the page freezes. Use `fetch(url, { method: 'PUT', body, keepalive: true })`, which lets the request outlive the page (with a ~64 KB body limit), or `navigator.sendBeacon` (POST only). Lesson 18.2 builds this.

## Two tabs, one save

A player opens the game on their laptop in two tabs (or opens it again without noticing the first). Both tabs:
- load the same save
- run the loop, so the player earns **double progress** (a cheat, and it breaks the economy)
- save over each other, so whichever writes last **wins and the other's progress is lost**

Never let two tabs run the same game. Elect a **leader**:

### Option 1: Web Locks API (modern, simplest)
```ts
navigator.locks.request('hearthwild-game', { ifAvailable: true }, async (lock) => {
  if (!lock) { showOpenElsewhere(); return; }   // another tab holds it
  startRuntime();
  await new Promise(() => {});                   // hold the lock for the lifetime of the tab
});
```
The browser releases the lock automatically when the tab closes or crashes. It's supported in all modern browsers.

### Option 2: BroadcastChannel (messaging between tabs)
```ts
const channel = new BroadcastChannel('hearthwild');
channel.postMessage({ type: 'hello', tabId });
channel.onmessage = (e) => { if (e.data.type === 'hello') channel.postMessage({ type: 'iAmLeader', tabId }); };
```
It's great for "the other tab took over, please stop" messages, but leader election on top of it needs care.

### Option 3: a `localStorage` heartbeat (works everywhere, easy to test)
The leader writes `{ ownerId, heartbeatAt }` every few seconds. Another tab checks it:
- no owner, or the heartbeat is **stale** (older than a timeout, meaning that tab closed or froze) → take over
- a fresh heartbeat from another id → you're not the leader

```ts
const lock = createSingleTabGuard({ storage: localStorage, key: 'game-lock', id: crypto.randomUUID(), now: Date.now, timeoutMs: 10_000 });
if (lock.tryAcquire()) startRuntime(); else showOpenElsewhere();
setInterval(() => lock.heartbeat(), 3_000);
```

The `storage` event (03.3) tells other tabs immediately when the lock changes. You'll build this guard as a pure, testable module in exercise 14-03.

### The UI for non-leader tabs
"Hearthwild is open in another tab. [Play here instead]". "Play here" takes over: it writes the lock with its own id. The old leader notices on its next heartbeat that it no longer owns the lock, then saves, stops, and shows the same message.

## A lifecycle hook

Wire all of this up in one place, with the latest-callback pattern (07.6) so the listeners are registered once:

```tsx
export function usePageLifecycle(handlers: { onHidden: () => void; onVisible: () => void; onPageHide: () => void }) {
  const latest = useRef(handlers);
  useEffect(() => { latest.current = handlers; });

  useEffect(() => {
    const onVisibility = () =>
      document.visibilityState === 'hidden' ? latest.current.onHidden() : latest.current.onVisible();
    const onPageHide = () => latest.current.onPageHide();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);
}
```

## Check your understanding

1. Why save on `visibilitychange` → hidden rather than on `beforeunload`?
2. What happens to an ordinary `fetch` started as the page is being hidden, and how do you make it survive?
3. Describe the double-progress bug with two tabs.
4. In the heartbeat approach, how does a new tab know the old leader has closed?

<details><summary>Answers</summary>

1. On mobile, `beforeunload` often doesn't fire at all (the app is backgrounded, then killed). `visibilitychange` → hidden is the last reliable signal before the page may be frozen or discarded.
2. It may be cancelled when the page freezes or unloads. Use `fetch` with `keepalive: true` (or `navigator.sendBeacon`) so the browser completes it independently.
3. Both tabs advance the same save in parallel, so the player earns progress twice as fast. When they save, each overwrites the other, so progress is lost and the result is inconsistent.
4. The heartbeat timestamp stops updating. Once it's older than the timeout, the new tab treats the lock as stale and takes over.
</details>

## Further reading
- Chrome developers: [Page Lifecycle API](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)
- MDN: [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel), [`fetch` keepalive](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#keepalive)
- web.dev: [Back/forward cache](https://web.dev/articles/bfcache)

**Practice:** exercise `14-03` use-page-visibility → `npm run watch 14-03`

---
[← Rendering fast updates](03-rendering-fast-updates.md) · [Module overview](README.md) · [Next: Web Workers (optional) →](05-web-workers.md)
