import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { DEFAULT_PAGE_SIZE } from '../../api/admin';
import { errorText } from '../../api/errors';
import {
  Avatar,
  ErrorState,
  formatDate,
  formatNumber,
  IconButton,
  PageHeader,
  Pagination,
  plural,
  Table,
  TextField,
  useDebouncedValue,
  type TableColumn,
} from '../../ui';
import { useUsers } from './api';
import { RoleBadges } from './roles';
import type { AdminUserItem } from './types';
import styles from './UsersPage.module.css';

const QUERY_LIMIT = 100;

const COLUMNS: TableColumn<AdminUserItem>[] = [
  {
    key: 'name',
    header: 'Пользователь',
    render: (user) => (
      <span className={styles.user}>
        <Avatar name={user.name} src={user.pictureUrl} size={32} decorative />
        <span className={styles.name}>{user.name}</span>
      </span>
    ),
  },
  { key: 'isu', header: 'ИСУ', align: 'end', render: (user) => user.isu },
  {
    key: 'group',
    header: 'Группа',
    render: (user) => user.groups[0]?.name ?? <span className={styles.muted}>—</span>,
  },
  {
    key: 'roles',
    header: 'Роли',
    render: (user) =>
      user.roles.length > 0 ? (
        <span className={styles.roles}>
          <RoleBadges roles={user.roles} />
        </span>
      ) : (
        <span className={styles.muted}>—</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'Регистрация',
    align: 'end',
    render: (user) => formatDate(user.createdAt),
  },
];

export function UsersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('q') ?? '');
  const query = useDebouncedValue(text.trim());
  const page = Math.max(0, Number(params.get('page')) || 0);
  const users = useUsers({ query, page, size: DEFAULT_PAGE_SIZE });

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) =>
          value === null ? next.delete(key) : next.set(key, value),
        );
        return next;
      },
      { replace: true },
    );

  const search = (value: string) => {
    setText(value);
    update({ q: value.trim() || null, page: null });
  };

  const total = users.data?.total;

  return (
    <>
      <PageHeader title="Пользователи" description="Поиск по ИСУ, имени или группе" />
      <div className={styles.toolbar}>
        <TextField
          className={styles.search}
          label="Поиск"
          hideLabel
          icon="search"
          placeholder="ИСУ, имя или группа"
          autoComplete="off"
          maxLength={QUERY_LIMIT}
          value={text}
          onChange={(event) => search(event.target.value)}
          trailing={text && <IconButton icon="close" label="Очистить" onClick={() => search('')} />}
        />
        {total !== undefined && (
          <span className={styles.total} aria-live="polite">
            {formatNumber(total)} {plural(total, ['пользователь', 'пользователя', 'пользователей'])}
          </span>
        )}
      </div>
      {users.isError ? (
        <ErrorState
          title="Не удалось загрузить пользователей"
          description={errorText(users.error, 'Попробуйте ещё раз.')}
          onRetry={() => void users.refetch()}
          retrying={users.isFetching}
        />
      ) : (
        <>
          <Table
            caption="Пользователи"
            columns={COLUMNS}
            rows={users.data?.items ?? []}
            rowKey={(user) => String(user.isu)}
            loading={users.isPending}
            onRowClick={(user) => void navigate(`/admin/users/${user.isu}`)}
            maxHeight="none"
            empty={{
              icon: 'person_search',
              title: 'Никого не нашли',
              description: query ? 'Проверьте запрос: ИСУ, часть имени или группы.' : undefined,
            }}
          />
          {users.data && (
            <Pagination
              page={page}
              size={DEFAULT_PAGE_SIZE}
              total={users.data.total}
              onChange={(next) => update({ page: next > 0 ? String(next) : null })}
            />
          )}
        </>
      )}
    </>
  );
}
