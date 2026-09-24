import type { ReactNode } from 'react';
import styles from './Stat.module.css';
import { cx } from './cx';
import { Icon } from './Icon';

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Secondary line: a period, a delta or a hint. */
  caption?: ReactNode;
  icon?: string;
  className?: string;
}

export function Stat({ label, value, caption, icon, className }: StatProps) {
  return (
    <div className={cx(styles.stat, className)}>
      <div className={styles.label}>
        {icon && <Icon name={icon} size={20} />}
        <span>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
