import { useEffect, useRef } from 'react';
import { Badge, cx, Icon, Skeleton, formatRelative } from '../../ui';
import { CATEGORIES, hostOf, REASONS } from './labels';
import styles from './CaseList.module.css';
import type { AdminCaseItem } from './types';

export interface CaseListProps {
  items: readonly AdminCaseItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function caseTitle(item: Pick<AdminCaseItem, 'revision'>): string {
  const revision = item.revision;
  if (!revision) return 'Ссылка удалена';
  return revision.title?.trim() || hostOf(revision.url) || revision.url;
}

export function CaseList({ items, selectedId, onSelect }: CaseListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!selectedId) return;
    const selected = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    selected?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);

  return (
    <ul ref={listRef} className={styles.list} aria-label="Заявки">
      {items.map((item) => (
        <li key={item.id}>
          <CaseRow
            item={item}
            selected={item.id === selectedId}
            onSelect={() => onSelect(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function CaseRow({
  item,
  selected,
  onSelect,
}: {
  item: AdminCaseItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const category = item.revision ? CATEGORIES[item.revision.category] : null;
  const reason = REASONS[item.reason];
  const host = item.revision ? hostOf(item.revision.url) : null;
  const time = item.status === 'OPEN' ? item.openedAt : (item.resolvedAt ?? item.openedAt);
  return (
    <button
      type="button"
      className={cx(styles.row, selected && styles.selected)}
      aria-current={selected ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className={styles.icon}>
        <Icon name={category?.icon ?? 'link_off'} size={20} />
      </span>
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.title}>{caseTitle(item)}</span>
          <Badge tone={reason.tone} className={styles.reason}>
            {reason.label}
          </Badge>
        </span>
        <span className={styles.line}>
          {[item.link?.subjectName, host].filter(Boolean).join(' · ') || 'Нет данных'}
        </span>
        <span className={styles.meta}>
          {item.author && <span className={styles.author}>{item.author.name}</span>}
          <span>{formatRelative(time)}</span>
          {item.reportCount > 0 && (
            <span className={styles.reports}>
              <Icon name="flag" size={18} />
              {item.reportCount}
              <span className="visually-hidden"> жалоб</span>
            </span>
          )}
          {item.link?.hidden && <span className={styles.hidden}>скрыта</span>}
        </span>
      </span>
    </button>
  );
}

export function CaseListSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-label="Загружаем заявки">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={styles.skeletonRow}>
          <Skeleton shape="circle" />
          <div className={styles.skeletonText}>
            <Skeleton shape="text" width="70%" />
            <Skeleton shape="text" width="45%" />
          </div>
        </div>
      ))}
    </div>
  );
}
