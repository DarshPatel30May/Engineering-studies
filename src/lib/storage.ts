/**
 * Small localStorage layer with React hooks. All keys are namespaced ("hsc-eng:") and every read
 * is wrapped in try/catch so the app still works in private mode or when storage is blocked.
 */
import { useCallback, useEffect, useState } from 'react';

const NS = 'hsc-eng:';
const EVT = 'hsc-eng-storage';

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep in memory only */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

/** useState that persists to localStorage and stays in sync across components/tabs. */
export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readStore(key, fallback));
  useEffect(() => {
    const onChange = (e: Event) => {
      const k = (e as CustomEvent).detail ?? (e as StorageEvent).key?.replace(NS, '');
      if (k === key) setValue(readStore(key, fallback));
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(readStore(key, fallback)) : v;
      writeStore(key, next);
      setValue(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

export interface Prefs {
  theme?: 'light' | 'dark';
  mode: 'beginner' | 'advanced';
  visualOnly: boolean;
}
export const DEFAULT_PREFS: Prefs = { mode: 'beginner', visualOnly: false };

/** Practice attempt record. */
export interface Attempt {
  qid: string;
  module: string;
  topic: string;
  score: number;
  max: number;
  at: number;
}

export function exportAll(): string {
  const out: Record<string, unknown> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(NS)) out[k] = JSON.parse(localStorage.getItem(k)!);
    }
  } catch {
    /* ignore */
  }
  return JSON.stringify(out, null, 2);
}

export function resetAll() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith(NS) && k !== NS + 'prefs') keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: '*' }));
  window.location.reload();
}
