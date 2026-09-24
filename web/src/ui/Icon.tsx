import styles from './Icon.module.css';
import { cx } from './cx';

export interface IconProps {
  /** Material Symbols Rounded ligature, e.g. `home`. */
  name: string;
  /** Filled variant, only for a selected or active state. */
  filled?: boolean;
  size?: 18 | 20 | 24 | 32 | 40;
  /** Accessible label; without it the icon is decorative. */
  label?: string;
  className?: string;
}

export function Icon({ name, filled = false, size = 24, label, className }: IconProps) {
  return (
    <span
      className={cx(styles.icon, filled && styles.filled, className)}
      style={{ fontSize: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      translate="no"
    >
      {name}
    </span>
  );
}
