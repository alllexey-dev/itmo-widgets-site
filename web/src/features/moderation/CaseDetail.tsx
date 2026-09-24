import { useState } from 'react';
import { ApiError } from '../../api/client';
import { errorText } from '../../api/errors';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  formatDateTime,
  IconButton,
  Kbd,
  Skeleton,
  SkeletonText,
  useToast,
} from '../../ui';
import { useAccess } from '../auth/useSession';
import { useCase, useDecision } from './api';
import {
  AuthorSection,
  ChangesSection,
  DecisionsTimeline,
  LinkPreview,
  ReportsSection,
} from './CaseSections';
import { HideAllDialog, RejectDialog, RestrictDialog } from './DecisionDialogs';
import { ACTIONS, CASE_STATUSES, periodLabel, REASONS } from './labels';
import styles from './CaseDetail.module.css';
import type { DecisionRequest, ModerationCase, SubjectLinkTarget } from './types';
import { useShortcuts } from './useShortcuts';

type OpenDialog = 'reject' | 'restrict' | 'hideAll' | null;

export interface CaseDetailProps {
  caseId: string;
  /** Shown on narrow screens, where the detail replaces the list. */
  onBack?: () => void;
  onDecided: (updated: ModerationCase) => void;
}

export function CaseDetail({ caseId, onBack, onDecided }: CaseDetailProps) {
  const query = useCase(caseId);

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    const missing = query.error instanceof ApiError && query.error.code === 'not_found';
    return (
      <div className={styles.detail}>
        {onBack && <BackButton onBack={onBack} />}
        {missing ? (
          <EmptyState icon="search_off" title="Заявка не найдена" />
        ) : (
          <ErrorState
            title="Не удалось загрузить заявку"
            description={errorText(query.error, 'Попробуйте ещё раз.')}
            onRetry={() => void query.refetch()}
            retrying={query.isFetching}
          />
        )}
      </div>
    );
  }
  // A new key per case resets dialogs and the pending decision when the selection moves.
  return <CaseView key={query.data.id} data={query.data} onBack={onBack} onDecided={onDecided} />;
}

function BackButton({ onBack }: { onBack: () => void }) {
  return <IconButton icon="arrow_back" label="К списку" className={styles.back} onClick={onBack} />;
}

function CaseView({
  data,
  onBack,
  onDecided,
}: {
  data: ModerationCase;
  onBack?: () => void;
  onDecided: (updated: ModerationCase) => void;
}) {
  const canOpenProfile = useAccess('admin');
  const toast = useToast();
  const decision = useDecision(data.id);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const target = data.target;
  const open = data.status === 'OPEN' && target !== null;

  const decide = (request: DecisionRequest) => {
    decision.mutate(request, {
      onSuccess: (updated) => {
        setDialog(null);
        toast.show({ message: ACTIONS[request.action].done, tone: 'success' });
        onDecided(updated);
      },
      onError: (error) =>
        toast.show({
          message: errorText(error, 'Не удалось сохранить решение', {
            business_rule_violation: 'Заявка уже закрыта',
            invalid_request_data: 'Проверьте причину и срок',
          }),
          tone: 'error',
        }),
    });
  };

  useShortcuts(
    {
      KeyA: () => decide({ action: 'APPROVE' }),
      KeyR: () => setDialog('reject'),
    },
    open && !decision.isPending && dialog === null,
  );

  const reason = REASONS[data.reason];
  const status = CASE_STATUSES[data.status];
  return (
    <article className={styles.detail} aria-labelledby="case-title">
      <header className={styles.header}>
        {onBack && <BackButton onBack={onBack} />}
        <div className={styles.headerText}>
          <div className={styles.badges}>
            <Badge tone={reason.tone} icon={reason.icon}>
              {reason.label}
            </Badge>
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className={styles.muted}>с {formatDateTime(data.openedAt)}</span>
          </div>
          <h2 id="case-title" className={styles.title}>
            {target ? target.link.subjectName : 'Ссылка удалена'}
          </h2>
          {target && <p className={styles.muted}>{periodLabel(target.link.periodKey)}</p>}
        </div>
      </header>

      {target ? (
        <>
          <CaseActions
            open={open}
            target={target}
            saving={decision.isPending}
            pendingAction={decision.isPending ? decision.variables.action : null}
            onDecide={decide}
            onOpenDialog={setDialog}
          />
          <LinkPreview target={target} />
          <ChangesSection target={target} />
          <AuthorSection target={target} canOpenProfile={canOpenProfile} />
          <ReportsSection reports={target.reports} />
        </>
      ) : (
        <p className={styles.note}>Автор удалил ссылку; остались только решения.</p>
      )}
      <DecisionsTimeline decisions={data.decisions} />

      {target && dialog === 'reject' && (
        <RejectDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={decide}
          saving={decision.isPending}
        />
      )}
      {target && dialog === 'restrict' && (
        <RestrictDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={decide}
          saving={decision.isPending}
          authorName={target.author.name}
        />
      )}
      {target && dialog === 'hideAll' && (
        <HideAllDialog
          open
          onClose={() => setDialog(null)}
          onSubmit={decide}
          saving={decision.isPending}
          authorName={target.author.name}
        />
      )}
    </article>
  );
}

