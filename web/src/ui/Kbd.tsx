import type { ReactNode } from 'react';
import styles from './Kbd.module.css';

/** A key cap for shortcut hints. */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}
