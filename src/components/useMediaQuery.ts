import { useEffect, useState } from 'react';

/**
 * Track whether a CSS media query matches, reactively. SSR / test-safe: when
 * `matchMedia` is unavailable (node / happy-dom) it returns `false`, so the
 * desktop layout is the default — the responsive branches only kick in in a real
 * browser at the given width.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sync in case the query changed between render and effect
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
