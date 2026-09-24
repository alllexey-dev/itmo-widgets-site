import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { DEFAULT_PAGE_SIZE, type AdminPage } from '../../api/admin';
import { api } from '../../api/client';
import { errorText } from '../../api/errors';
import {
  ErrorState,
  formatDateTime,
  Icon,
  PageHeader,
  Pagination,
  Table,
  type TableColumn,
} from '../../ui';
import styles from './AuditPage.module.css';

/** `AdminAuditEntry`. */
export interface AuditEntry {
  id: string;
  action: string;
  target: string;
  details: string | null;
  createdAt: string;
  actorIsu: number;
  actorName: string;
}

const ACTIONS: Record<string, { label: string; icon: string }> = {
  ROLE_GRANTED: { label: 'Выдана роль', icon: 'person_add' },
  ROLE_REVOKED: { label: 'Снята роль', icon: 'person_remove' },
  MODERATION_SETTINGS_CHANGED: { label: 'Правила модерации', icon: 'tune' },
  APP_VERSION_CHANGED: { label: 'Версия приложения', icon: 'system_update' },
};

const TARGETS: Record<string, string> = {
  'moderation-settings': 'Настройки модерации',
  'app-version': 'Версия приложения',
};

function Target({ target }: { target: string }) {
  const user = /^user:(\d+)$/.exec(target);
  if (user) return <Link to={`/admin/users/${user[1]}`}>ИСУ {user[1]}</Link>;
  return <>{TARGETS[target] ?? target}</>;
}

const COLUMNS: TableColumn<AuditEntry>[] = [
  {
    key: 'time',
    header: 'Когда',
    width: 160,
    render: (entry) => <span className={styles.nowrap}>{formatDateTime(entry.createdAt)}</span>,
  },
  {
    key: 'actor',
    header: 'Кто',
    render: (entry) => (
      <span className={styles.actor}>
        <Link to={`/admin/users/${entry.actorIsu}`}>{entry.actorName}</Link>
        <span className={styles.muted}>ИСУ {entry.actorIsu}</span>
      </span>
    ),
  },
  {
    key: 'action',
    header: 'Действие',
    render: (entry) => {
      const action = ACTIONS[entry.action];
      return (
        <span className={styles.action}>
          <Icon name={action?.icon ?? 'history'} size={20} />
          {action?.label ?? entry.action}
        </span>
      );
    },
  },
  { key: 'target', header: 'Объект', render: (entry) => <Target target={entry.target} /> },
  {
    key: 'details',
    header: 'Подробности',
    render: (entry) =>
      entry.details ? (
        <code className={styles.details}>{entry.details}</code>
      ) : (
        <span className={styles.muted}>—</span>
      ),
  },
];

export function AuditPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(0, Number(params.get('page')) || 0);
  const audit = useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: ({ signal }) =>
      api.get<AdminPage<AuditEntry>>('/api/admin/audit', {
        query: { page, size: DEFAULT_PAGE_SIZE },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Журнал"
        description="Роли, правила модерации и версия приложения: кто и когда менял"
      />
      {audit.isError ? (
        <ErrorState
          title="Не удалось загрузить журнал"
          description={errorText(audit.error, 'Попробуйте ещё раз.')}
          onRetry={() => void audit.refetch()}
          retrying={audit.isFetching}
        />
      ) : (
        <>
          <Table
            caption="Журнал"
            columns={COLUMNS}
            rows={audit.data?.items ?? []}
            rowKey={(entry) => entry.id}
            loading={audit.isPending}
            maxHeight="none"
            empty={{ icon: 'history', title: 'Записей пока нет' }}
          />
          {audit.data && (
            <Pagination
              page={page}
              size={DEFAULT_PAGE_SIZE}
              total={audit.data.total}
              onChange={(next) =>
                setParams(next > 0 ? { page: String(next) } : {}, { replace: false })
              }
            />
          )}
        </>
      )}
    </>
  );
}
