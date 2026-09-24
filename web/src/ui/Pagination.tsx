import { cx } from './cx';
import { formatNumber } from './format';
import { IconButton } from './IconButton';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** Zero-based, as the backend pages are. */
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

/** «21–40 из 134» with previous and next; hidden when everything fits on one page. */
export function Pagination({ page, size, total, onChange, className }: PaginationProps) {
  if (total <= size && page === 0) return null;
  const pages = Math.max(1, Math.ceil(total / size));
  const from = Math.min(total, page * size + 1);
  const to = Math.min(total, (page + 1) * size);
  return (
    <nav className={cx(styles.pagination, className)} aria-label="Страницы">
      <span className={styles.range} aria-live="polite">
        {formatNumber(from)}–{formatNumber(to)} из {formatNumber(total)}
      </span>
      <IconButton
        icon="chevron_left"
        label="Предыдущая страница"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
      />
      <IconButton
        icon="chevron_right"
        label="Следующая страница"
        disabled={page >= pages - 1}
        onClick={() => onChange(page + 1)}
      />
    </nav>
  );
}
