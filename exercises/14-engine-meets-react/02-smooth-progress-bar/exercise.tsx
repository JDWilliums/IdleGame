/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 14-02 · smooth-progress-bar
 * Lesson:  14.3 Rendering fast updates
 * Run:     npm run watch 14-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a progress bar that updates on EVERY store change WITHOUT re-rendering
 * React: the "transient updates" pattern. It's generic, so it works with any
 * store and any selector.
 *
 * <TransientProgressBar
 *   store={gameStore}
 *   selectFraction={(s) => s.progress}   // returns 0..1
 *   label="Chop oak tree"
 * />
 *
 * Render (ONCE):
 *   <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={…}>
 *     <div data-testid="progress-fill" style={{ transform: 'scaleX(var(--progress))' }} />
 *   </div>
 *
 * Behaviour:
 *   - Subscribe to `store` in an effect (store.subscribe). On every change, write
 *     the clamped (0..1) fraction to the fill's CSS custom property `--progress`
 *     with style.setProperty, and set aria-valuenow on the bar to the whole
 *     percentage (Math.round(fraction × 100)), all through refs.
 *   - Apply the CURRENT value immediately on mount, not only after the first change.
 *   - The component must render exactly once, however many updates happen.
 *   - Unsubscribe on unmount.
 *   - Always use the LATEST selectFraction prop (callers often pass an inline
 *     arrow), without resubscribing (07.6's latest-ref pattern).
 */
import type { StoreApi } from 'zustand/vanilla';

export type TransientProgressBarProps<S> = {
  store: StoreApi<S>;
  selectFraction: (state: S) => number;
  label: string;
};

export function TransientProgressBar<S>(props: TransientProgressBarProps<S>) {
  return null; // TODO
}
