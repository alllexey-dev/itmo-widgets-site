import type { ReactNode } from 'react';
import { Badge } from './Badge';
import { cx } from './cx';
import styles from './DiffView.module.css';

export interface DiffRow {
  key: string;
  label: string;
  before: ReactNode;
  after: ReactNode;
  changed: boolean;
}

export interface DiffViewProps {
  caption: string;
  rows: readonly DiffRow[];
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

/** Two versions side by side; a changed row says so in words, not only in colour. */
export function DiffView({
  caption,
  rows,
  beforeLabel = 'Было',
  afterLabel = 'Стало',
  className,
}: DiffViewProps) {
  return (
    <table className={cx(styles.diff, className)}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className={styles.fieldHead}>
            <span className="visually-hidden">Поле</span>
          </th>
          <th scope="col">{beforeLabel}</th>
          <th scope="col">{afterLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className={cx(row.changed && styles.changed)}>
            <th scope="row" className={styles.field}>
              <span>{row.label}</span>
              {row.changed && (
                <Badge tone="warning" className={styles.badge}>
                  изменено
                </Badge>
              )}
            </th>
            <td className={styles.before} data-label={beforeLabel}>
              {row.before}
            </td>
            <td className={styles.after} data-label={afterLabel}>
              {row.after}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
