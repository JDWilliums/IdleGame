// Reference solution for 14-02. Read it only AFTER your own version passes.
import { useEffect, useRef } from 'react';
import type { StoreApi } from 'zustand/vanilla';

export type TransientProgressBarProps<S> = {
  store: StoreApi<S>;
  selectFraction: (state: S) => number;
  label: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function TransientProgressBar<S>({ store, selectFraction, label }: TransientProgressBarProps<S>) {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const latestSelect = useRef(selectFraction);

  useEffect(() => {
    latestSelect.current = selectFraction;
  });

  useEffect(() => {
    const apply = (state: S) => {
      const fraction = clamp01(latestSelect.current(state));
      fillRef.current?.style.setProperty('--progress', String(fraction));
      barRef.current?.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
    };
    apply(store.getState()); // paint the current value straight away
    return store.subscribe(apply); // the unsubscribe function is the cleanup
  }, [store]);

  return (
    <div ref={barRef} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100}>
      <div ref={fillRef} data-testid="progress-fill" style={{ transform: 'scaleX(var(--progress))' }} />
    </div>
  );
}