function CaseActions({
  open,
  target,
  saving,
  pendingAction,
  onDecide,
  onOpenDialog,
}: {
  open: boolean;
  target: SubjectLinkTarget;
  saving: boolean;
  pendingAction: DecisionRequest['action'] | null;
  onDecide: (request: DecisionRequest) => void;
  onOpenDialog: (dialog: OpenDialog) => void;
}) {
  const hidden = target.link.status === 'HIDDEN';
  const restore = (
    <Button
      variant={open ? 'text' : 'tonal'}
      icon="visibility"
      loading={pendingAction === 'RESTORE'}
      disabled={saving}
      onClick={() => onDecide({ action: 'RESTORE' })}
    >
      Вернуть
    </Button>
  );
  if (!open) {
    return hidden ? (
      <div className={styles.actions} role="group" aria-label="Действия">
        {restore}
      </div>
    ) : null;
  }
  return (
    <div className={styles.actions} role="group" aria-label="Действия">
      <div className={styles.mainActions}>
        <Button
          icon="check"
          loading={pendingAction === 'APPROVE'}
          disabled={saving}
          onClick={() => onDecide({ action: 'APPROVE' })}
          aria-keyshortcuts="A"
        >
          Одобрить
        </Button>
        <Button
          variant="tonal"
          danger
          icon="close"
          disabled={saving}
          onClick={() => onOpenDialog('reject')}
          aria-keyshortcuts="R"
        >
          Отклонить
        </Button>
      </div>
      <div className={styles.moreActions}>
        {hidden ? (
          restore
        ) : (
          <Button
            variant="text"
            icon="visibility_off"
            loading={pendingAction === 'HIDE'}
            disabled={saving}
            onClick={() => onDecide({ action: 'HIDE' })}
          >
            Скрыть
          </Button>
        )}
        {target.reports.length > 0 && (
          <Button
            variant="text"
            icon="flag"
            loading={pendingAction === 'DISMISS'}
            disabled={saving}
            onClick={() => onDecide({ action: 'DISMISS' })}
          >
            Отклонить жалобы
          </Button>
        )}
        <Button
          variant="text"
          icon="block"
          disabled={saving}
          onClick={() => onOpenDialog('restrict')}
        >
          Ограничить
        </Button>
        <Button
          variant="text"
          danger
          icon="hide_source"
          disabled={saving}
          onClick={() => onOpenDialog('hideAll')}
        >
          Скрыть всё у автора
        </Button>
      </div>
    </div>
  );
}

export function ShortcutHint() {
  return (
    <p className={styles.hint}>
      <span>
        <Kbd>J</Kbd> <Kbd>K</Kbd> следующая и предыдущая
      </span>
      <span>
        <Kbd>A</Kbd> одобрить
      </span>
      <span>
        <Kbd>R</Kbd> отклонить
      </span>
    </p>
  );
}

function DetailSkeleton() {
  return (
    <div className={styles.detail} role="status" aria-label="Загружаем заявку">
      <Skeleton shape="text" width="30%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={48} />
      <Skeleton height={140} />
      <SkeletonText lines={4} />
    </div>
  );
}
