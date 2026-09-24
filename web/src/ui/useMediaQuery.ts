import { useCallback, useSyncExternalStore } from 'react';

/** Whether the media query matches; [fallback] where `matchMedia` is missing (tests). */
export function useMediaQuery(query: string, fallback = true): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const read = () =>
    typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : fallback;
  return useSyncExternalStore(subscribe, read, () => fallback);
}
