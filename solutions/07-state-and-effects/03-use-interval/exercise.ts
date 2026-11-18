// Reference solution for 07-03. Read it only AFTER your own version passes.
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  // After every render, remember the latest callback. No dependency array on
  // purpose: this must run after EVERY render.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Set up the interval. It only restarts when `delay` changes.
  useEffect(() => {
    if (delay === null) return; // paused: no interval, nothing to clean up
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/*
  The same hook with React 19.2's useEffectEvent:

  export function useInterval(callback: () => void, delay: number | null) {
    const onTick = useEffectEvent(callback);
    useEffect(() => {
      if (delay === null) return;
      const id = setInterval(() => onTick(), delay);
      return () => clearInterval(id);
    }, [delay]);
  }
*/
