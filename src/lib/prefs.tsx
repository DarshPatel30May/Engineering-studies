import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useStored, DEFAULT_PREFS, type Prefs } from './storage';

interface PrefsCtx {
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  isDark: boolean;
}
const Ctx = createContext<PrefsCtx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setStored] = useStored<Prefs>('prefs', DEFAULT_PREFS);
  const systemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const isDark = prefs.theme ? prefs.theme === 'dark' : !!systemDark;
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  useEffect(() => {
    document.documentElement.classList.toggle('visual-only', !!prefs.visualOnly);
  }, [prefs.visualOnly]);
  const setPrefs = (p: Partial<Prefs>) => setStored((prev) => ({ ...DEFAULT_PREFS, ...prev, ...p }));
  return <Ctx.Provider value={{ prefs: { ...DEFAULT_PREFS, ...prefs }, setPrefs, isDark }}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePrefs outside provider');
  return c;
}
