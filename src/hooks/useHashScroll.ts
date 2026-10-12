import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** With HashRouter the "#anchor" lives in location.hash after the route; scroll to it once rendered. */
export function useHashScroll(deps: unknown[] = []) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const t = setInterval(() => {
      const el = document.getElementById(id);
      if (el || ++tries > 20) {
        clearInterval(t);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, ...deps]);
}
