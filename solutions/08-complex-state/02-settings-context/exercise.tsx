// Reference solution for 08-02. Read it only AFTER your own version passes.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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

// Not exported: all access goes through the hooks.
const SettingsContext = createContext<Settings | null>(null);
const SettingsActionsContext = createContext<SettingsActions | null>(null);

export function SettingsProvider({ children, initial = defaultSettings }: { children: ReactNode; initial?: Settings }) {
  const [settings, setSettings] = useState(initial);

  // The actions only use setSettings (stable) and `initial`, so they keep the same
  // identity unless `initial` itself changes. Consumers of this context never
  // re-render because of settings changes.
  const actions = useMemo<SettingsActions>(
    () => ({
      setVolume: (volume) => setSettings((s) => ({ ...s, volume: Math.min(1, Math.max(0, volume)) })),
      toggleTheme: () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setReducedMotion: (reducedMotion) => setSettings((s) => ({ ...s, reducedMotion })),
      reset: () => setSettings(initial),
    }),
    [initial],
  );

  return (
    <SettingsActionsContext value={actions}>
      <SettingsContext value={settings}>{children}</SettingsContext>
    </SettingsActionsContext>
  );
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (settings === null) throw new Error('useSettings must be used within a SettingsProvider');
  return settings;
}

export function useSettingsActions(): SettingsActions {
  const actions = useContext(SettingsActionsContext);
  if (actions === null) throw new Error('useSettingsActions must be used within a SettingsProvider');
  return actions;
}

export function VolumeSlider() {
  const { volume } = useSettings();
  const { setVolume } = useSettingsActions();
  return (
    <input
      type="range"
      aria-label="Volume"
      min={0}
      max={1}
      step={0.1}
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
    />
  );
}

export function ThemeToggle() {
  const { theme } = useSettings();
  const { toggleTheme } = useSettingsActions();
  return (
    <button type="button" onClick={toggleTheme}>
      Switch to {theme === 'dark' ? 'light' : 'dark'} theme
    </button>
  );
}

export function SettingsSummary() {
  const { volume, theme, reducedMotion } = useSettings();
  return (
    <p>
      Volume {Math.round(volume * 100)}% · {theme} theme{reducedMotion ? ' · reduced motion' : ''}
    </p>
  );
}

export function ResetButton() {
  const { reset } = useSettingsActions(); // actions only, so it never re-renders on settings changes
  return (
    <button type="button" onClick={reset}>
      Reset settings
    </button>
  );
}
