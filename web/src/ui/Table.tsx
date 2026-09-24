import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import styles from './Table.module.css';
import { cx } from './cx';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  width?: CSSProperties['width'];
  align?: 'start' | 'end' | 'center';
}

export interface TableProps<Row> {
  /** Accessible name of the table. */
  caption: string;
  columns: TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  loading?: boolean;
  /** Shown instead of rows when there are none. */
  empty?: { title: ReactNode; description?: ReactNode; icon?: string };
  onRowClick?: (row: Row) => void;
  selectedKey?: string | null;
  /** The table scrolls inside this height so the header stays visible. */
  maxHeight?: CSSProperties['maxHeight'];
  className?: string;
}

const SKELETON_ROWS = 5;

export function Table<Row>({
  caption,
  columns,
  rows,
  rowKey,
  loading = false,
  empty = { title: 'Пусто' },
  onRowClick,
  selectedKey,
  maxHeight = '70vh',
  className,
}: TableProps<Row>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: Row) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick?.(row);
    }
  };

  return (
    <div className={cx(styles.wrapper, className)} style={{ maxHeight }}>
      <table className={styles.table} aria-busy={loading || undefined}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={styles[column.align ?? 'start']}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <tr key={`skeleton-${index}`}>
                {columns.map((column) => (
                  <td key={column.key}>
                    <Skeleton shape="text" width="70%" />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                <EmptyState compact {...empty} />
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => {
              const key = rowKey(row);
              const selected = selectedKey === key;
              return (
                <tr
                  key={key}
                  className={cx(onRowClick && styles.clickable, selected && styles.selected)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (event) => handleKeyDown(event, row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-selected={onRowClick ? selected : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={styles[column.align ?? 'start']}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
