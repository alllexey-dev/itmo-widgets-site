import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './Field.module.css';
import { FieldFrame } from './FieldFrame';
import { describedBy } from './fieldIds';
import { Icon } from './Icon';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Replaces the hint and marks the field invalid. */
  error?: ReactNode;
  /** Leading Material Symbols icon, e.g. `search`. */
  icon?: string;
  /** Inside the field on the right, e.g. a clear button. */
  trailing?: ReactNode;
  className?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel, hint, error, icon, trailing, className, id, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FieldFrame
      id={inputId}
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={styles.control}>
        {icon && <Icon name={icon} size={20} className={styles.leading} />}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error })}
          {...rest}
        />
        {trailing && <div className={styles.trailing}>{trailing}</div>}
      </div>
    </FieldFrame>
  );
});
