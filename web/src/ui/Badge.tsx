import type { ReactNode } from 'react';
import styles from './Badge.module.css';
import { cx } from './cx';
import { Icon } from './Icon';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  /** Always a word or a number: a status is never shown by colour alone. */
  children: ReactNode;
  tone?: BadgeTone;
  icon?: string;
  className?: string;
}

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </span>
  );
}
