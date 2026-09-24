import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, readStoredTheme, ThemeContext, type ThemePreference } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setState] = useState<ThemePreference>(readStoredTheme);

  const setPreference = useCallback((next: ThemePreference) => {
    applyTheme(next);
    setState(next);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
