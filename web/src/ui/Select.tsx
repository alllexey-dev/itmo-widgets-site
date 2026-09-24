import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import styles from './Field.module.css';
import { FieldFrame } from './FieldFrame';
import { describedBy } from './fieldIds';
import { Icon } from './Icon';

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
}

export interface SelectProps<Value extends string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: readonly SelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
}

/** A native select: the platform list works with the keyboard and on phones. */
export function Select<Value extends string>({
  label,
  hint,
  error,
  options,
  value,
  onChange,
  className,
  id,
  disabled,
  ...rest
}: SelectProps<Value>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <FieldFrame
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={styles.control}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { hint, error })}
          onChange={(event) => onChange(event.target.value as Value)}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="expand_more" size={20} className={styles.chevron} />
      </div>
    </FieldFrame>
  );
}
