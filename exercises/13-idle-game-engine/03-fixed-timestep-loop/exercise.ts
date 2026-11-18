/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 13-03 · fixed-timestep-loop
 * Lesson:  13.4 The game loop
 * Run:     npm run watch 13-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build the game loop: a fixed-timestep accumulator with capped catch-up. It
 * doesn't schedule itself. The app calls `frame()` from setInterval, and
 * tests call it by hand with a fake clock. That makes it 100% testable.
 *
 * createGameLoop(options) returns { start, stop, frame, isRunning }
 *
 *   start()   Starts the loop: remember `now()` as the last frame time and
 *             reset the accumulator to 0. Calling start() while running does nothing.
 *   stop()    Stops the loop. While stopped, frame() does nothing.
 *             (Starting again must NOT simulate the time spent stopped. That's
 *              offline progress's job.)
 *   frame()   If running:
 *               1. elapsed = now() − last frame time (a negative value counts as 0)
 *               2. add elapsed to the accumulator
 *               3. while accumulator ≥ stepMs AND fewer than maxStepsPerFrame
 *                  steps have run this frame: call update(stepMs), subtract stepMs
 *               4. if the cap was hit and accumulator is still ≥ stepMs:
 *                  drop the whole steps that are left (keep the fractional
 *                  remainder) and call onDroppedTime(droppedMs) if provided
 *               5. call render(accumulator / stepMs) if provided (alpha 0..1)
 *   isRunning()  true between start() and stop().
 */

export type GameLoopOptions = {
  stepMs: number;
  maxStepsPerFrame: number;
  now: () => number;
  update: (stepMs: number) => void;
  render?: (alpha: number) => void;
  onDroppedTime?: (droppedMs: number) => void;
};

export type GameLoop = {
  start: () => void;
  stop: () => void;
  frame: () => void;
  isRunning: () => boolean;
};

export function createGameLoop(options: GameLoopOptions): GameLoop {
  throw new Error('Not implemented yet');
}
