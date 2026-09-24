import { forwardRef, type ButtonHTMLAttributes } from 'react';
import styles from './IconButton.module.css';
import { cx } from './cx';
import { Icon } from './Icon';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: string;
  /** Accessible name, also shown as a tooltip. */
  label: string;
  selected?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, selected = false, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(styles.iconButton, selected && styles.selected, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} filled={selected} />
    </button>
  );
});
