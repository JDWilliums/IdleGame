// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSingleTabGuard, usePageLifecycle, type LockStorage } from './exercise';

describe('usePageLifecycle', () => {
  let visibility: DocumentVisibilityState = 'visible';
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });
  afterEach(() => vi.restoreAllMocks());

  const setVisibility = (next: DocumentVisibilityState) => {
    visibility = next;
    document.dispatchEvent(new Event('visibilitychange'));
  };

  const handlers = () => ({ onHidden: vi.fn(), onVisible: vi.fn(), onPageHide: vi.fn() });

  it('calls onHidden / onVisible / onPageHide', () => {
    const h = handlers();
    renderHook(() => usePageLifecycle(h));
    setVisibility('hidden');
    expect(h.onHidden).toHaveBeenCalledTimes(1);
    setVisibility('visible');
    expect(h.onVisible).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event('pagehide'));
    expect(h.onPageHide).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callbacks without re-registering', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const first = handlers();
    const second = handlers();
    const { rerender } = renderHook(({ h }) => usePageLifecycle(h), { initialProps: { h: first } });
    rerender({ h: second });
    setVisibility('hidden');
    expect(first.onHidden).not.toHaveBeenCalled();
    expect(second.onHidden).toHaveBeenCalledTimes(1);
    expect(add.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
  });

  it('removes its listeners on unmount', () => {
    const h = handlers();
    const { unmount } = renderHook(() => usePageLifecycle(h));
    unmount();
    setVisibility('hidden');
    window.dispatchEvent(new Event('pagehide'));
    expect(h.onHidden).not.toHaveBeenCalled();
    expect(h.onPageHide).not.toHaveBeenCalled();
  });
});

function memoryStorage(): LockStorage & { dump: () => Map<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => map,
  };
}

describe('createSingleTabGuard', () => {
  let time = 100_000;
  const now = () => time;
  const storage = memoryStorage();
  const guard = (id: string) => createSingleTabGuard({ storage, key: 'game-lock', id, now, timeoutMs: 10_000 });

  beforeEach(() => {
    time = 100_000;
    storage.dump().clear();
  });

  it('acquires a free lock and stores a record', () => {
    const a = guard('tab-a');
    expect(a.tryAcquire()).toBe(true);
    expect(JSON.parse(storage.getItem('game-lock')!)).toEqual({ ownerId: 'tab-a', heartbeatAt: 100_000 });
    expect(a.isOwner()).toBe(true);
  });

  it('refuses while another tab holds a fresh lock', () => {
    const a = guard('tab-a');
    const b = guard('tab-b');
    a.tryAcquire();
    time += 5_000;
    expect(b.tryAcquire()).toBe(false);
    expect(b.isOwner()).toBe(false);
  });

  it('takes over a stale lock', () => {
    guard('tab-a').tryAcquire();
    time += 10_001; // tab A stopped heartbeating
    expect(guard('tab-b').tryAcquire()).toBe(true);
  });

  it('heartbeats keep the lock fresh', () => {
    const a = guard('tab-a');
    const b = guard('tab-b');
    a.tryAcquire();
    for (let i = 0; i < 5; i++) {
      time += 3_000;
      expect(a.heartbeat()).toBe(true);
    }
    expect(b.tryAcquire()).toBe(false);
  });

  it('heartbeat reports losing the lock to a takeover', () => {
    const a = guard('tab-a');
    const b = guard('tab-b');
    a.tryAcquire();
    b.takeOver();
    expect(b.isOwner()).toBe(true);
    expect(a.heartbeat()).toBe(false);
    expect(a.isOwner()).toBe(false);
  });

  it('release only removes our own lock', () => {
    const a = guard('tab-a');
    const b = guard('tab-b');
    a.tryAcquire();
    b.release(); // not ours: must not remove it
    expect(a.isOwner()).toBe(true);
    a.release();
    expect(storage.getItem('game-lock')).toBeNull();
    expect(b.tryAcquire()).toBe(true);
  });

  it('treats a corrupt record as free', () => {
    storage.setItem('game-lock', '{not json');
    expect(guard('tab-a').tryAcquire()).toBe(true);
  });

  it('re-acquiring our own lock refreshes it', () => {
    const a = guard('tab-a');
    a.tryAcquire();
    time += 4_000;
    expect(a.tryAcquire()).toBe(true);
    expect(JSON.parse(storage.getItem('game-lock')!).heartbeatAt).toBe(104_000);
  });
});
