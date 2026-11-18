/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 07-04 · use-local-storage
 * Lesson:  07.7 Custom hooks (and 03.3 for storage, 02.7 for validation)
 * Run:     npm run watch 07-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write a production-quality `useLocalStorage` hook. It works like useState,
 * but the value survives page reloads:
 *
 *   const [volume, setVolume] = useLocalStorage('settings.volume', 0.8, { validate: isNumber });
 *
 * Requirements:
 *   1. Initial value: read localStorage[key] ONCE (lazy initializer), JSON-parsed.
 *      Fall back to `initialValue` if the key is missing, the JSON is corrupt,
 *      or `options.validate` exists and returns false.
 *   2. Whenever the value changes, write JSON.stringify(value) to localStorage[key].
 *   3. setValue accepts a value OR an updater function, exactly like useState.
 *      (Tip: React's own setter already supports both, so you can return it as-is.)
 *   4. If localStorage.setItem throws (storage full / private mode), the hook
 *      must keep working in memory. Don't crash.
 *   5. Cross-tab sync: listen for the window 'storage' event. When an event for
 *      THIS key arrives, update the value (parse + validate newValue; if
 *      newValue is null the key was removed, so use initialValue). Ignore other
 *      keys. Remove the listener on unmount.
 *
 * Return a readonly tuple: [value, setValue].
 */
import type { Dispatch, SetStateAction } from 'react';

export type UseLocalStorageOptions<T> = {
  validate?: (value: unknown) => value is T;
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {},
): readonly [T, Dispatch<SetStateAction<T>>] {
  throw new Error('Not implemented yet');
}
