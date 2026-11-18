// Reference solution for 13-03. Read it only AFTER your own version passes.

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
  const { stepMs, maxStepsPerFrame, now, update, render, onDroppedTime } = options;
  let running = false;
  let last = 0;
  let accumulator = 0;

  return {
    start() {
      if (running) return;
      running = true;
      last = now();
      accumulator = 0;
    },
    stop() {
      running = false;
    },
    isRunning: () => running,
    frame() {
      if (!running) return;
      const current = now();
      const elapsed = Math.max(0, current - last);
      last = current;
      accumulator += elapsed;

      let steps = 0;
      while (accumulator >= stepMs && steps < maxStepsPerFrame) {
        update(stepMs);
        accumulator -= stepMs;
        steps++;
      }

      if (accumulator >= stepMs) {
        // The cap was hit: hand the backlog of whole steps to offline progress instead.
        const remainder = accumulator % stepMs;
        onDroppedTime?.(accumulator - remainder);
        accumulator = remainder;
      }

      render?.(accumulator / stepMs);
    },
  };
}
