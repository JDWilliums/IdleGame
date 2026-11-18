// @vitest-environment jsdom
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Profiler, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import {
  ResetButton,
  SettingsProvider,
  SettingsSummary,
  ThemeToggle,
  useSettings,
  useSettingsActions,
  VolumeSlider,
  type Settings,
} from './exercise';

let consoleError: MockInstance;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

function App({ initial }: { initial?: Settings }) {
  return (
    <SettingsProvider {...(initial ? { initial } : {})}>
      <SettingsSummary />
      <VolumeSlider />
      <ThemeToggle />
      <ResetButton />
    </SettingsProvider>
  );
}

const summary = () => screen.getByText(/^Volume/);

describe('hooks outside a provider', () => {
  it('useSettings throws a helpful error', () => {
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used within a SettingsProvider',
    );
  });
  it('useSettingsActions throws a helpful error', () => {
    expect(() => renderHook(() => useSettingsActions())).toThrow(
      'useSettingsActions must be used within a SettingsProvider',
    );
  });
});

describe('settings components', () => {
  it('shows the default settings', () => {
    render(<App />);
    expect(summary()).toHaveTextContent('Volume 80% · dark theme');
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('0.8');
  });

  it('accepts custom initial settings', () => {
    render(<App initial={{ volume: 0.3, theme: 'light', reducedMotion: true }} />);
    expect(summary()).toHaveTextContent('Volume 30% · light theme · reduced motion');
  });

  it('shares state: the slider updates the summary', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.3' } });
    expect(summary()).toHaveTextContent('Volume 30%');
  });

  it('toggles the theme', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(summary()).toHaveTextContent('light theme');
    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(summary()).toHaveTextContent('dark theme');
  });

  it('resets to the initial settings', async () => {
    render(<App />);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.1' } });
    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset settings' }));
    expect(summary()).toHaveTextContent('Volume 80% · dark theme');
  });
});

describe('actions', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <SettingsProvider>{children}</SettingsProvider>;

  it('clamps volume to 0..1', () => {
    const { result } = renderHook(() => ({ settings: useSettings(), actions: useSettingsActions() }), { wrapper });
    fireEventAct(() => result.current.actions.setVolume(5));
    expect(result.current.settings.volume).toBe(1);
    fireEventAct(() => result.current.actions.setVolume(-1));
    expect(result.current.settings.volume).toBe(0);
  });

  it('keeps the same actions object across renders', () => {
    const { result } = renderHook(() => ({ settings: useSettings(), actions: useSettingsActions() }), { wrapper });
    const first = result.current.actions;
    fireEventAct(() => result.current.actions.setReducedMotion(true));
    expect(result.current.settings.reducedMotion).toBe(true);
    expect(result.current.actions).toBe(first);
  });

  it('does not re-render action-only components when settings change', () => {
    const onRender = vi.fn();
    render(
      <SettingsProvider>
        <VolumeSlider />
        <Profiler id="reset" onRender={onRender}>
          <ResetButton />
        </Profiler>
      </SettingsProvider>,
    );
    const rendersBefore = onRender.mock.calls.length;
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.2' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.4' } });
    expect(onRender.mock.calls.length).toBe(rendersBefore);
  });
});

// renderHook results update inside act(); this tiny helper keeps the tests readable.
import { act } from '@testing-library/react';
function fireEventAct(fn: () => void) {
  act(fn);
}
