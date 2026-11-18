// Reference solution for 14-03. Read it only AFTER your own version passes.
import { useEffect, useRef } from 'react';

export type LifecycleHandlers = {
  onHidden: () => void;
  onVisible: () => void;
  onPageHide: () => void;
};

export function usePageLifecycle(handlers: LifecycleHandlers): void {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') latest.current.onHidden();
      else latest.current.onVisible();
    };
    const onPageHide = () => latest.current.onPageHide();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);
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

type LockRecord = { ownerId: string; heartbeatAt: number };

function isLockRecord(value: unknown): value is LockRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ownerId' in value &&
    typeof value.ownerId === 'string' &&
    'heartbeatAt' in value &&
    typeof value.heartbeatAt === 'number'
  );
}

export function createSingleTabGuard({ storage, key, id, now, timeoutMs }: SingleTabGuardOptions): SingleTabGuard {
  function read(): LockRecord | null {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isLockRecord(parsed) ? parsed : null; // corrupt → treat as free
    } catch {
      return null;
    }
  }

  function write() {
    storage.setItem(key, JSON.stringify({ ownerId: id, heartbeatAt: now() } satisfies LockRecord));
  }

  const isStale = (record: LockRecord) => now() - record.heartbeatAt > timeoutMs;

  return {
    tryAcquire() {
      const record = read();
      if (record === null || isStale(record) || record.ownerId === id) {
        write();
        return true;
      }
      return false;
    },
    heartbeat() {
      if (read()?.ownerId !== id) return false; // someone took over (or the lock vanished)
      write();
      return true;
    },
    isOwner: () => read()?.ownerId === id,
    takeOver: write,
    release() {
      if (read()?.ownerId === id) storage.removeItem(key);
    },
  };
}
