/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 08-02 · settings-context
 * Lesson:  08.2 Context
 * Run:     npm run watch 08-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a settings system with TWO contexts: one for the settings values, and
 * one for the actions. Components that only use actions must NOT re-render
 * when settings change (a test checks this with React's <Profiler>).
 *
 * TASK 1 · SettingsProvider({ children, initial = defaultSettings })
 *   Holds the settings in state and provides both contexts.
 *
 * TASK 2 · useSettings(): Settings
 *   Reads the settings context. If there's no provider, throw an Error with
 *   the message "useSettings must be used within a SettingsProvider".
 *
 * TASK 3 · useSettingsActions(): SettingsActions
 *   Reads the actions context. If there's no provider, throw
 *   "useSettingsActions must be used within a SettingsProvider".
 *   The actions object must keep the SAME identity across renders.
 *     setVolume(v)          clamps v to 0..1
 *     toggleTheme()         dark ↔ light
 *     setReducedMotion(b)
 *     reset()               back to the provider's `initial`
 *
 * TASK 4 · Components (all use the hooks, not props):
 *   VolumeSlider     <input type="range" aria-label="Volume" min={0} max={1} step={0.1} value=…>
 *   ThemeToggle      <button> with text "Switch to light theme" when dark,
 *                    or "Switch to dark theme" when light
 *   SettingsSummary  <p>Volume {percent}% · {theme} theme{, reduced motion}</p>
 *                    e.g. "Volume 80% · dark theme"
 *                         "Volume 30% · light theme · reduced motion"
 *   ResetButton      <button>Reset settings</button>. Uses ONLY the actions hook.
 */
import type { ReactNode } from 'react';

export type Settings = {
  volume: number;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
};

export type SettingsActions = {
  setVolume: (volume: number) => void;
  toggleTheme: () => void;
  setReducedMotion: (enabled: boolean) => void;
  reset: () => void;
};

export const defaultSettings: Settings = { volume: 0.8, theme: 'dark', reducedMotion: false };

export function SettingsProvider({ children, initial = defaultSettings }: { children: ReactNode; initial?: Settings }) {
  return <>{children}</>; // TODO
}

export function useSettings(): Settings {
  throw new Error('Not implemented yet');
}

export function useSettingsActions(): SettingsActions {
  throw new Error('Not implemented yet');
}

export function VolumeSlider() {
  return null; // TODO
}

export function ThemeToggle() {
  return null; // TODO
}

export function SettingsSummary() {
  return null; // TODO
}

export function ResetButton() {
  return null; // TODO
}
