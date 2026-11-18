/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 07-05 · countdown-timer
 * Lessons: all of Module 07, especially 07.3 (refs), 07.6 (timers)
 * Run:     npm run watch 07-05
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build `ActionTimer`, the repeating progress timer at the heart of every
 * idle-game action ("Chop oak tree: 2.5s").
 *
 * Props: label, durationMs, repeat (default false), onComplete
 *
 * Render:
 *   <section aria-label={label}>
 *     <progress aria-label={`${label} progress`} max={1} value={fraction elapsed, 0..1} />
 *     <output aria-label="Time left">{seconds left, toFixed(1)}s</output>     e.g. "2.5s"
 *     a <p>Done!</p> when it finished (non-repeating only)
 *     ONE main button whose text depends on the status:
 *       idle or done → "Start"     running → "Pause"     paused → "Resume"
 *     a "Reset" button: back to idle with the full duration left
 *
 * Behaviour:
 *   - Tick every 100ms while running (use an interval with cleanup, or your
 *     useInterval from 07-03 copied into this file).
 *   - MEASURE TIME WITH Date.now() TIMESTAMPS, not by counting ticks. Elapsed
 *     time must only accumulate while running: pausing for 10 seconds must not
 *     use up any of the timer.
 *   - When elapsed ≥ duration: call onComplete() exactly once for that cycle, then
 *       repeat=true  → immediately start the next cycle (keep running)
 *       repeat=false → stop with status "done": 0.0s left, progress 1, "Done!"
 *   - Starting again from "done" begins a fresh cycle.
 *   - No interval may run while idle, paused or done, and none after unmount.
 *   - Works under <StrictMode>.
 *
 * (Tests use fake timers, which also fake Date.now(), so use Date.now().)
 */

export type ActionTimerProps = {
  label: string;
  durationMs: number;
  repeat?: boolean;
  onComplete: () => void;
};

export function ActionTimer(props: ActionTimerProps) {
  return null; // TODO
}
