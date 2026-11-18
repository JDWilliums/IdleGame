/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 07-03 · use-interval
 * Lessons: 07.4 Effects · 07.6 Timers & stale closures
 * Run:     npm run watch 07-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write `useInterval(callback, delay)`, the declarative interval hook.
 *
 *   useInterval(() => setLogs(logs + 1), isChopping ? 1000 : null);
 *
 * Requirements (each has a test):
 *   1. Calls `callback` every `delay` ms.
 *   2. `delay === null` pauses it (no interval running at all).
 *   3. Changing `delay` restarts the interval with the new delay.
 *   4. Passing a NEW callback (which happens on every render) must NOT restart
 *      the timer, but the NEXT tick must call the NEW callback. That's what
 *      avoids stale closures. Use the latest-ref pattern (07.6). Don't use
 *      useEffectEvent here; that's the extra challenge below.
 *   5. Unmounting clears the interval (no leaked timers).
 *   6. Works under <StrictMode> (effects run setup → cleanup → setup): exactly
 *      ONE interval may be running.
 *
 * EXTRA CHALLENGE (after passing): write `useIntervalWithEffectEvent` in your
 * playground using React's useEffectEvent, and check it against these tests by
 * temporarily swapping the implementation.
 */

export function useInterval(callback: () => void, delay: number | null): void {
  // TODO
}
