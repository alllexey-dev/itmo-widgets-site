import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './Field.module.css';

export interface FieldFrameProps {
  id: string;
  label: ReactNode;
  /** Keeps the label for assistive technology only, e.g. a search field with an icon. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  /** Right side of the footer, e.g. a character counter. */
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Label, control and hint or error shared by the text fields and the select. */
export function FieldFrame({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  disabled,
  aside,
  className,
  children,
}: FieldFrameProps) {
  const footer = error || hint || aside;
  return (
    <div
      className={cx(
        styles.field,
        Boolean(error) && styles.invalid,
        disabled && styles.disabled,
        className,
      )}
    >
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : styles.label}>
        {label}
      </label>
      {children}
      {footer && (
        <div className={styles.footer}>
          {error ? (
            <span id={`${id}-error`} className={styles.error}>
              {error}
            </span>
          ) : (
            hint && (
              <span id={`${id}-hint`} className={styles.hint}>
                {hint}
              </span>
            )
          )}
          {aside}
        </div>
      )}
    </div>
  );
}
