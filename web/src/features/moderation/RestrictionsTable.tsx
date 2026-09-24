import { useState } from 'react';
import { Link } from 'react-router';
import type { AdminRestriction } from '../../api/admin';
import { errorText } from '../../api/errors';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  formatDate,
  Icon,
  Table,
  useToast,
  type BadgeTone,
  type TableColumn,
} from '../../ui';
import { useRevokeRestriction } from './api';
import { CAPABILITIES } from './labels';
import styles from './RestrictionsTable.module.css';

function restrictionState(restriction: AdminRestriction): { label: string; tone: BadgeTone } {
  if (restriction.active) return { label: 'Действует', tone: 'warning' };
  if (restriction.revokedAt) return { label: 'Снято', tone: 'neutral' };
  return { label: 'Истекло', tone: 'neutral' };
}

function term(restriction: AdminRestriction): string {
  const from = formatDate(restriction.startsAt);
  const end = restriction.revokedAt ?? restriction.expiresAt;
  return end ? `${from} — ${formatDate(end)}` : `с ${from}, бессрочно`;
}

export interface RestrictionsTableProps {
  caption: string;
  rows: readonly AdminRestriction[];
  loading?: boolean;
  /** Hidden on a user card, where the user is already known. */
  showUser?: boolean;
  empty: { title: string; description?: string };
}

/** Restrictions with «Снять» behind a confirmation; used by the restrictions page and user cards. */
export function RestrictionsTable({
  caption,
  rows,
  loading,
  showUser = true,
  empty,
}: RestrictionsTableProps) {
  const toast = useToast();
  const revoke = useRevokeRestriction();
  const [confirming, setConfirming] = useState<AdminRestriction | null>(null);

  const columns: TableColumn<AdminRestriction>[] = [
    ...(showUser
      ? [
          {
            key: 'user',
            header: 'Пользователь',
            render: (row: AdminRestriction) => (
              <span className={styles.user}>
                <Avatar name={row.user.name} src={row.user.pictureUrl} size={32} decorative />
                <span className={styles.userText}>
                  <span className={styles.name}>{row.user.name}</span>
                  <span className={styles.muted}>ИСУ {row.user.isu}</span>
                </span>
              </span>
            ),
          },
        ]
      : []),
    {
      key: 'capability',
      header: 'Что запрещено',
      render: (row) => CAPABILITIES[row.capability],
    },
    {
      key: 'reason',
      header: 'Причина',
      render: (row) => <span className={styles.reason}>{row.reason}</span>,
    },
    { key: 'term', header: 'Срок', render: term },
    {
      key: 'state',
      header: 'Состояние',
      render: (row) => {
        const state = restrictionState(row);
        return <Badge tone={state.tone}>{state.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: <span className="visually-hidden">Действия</span>,
      align: 'end',
      render: (row) => (
        <span className={styles.actions}>
          <Link
            to={`/admin/moderation?case=${encodeURIComponent(row.caseId)}`}
            className={styles.caseLink}
            aria-label={`Заявка: ${row.user.name}, ${CAPABILITIES[row.capability]}`}
            title="Заявка"
          >
            <Icon name="gavel" size={20} />
          </Link>
          {row.active && (
            <Button
              variant="text"
              size="small"
              onClick={() => setConfirming(row)}
              aria-label={`Снять ограничение: ${row.user.name}, ${CAPABILITIES[row.capability]}`}
            >
              Снять
            </Button>
          )}
        </span>
      ),
    },
  ];

  const confirm = () => {
    if (!confirming) return;
    revoke.mutate(confirming.id, {
      onSuccess: () => {
        toast.show({ message: 'Ограничение снято', tone: 'success' });
        setConfirming(null);
      },
      onError: (error) =>
        toast.show({ message: errorText(error, 'Не удалось снять ограничение'), tone: 'error' }),
    });
  };

  return (
    <>
      <Table
        caption={caption}
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        empty={{ icon: 'verified_user', ...empty }}
        maxHeight="none"
      />
      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={confirm}
        title="Снять ограничение?"
        description={
          confirming
            ? `${confirming.user.name} снова сможет: ${CAPABILITIES[confirming.capability].toLowerCase()}.`
            : undefined
        }
        confirmLabel="Снять"
        loading={revoke.isPending}
      />
    </>
  );
}
