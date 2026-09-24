import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

function isVisible(): boolean {
  return document.visibilityState !== 'hidden';
}

/** False while the tab is in the background. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribe, isVisible, () => true);
}
