import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';
import { cx } from './cx';

export interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  /** `circle` for avatars, `text` for a line of text. */
  shape?: 'rect' | 'text' | 'circle';
  className?: string;
}

export function Skeleton({ width, height, shape = 'rect', className }: SkeletonProps) {
  return (
    <span
      className={cx(styles.skeleton, styles[shape], className)}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span className={styles.lines} aria-hidden>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} shape="text" width={index === lines - 1 ? '60%' : '100%'} />
      ))}
    </span>
  );
}
