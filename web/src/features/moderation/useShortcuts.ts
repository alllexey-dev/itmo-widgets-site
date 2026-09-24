import { useEffect, useRef } from 'react';

/**
 * Single-key shortcuts by `KeyboardEvent.code` (`KeyJ`), so they work in the
 * Russian layout too. Ignored while typing, with modifiers or under a dialog.
 */
export function useShortcuts(handlers: Record<string, () => void>, enabled = true) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target) || document.querySelector('[role="dialog"]')) return;
      const handler = handlersRef.current[event.code];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
