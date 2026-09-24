import styles from './Button.module.css';
import { cx } from './cx';

export type ButtonVariant = 'filled' | 'tonal' | 'text';
export type ButtonSize = 'medium' | 'small';

export interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  danger?: boolean;
}

/** Button classes for elements that are not <button>, e.g. a router link. */
export function buttonClasses({
  variant = 'filled',
  size = 'medium',
  fullWidth = false,
  danger = false,
}: ButtonLook = {}): string {
  return cx(
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    danger && styles.danger,
  );
}
