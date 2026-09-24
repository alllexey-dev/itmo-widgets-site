import styles from './Spinner.module.css';
import { cx } from './cx';

export interface SpinnerProps {
  size?: number;
  /** Accessible label; without it the spinner is decorative. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 24, label, className }: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, className)}
      style={{ width: size, height: size }}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
