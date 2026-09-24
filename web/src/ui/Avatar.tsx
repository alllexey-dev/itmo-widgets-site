import { useState } from 'react';
import styles from './Avatar.module.css';
import { cx } from './cx';
import { initialsOf } from './initials';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 32 | 40 | 56 | 80;
  /** Hide from assistive technology when the name is already next to it. */
  decorative?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = 40, decorative = false, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': name };

  return (
    <span
      className={cx(styles.avatar, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      {...a11y}
    >
      {showImage && src ? (
        <img
          className={styles.image}
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
