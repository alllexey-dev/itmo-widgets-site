import type { ReactNode } from 'react';
import styles from './Chip.module.css';
import { cx } from './cx';
import { Icon } from './Icon';

export interface ChipProps {
  children: ReactNode;
  icon?: string;
  /** Filter chips: shows a check and a selected container. */
  selected?: boolean;
  /** Makes the chip a toggle button; without it the chip is static text. */
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Chip({ children, icon, selected, onClick, disabled, className }: ChipProps) {
  const leading = selected ? 'check' : icon;
  const content = (
    <>
      {leading && <Icon name={leading} size={18} />}
      <span>{children}</span>
    </>
  );
  const classes = cx(styles.chip, selected && styles.selected, className);

  if (!onClick) return <span className={classes}>{content}</span>;
  return (
    <button
      type="button"
      className={cx(classes, styles.interactive)}
      aria-pressed={selected ?? undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}
