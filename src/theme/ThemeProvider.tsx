import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StorageKeys, storage } from '../storage/mmkv';
import { Theme, darkTheme, lightTheme } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => (storage.getString(StorageKeys.themePreference) as ThemePreference) ?? 'system',
  );

  const setPreference = useCallback((pref: ThemePreference) => {
    storage.set(StorageKeys.themePreference, pref);
    setPreferenceState(pref);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedDark =
      preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
    return { theme: resolvedDark ? darkTheme : lightTheme, preference, setPreference };
  }, [preference, systemScheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
