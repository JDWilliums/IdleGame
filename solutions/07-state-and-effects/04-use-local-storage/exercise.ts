// Reference solution for 07-04. Read it only AFTER your own version passes.
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

export type UseLocalStorageOptions<T> = {
  validate?: (value: unknown) => value is T;
};

function parse<T>(raw: string | null, fallback: T, validate?: (v: unknown) => v is T): T {
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (validate && !validate(value)) return fallback;
    return value as T; // without a validator we trust our own earlier writes
  } catch {
    return fallback;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): readonly [T, Dispatch<SetStateAction<T>>] {
  const { validate } = options;
  const [value, setValue] = useState<T>(() =>
    parse(localStorage.getItem(key), initialValue, validate),
  );

  // Write whenever the value changes: localStorage is an external system.
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Full, or unavailable (private mode). Keep working in memory.
    }
  }, [key, value]);

  // The storage listener needs the latest initialValue/validate without
  // re-subscribing every render (callers often pass inline functions/objects).
  const latest = useRef({ initialValue, validate });
  useEffect(() => {
    latest.current = { initialValue, validate };
  });

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key) return;
      const { initialValue: fallback, validate: check } = latest.current;
      if (event.newValue === null) {
        setValue(fallback);
        return;
      }
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (!check || check(next)) setValue(next as T);
      } catch {
        // ignore corrupt values from other tabs
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue] as const;
}
