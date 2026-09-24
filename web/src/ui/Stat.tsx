import { useId, type ReactNode } from 'react';
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

/** A labelled figure; the group is named by its label for assistive technology. */
export function Stat({ label, value, caption, icon, className }: StatProps) {
  const labelId = useId();
  return (
    <div className={cx(styles.stat, className)} role="group" aria-labelledby={labelId}>
      <div className={styles.label}>
        {icon && <Icon name={icon} size={20} />}
        <span id={labelId}>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
