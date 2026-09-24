import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import { Icon } from './Icon';
import styles from './Switch.module.css';

export interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** A labelled on/off row; the whole label toggles it. */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: SwitchProps) {
  const id = useId();
  return (
    <div className={cx(styles.row, disabled && styles.disabled, className)}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className={styles.description}>
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        className={cx(styles.switch, checked && styles.on)}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb}>{checked && <Icon name="check" size={18} />}</span>
      </button>
    </div>
  );
}
