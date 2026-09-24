import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';
import { cx } from './cx';
import { Icon } from './Icon';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, compact && styles.compact, className)}>
      <span className={styles.iconWrap}>
        <Icon name={icon} size={compact ? 24 : 32} />
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
