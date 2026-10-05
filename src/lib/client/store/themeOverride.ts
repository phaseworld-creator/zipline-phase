/**
 * Per-session (in-memory, non-persisted) dark/light mode override.
 * When null, the global theme from SettingsStore applies.
 */
import { create } from 'zustand';

export type ThemeOverrideStore = {
  /** 'dark' | 'light' | null (use global default) */
  override: 'dark' | 'light' | null;
  setOverride: (mode: 'dark' | 'light' | null) => void;
  toggle: () => void;
};

export const useThemeOverrideStore = create<ThemeOverrideStore>()((set, get) => ({
  override: null,
  setOverride: (mode) => set({ override: mode }),
  toggle: () => {
    const current = get().override;
    set({ override: current === 'dark' ? 'light' : 'dark' });
  },
}));
