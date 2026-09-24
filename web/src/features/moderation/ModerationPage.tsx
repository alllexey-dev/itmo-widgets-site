import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { errorText } from '../../api/errors';
import {
  Card,
  Chip,
  cx,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Tabs,
  useMediaQuery,
} from '../../ui';
import { prefetchCase, QUEUE_PAGE_SIZE, useCases, useOpenCaseCount, type CaseFilter } from './api';
import { CaseDetail, ShortcutHint } from './CaseDetail';
import { CaseList, CaseListSkeleton } from './CaseList';
import { REASONS } from './labels';
import styles from './ModerationPage.module.css';
import type { CaseReason, CaseStatus, ModerationCase } from './types';
import { useShortcuts } from './useShortcuts';

const WIDE_QUERY = '(min-width: 1024px)';
const REASON_VALUES = Object.keys(REASONS) as CaseReason[];

function readFilter(params: URLSearchParams): CaseFilter {
  const reason = params.get('reason');
  const page = Number(params.get('page'));
  return {
    status: params.get('status') === 'RESOLVED' ? 'RESOLVED' : 'OPEN',
    reason: REASON_VALUES.includes(reason as CaseReason) ? (reason as CaseReason) : null,
    page: Number.isInteger(page) && page > 0 ? page : 0,
    size: QUEUE_PAGE_SIZE,
  };
}

export function ModerationPage() {
  const [params, setParams] = useSearchParams();
  const filter = readFilter(params);
  const wide = useMediaQuery(WIDE_QUERY);
  const client = useQueryClient();
  const cases = useCases(filter);
  const openCount = useOpenCaseCount();
  const items = useMemo(() => cases.data?.items ?? [], [cases.data]);

  const requestedId = params.get('case');
  // On a wide screen the first case opens by itself; on a phone the list comes first.
  const selectedId = requestedId ?? (wide ? (items[0]?.id ?? null) : null);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);

  const update = useCallback(
    (changes: Record<string, string | null>, replace = false) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) =>
            value === null ? next.delete(key) : next.set(key, value),
          );
          return next;
        },
        { replace },
      ),
    [setParams],
  );

  const select = useCallback((id: string | null) => update({ case: id }, true), [update]);

  const move = (step: number) => {
    const target = items[selectedIndex < 0 ? 0 : selectedIndex + step];
    if (target) select(target.id);
  };

  useShortcuts({ KeyJ: () => move(1), KeyK: () => move(-1) }, items.length > 0);

  const nextId = items[selectedIndex + 1]?.id ?? null;
  useEffect(() => {
    if (nextId) void prefetchCase(client, nextId);
  }, [client, nextId]);

  const handleDecided = (updated: ModerationCase) => {
    if (filter.status !== 'OPEN' || updated.status === 'OPEN') return;
    const neighbour = items[selectedIndex + 1] ?? items[selectedIndex - 1] ?? null;
    select(neighbour?.id ?? null);
  };

  const showDetail = selectedId !== null;

  return (
    <>
      <PageHeader
        title="Модерация"
        description="Новые ссылки, жалобы и ссылки с низким рейтингом"
        actions={wide ? <ShortcutHint /> : undefined}
      />
      <div className={styles.toolbar}>
        <Tabs<CaseStatus>
          label="Заявки"
          tabs={[
            { value: 'OPEN', label: 'Открытые', count: openCount.data },
            { value: 'RESOLVED', label: 'Решённые' },
          ]}
          value={filter.status}
          onChange={(status) =>
            update({ status: status === 'OPEN' ? null : status, page: null, case: null })
          }
        />
        <div className={styles.filters} role="group" aria-label="Причина">
          <Chip
            selected={filter.reason === null}
            onClick={() => update({ reason: null, page: null, case: null })}
          >
            Все
          </Chip>
          {REASON_VALUES.map((reason) => (
            <Chip
              key={reason}
              selected={filter.reason === reason}
              onClick={() => update({ reason, page: null, case: null })}
            >
              {REASONS[reason].label}
            </Chip>
          ))}
        </div>
      </div>

      <div className={cx(styles.layout, showDetail && styles.showDetail)}>
        <Card padding="none" as="section" className={styles.queue} aria-label="Очередь">
          {cases.isPending ? (
            <CaseListSkeleton />
          ) : cases.isError ? (
            <ErrorState
              compact
              title="Не удалось загрузить заявки"
              description={errorText(cases.error, 'Попробуйте ещё раз.')}
              onRetry={() => void cases.refetch()}
              retrying={cases.isFetching}
            />
          ) : items.length === 0 ? (
            <EmptyState
              compact
              icon={filter.status === 'OPEN' ? 'task_alt' : 'inbox'}
              title={filter.status === 'OPEN' ? 'Очередь пуста' : 'Решённых заявок нет'}
              description={filter.status === 'OPEN' ? 'Новые заявки появятся здесь.' : undefined}
            />
          ) : (
            <>
              <CaseList items={items} selectedId={selectedId} onSelect={select} />
              <Pagination
                className={styles.pagination}
                page={filter.page}
                size={filter.size}
                total={cases.data.total}
                onChange={(page) => update({ page: page > 0 ? String(page) : null, case: null })}
              />
            </>
          )}
        </Card>
        <Card padding="none" as="section" className={styles.detail} aria-label="Заявка">
          {selectedId ? (
            <CaseDetail caseId={selectedId} onBack={() => select(null)} onDecided={handleDecided} />
          ) : (
            <EmptyState
              icon="gavel"
              title={cases.isPending || items.length > 0 ? 'Выберите заявку' : 'Здесь пока пусто'}
            />
          )}
        </Card>
      </div>
    </>
  );
}
