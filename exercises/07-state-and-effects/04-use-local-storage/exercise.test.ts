// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './exercise';

const isNumber = (v: unknown): v is number => typeof v === 'number';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

function fireStorage(key: string, newValue: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue }));
  });
}

describe('useLocalStorage', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.8);
  });

  it('reads an existing stored value', () => {
    localStorage.setItem('volume', '0.3');
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.3);
  });

  it('reads stored objects', () => {
    localStorage.setItem('settings', JSON.stringify({ theme: 'dark', haptics: false }));
    const { result } = renderHook(() => useLocalStorage('settings', { theme: 'light', haptics: true }));
    expect(result.current[0]).toEqual({ theme: 'dark', haptics: false });
  });

  it('reads storage only once, not on every render', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem');
    const { rerender } = renderHook(() => useLocalStorage('volume', 0.8));
    rerender();
    rerender();
    expect(spy.mock.calls.filter(([key]) => key === 'volume')).toHaveLength(1);
  });

  it('falls back on corrupt JSON', () => {
    localStorage.setItem('volume', '{not json');
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(result.current[0]).toBe(0.8);
  });

  it('falls back when validation fails', () => {
    localStorage.setItem('volume', JSON.stringify('loud'));
    const { result } = renderHook(() => useLocalStorage('volume', 0.8, { validate: isNumber }));
    expect(result.current[0]).toBe(0.8);
  });

  it('writes new values to storage', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    act(() => result.current[1](0.5));
    expect(result.current[0]).toBe(0.5);
    expect(localStorage.getItem('volume')).toBe('0.5');
  });

  it('supports updater functions', () => {
    const { result } = renderHook(() => useLocalStorage('clicks', 0));
    act(() => {
      result.current[1]((n) => n + 1);
      result.current[1]((n) => n + 1);
    });
    expect(result.current[0]).toBe(2);
    expect(localStorage.getItem('clicks')).toBe('2');
  });

  it('keeps working in memory when storage writes fail', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    expect(() => act(() => result.current[1](0.2))).not.toThrow();
    expect(result.current[0]).toBe(0.2);
  });

  it('syncs when another tab changes the same key', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8, { validate: isNumber }));
    fireStorage('volume', '0.1');
    expect(result.current[0]).toBe(0.1);
  });

  it('resets to the initial value when another tab removes the key', () => {
    localStorage.setItem('volume', '0.3');
    const { result } = renderHook(() => useLocalStorage('volume', 0.8));
    fireStorage('volume', null);
    expect(result.current[0]).toBe(0.8);
  });

  it('ignores invalid values and other keys from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('volume', 0.8, { validate: isNumber }));
    fireStorage('volume', '"very loud"');
    fireStorage('theme', '"dark"');
    expect(result.current[0]).toBe(0.8);
  });

  it('removes the storage listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useLocalStorage('volume', 0.8));
    unmount();
    const added = add.mock.calls.filter(([type]) => type === 'storage');
    const removed = remove.mock.calls.filter(([type]) => type === 'storage');
    expect(added.length).toBeGreaterThan(0);
    expect(removed.length).toBe(added.length);
    expect(removed[0]?.[1]).toBe(added[0]?.[1]);
  });
});
