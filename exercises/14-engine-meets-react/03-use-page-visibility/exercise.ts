/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 14-03 · use-page-visibility
 * Lesson:  14.4 Page lifecycle & multiple tabs
 * Run:     npm run watch 14-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · usePageLifecycle({ onHidden, onVisible, onPageHide })
 *   - Listen to document 'visibilitychange' (call onHidden or onVisible based
 *     on document.visibilityState) and window 'pagehide' (call onPageHide).
 *   - Register the listeners ONCE (on mount). Always call the LATEST callbacks.
 *   - Remove both listeners on unmount.
 *
 * TASK 2 · createSingleTabGuard(options): a heartbeat-based lock in storage,
 *   so only one tab runs the game. The lock record is stored as JSON:
 *     { "ownerId": string, "heartbeatAt": number }
 *   A record is STALE when now() − heartbeatAt > timeoutMs. A missing or
 *   corrupt record counts as no record.
 *
 *   tryAcquire()  If there's no record, it's stale, or it's ours: write
 *                 { ownerId: id, heartbeatAt: now() } and return true.
 *                 Otherwise (another tab's fresh lock) return false.
 *   heartbeat()   If we still own the lock, refresh heartbeatAt and return true.
 *                 If another tab now owns it (or it's gone), return false (we lost it).
 *   isOwner()     true if the stored record's ownerId is ours.
 *   takeOver()    Unconditionally write our own record ("Play here instead").
 *   release()     If we own it, remove the key. Never remove someone else's lock.
 */

export type LifecycleHandlers = {
  onHidden: () => void;
  onVisible: () => void;
  onPageHide: () => void;
};

export function usePageLifecycle(handlers: LifecycleHandlers): void {
  // TODO
}

export type LockStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SingleTabGuardOptions = {
  storage: LockStorage;
  key: string;
  id: string;
  now: () => number;
  timeoutMs: number;
};

export type SingleTabGuard = {
  tryAcquire: () => boolean;
  heartbeat: () => boolean;
  isOwner: () => boolean;
  takeOver: () => void;
  release: () => void;
};

export function createSingleTabGuard(options: SingleTabGuardOptions): SingleTabGuard {
  throw new Error('Not implemented yet');
}
