// Reference solution for 07-05. Read it only AFTER your own version passes.
import { useEffect, useRef, useState } from 'react';

export type ActionTimerProps = {
  label: string;
  durationMs: number;
  repeat?: boolean;
  onComplete: () => void;
};

type Status = 'idle' | 'running' | 'paused' | 'done';

// One state object, because these values always change together (07.2, principle 1).
type TimerState = {
  status: Status;
  /** ms elapsed in this cycle BEFORE the current running stretch */
  banked: number;
  /** Date.now() when the current running stretch began (only meaningful while running) */
  startedAt: number;
  /** last time we looked at the clock; updating it each tick is what re-renders */
  now: number;
};

const TICK_MS = 100;

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function ActionTimer({ label, durationMs, repeat = false, onComplete }: ActionTimerProps) {
  const [timer, setTimer] = useState<TimerState>(() => {
    const now = Date.now();
    return { status: 'idle', banked: 0, startedAt: now, now };
  });

  // Derived values: never stored.
  const elapsed =
    timer.status === 'running' ? timer.banked + (timer.now - timer.startedAt) : timer.banked;
  const clamped = Math.min(elapsed, durationMs);
  const fraction = durationMs > 0 ? clamped / durationMs : 1;
  const secondsLeft = (durationMs - clamped) / 1000;

  useInterval(
    () => {
      const now = Date.now();
      const total = timer.banked + (now - timer.startedAt);
      if (total < durationMs) {
        setTimer((t) => ({ ...t, now }));
        return;
      }
      // This callback runs once per tick (it's an interval, not render), so
      // onComplete fires exactly once per cycle, and it's the latest prop.
      onComplete();
      setTimer(
        repeat
          ? { status: 'running', banked: 0, startedAt: now, now }
          : { status: 'done', banked: durationMs, startedAt: now, now },
      );
    },
    timer.status === 'running' ? TICK_MS : null, // only tick while running
  );

  function handleMain() {
    const now = Date.now();
    setTimer((t) => {
      switch (t.status) {
        case 'idle':
        case 'done':
          return { status: 'running', banked: 0, startedAt: now, now };
        case 'running':
          return { ...t, status: 'paused', banked: t.banked + (now - t.startedAt), now };
        case 'paused':
          return { ...t, status: 'running', startedAt: now, now };
      }
    });
  }

  function handleReset() {
    const now = Date.now();
    setTimer({ status: 'idle', banked: 0, startedAt: now, now });
  }

  const mainLabel =
    timer.status === 'running' ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start';

  return (
    <section aria-label={label}>
      <progress aria-label={`${label} progress`} max={1} value={fraction} />
      <output aria-label="Time left">{secondsLeft.toFixed(1)}s</output>
      {timer.status === 'done' && <p>Done!</p>}
      <button type="button" onClick={handleMain}>
        {mainLabel}
      </button>
      <button type="button" onClick={handleReset}>
        Reset
      </button>
    </section>
  );
}
