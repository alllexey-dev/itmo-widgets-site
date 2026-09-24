import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses';
import { cx } from './cx';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading Material Symbols icon. */
  icon?: string;
  /** Shows a spinner, keeps the width and blocks clicks. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Red text and container for destructive actions. */
  danger?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'filled',
    size = 'medium',
    icon,
    loading = false,
    fullWidth = false,
    danger = false,
    type = 'button',
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        buttonClasses({ variant, size, fullWidth, danger }),
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner size={18} className={styles.spinner} />
      ) : (
        icon && <Icon name={icon} size={size === 'small' ? 18 : 20} />
      )}
      <span className={styles.label}>{children}</span>
    </button>
  );
});
