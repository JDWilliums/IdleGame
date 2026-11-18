// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { TransientProgressBar } from './exercise';

type S = { progress: number; other: number };
const makeStore = (progress = 0.25) => createStore<S>()(() => ({ progress, other: 0 }));

const fill = () => screen.getByTestId('progress-fill');
const bar = () => screen.getByRole('progressbar', { name: 'Chop oak tree' });

describe('TransientProgressBar', () => {
  it('renders an accessible bar showing the current value on mount', () => {
    render(<TransientProgressBar store={makeStore(0.25)} selectFraction={(s) => s.progress} label="Chop oak tree" />);
    expect(bar()).toHaveAttribute('aria-valuemin', '0');
    expect(bar()).toHaveAttribute('aria-valuemax', '100');
    expect(bar()).toHaveAttribute('aria-valuenow', '25');
    expect(fill().style.getPropertyValue('--progress')).toBe('0.25');
    expect(fill().style.transform).toBe('scaleX(var(--progress))');
  });

  it('updates the DOM on store changes', () => {
    const store = makeStore();
    render(<TransientProgressBar store={store} selectFraction={(s) => s.progress} label="Chop oak tree" />);
    act(() => store.setState({ progress: 0.426 }));
    expect(fill().style.getPropertyValue('--progress')).toBe('0.426');
    expect(bar()).toHaveAttribute('aria-valuenow', '43');
  });

  it('clamps to 0..1', () => {
    const store = makeStore();
    render(<TransientProgressBar store={store} selectFraction={(s) => s.progress} label="Chop oak tree" />);
    act(() => store.setState({ progress: 1.7 }));
    expect(fill().style.getPropertyValue('--progress')).toBe('1');
    act(() => store.setState({ progress: -0.2 }));
    expect(fill().style.getPropertyValue('--progress')).toBe('0');
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders exactly once, however many updates happen', () => {
    const store = makeStore();
    const onRender = vi.fn();
    render(
      <Profiler id="bar" onRender={onRender}>
        <TransientProgressBar store={store} selectFraction={(s) => s.progress} label="Chop oak tree" />
      </Profiler>,
    );
    for (let i = 1; i <= 50; i++) act(() => store.setState({ progress: i / 50 }));
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(fill().style.getPropertyValue('--progress')).toBe('1');
  });

  it('uses the latest selector without resubscribing', () => {
    const store = makeStore();
    const subscribe = vi.spyOn(store, 'subscribe');
    const { rerender } = render(
      <TransientProgressBar store={store} selectFraction={(s) => s.progress} label="Chop oak tree" />,
    );
    rerender(<TransientProgressBar store={store} selectFraction={(s) => s.other} label="Chop oak tree" />);
    act(() => store.setState({ progress: 0.9, other: 0.1 }));
    expect(fill().style.getPropertyValue('--progress')).toBe('0.1');
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const store = makeStore();
    const unsubscribe = vi.fn();
    const realSubscribe = store.subscribe;
    vi.spyOn(store, 'subscribe').mockImplementation((listener) => {
      const off = realSubscribe(listener);
      return () => {
        unsubscribe();
        off();
      };
    });
    const { unmount } = render(
      <TransientProgressBar store={store} selectFraction={(s) => s.progress} label="Chop oak tree" />,
    );
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(() => store.setState({ progress: 0.5 })).not.toThrow();
  });
});
