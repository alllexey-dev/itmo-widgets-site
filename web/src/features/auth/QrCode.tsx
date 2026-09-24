import { create } from 'qrcode';
import { useMemo } from 'react';
import styles from './QrCode.module.css';

/** The quiet zone scanners need around the symbol, in modules. */
const MARGIN = 2;

/** One SVG path with a horizontal run per row of dark modules. */
function modulePath(value: string): { size: number; path: string } {
  const { modules } = create(value, { errorCorrectionLevel: 'M' });
  const runs: string[] = [];
  for (let row = 0; row < modules.size; row += 1) {
    let start = -1;
    for (let col = 0; col <= modules.size; col += 1) {
      const dark = col < modules.size && modules.data[row * modules.size + col] === 1;
      if (dark && start < 0) start = col;
      if (!dark && start >= 0) {
        runs.push(`M${start + MARGIN} ${row + MARGIN}h${col - start}v1h${start - col}z`);
        start = -1;
      }
    }
  }
  return { size: modules.size + MARGIN * 2, path: runs.join('') };
}

export interface QrCodeProps {
  value: string;
  label: string;
}

/** Always dark on light, whatever the theme: not every scanner reads inverted codes. */
export function QrCode({ value, label }: QrCodeProps) {
  const { size, path } = useMemo(() => modulePath(value), [value]);
  return (
    <svg
      className={styles.qr}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} className={styles.background} />
      <path d={path} className={styles.modules} />
    </svg>
  );
}
