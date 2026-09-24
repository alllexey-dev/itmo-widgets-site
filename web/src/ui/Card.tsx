import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';
import { cx } from './cx';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** `outlined` adds a quiet stroke instead of a filled surface. */
  variant?: 'filled' | 'outlined';
  /** `large` is for summaries: 20 px padding instead of 16. */
  padding?: 'none' | 'normal' | 'large';
  as?: 'div' | 'section' | 'article';
  children?: ReactNode;
}

export function Card({
  variant = 'filled',
  padding = 'normal',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag className={cx(styles.card, styles[variant], styles[padding], className)} {...rest}>
      {children}
    </Tag>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, subtitle, actions }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
