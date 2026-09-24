import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx } from './cx';
import styles from './Field.module.css';
import { FieldFrame } from './FieldFrame';
import { describedBy } from './fieldIds';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Shows «n / max» under the field; the limit itself is not enforced by the browser. */
  maxLength?: number;
  value: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, maxLength, value, className, id, disabled, rows = 3, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const over = maxLength !== undefined && value.length > maxLength;
  return (
    <FieldFrame
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      disabled={disabled}
      className={className}
      aside={
        maxLength !== undefined && (
          <span className={cx(styles.counter, over && styles.counterOver)} aria-hidden>
            {value.length} / {maxLength}
          </span>
        )
      }
    >
      <div className={styles.control}>
        <textarea
          ref={ref}
          id={inputId}
          className={styles.textarea}
          rows={rows}
          value={value}
          disabled={disabled}
          aria-invalid={error || over ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error })}
          {...rest}
        />
      </div>
    </FieldFrame>
  );
});
