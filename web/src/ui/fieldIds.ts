import type { ReactNode } from 'react';

/** The id of the hint or error that describes a field. */
export function describedBy(id: string, { hint, error }: { hint?: ReactNode; error?: ReactNode }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
