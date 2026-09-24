import { errorText } from '../../api/errors';
import {
  Badge,
  Card,
  CardHeader,
  ErrorState,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatRelative,
  PageHeader,
  Skeleton,
  Stat,
  Table,
  type TableColumn,
} from '../../ui';
import { useSportStatus } from './api';
import { ERROR_CATEGORIES, OUTCOMES } from './labels';
import styles from './SystemPages.module.css';
import type { SportErrorCategory, SportOutcome, SportRun, SportStatus } from './types';

const RUN_COLUMNS: TableColumn<SportRun>[] = [
  { key: 'time', header: 'Время', render: (run) => formatDateTime(run.timestamp) },
  {
    key: 'outcome',
    header: 'Исход',
    render: (run) => {
      const outcome = OUTCOMES[run.outcome];
      return <Badge tone={outcome.tone}>{outcome.label}</Badge>;
    },
  },
  {
    key: 'duration',
    header: 'Длительность',
    align: 'end',
    render: (run) => formatDuration(run.durationMillis),
  },
  { key: 'received', header: 'Получено', align: 'end', render: (run) => run.receivedLessons },
  { key: 'added', header: 'Новых', align: 'end', render: (run) => run.newLessonsAdded },
  { key: 'updated', header: 'Изменено', align: 'end', render: (run) => run.updatedLessons },
  { key: 'skipped', header: 'Пропущено', align: 'end', render: (run) => run.skippedLessons },
  {
    key: 'error',
    header: 'Ошибка',
    render: (run) =>
      run.errorCategory ? (
        ERROR_CATEGORIES[run.errorCategory]
      ) : (
        <span className={styles.muted}>—</span>
      ),
  },
];

/** The latest run decides the headline state. */
function Health({ runs }: { runs: readonly SportRun[] }) {
  const latest = runs[0];
  if (!latest) return <Badge>Запусков не было</Badge>;
  const outcome = OUTCOMES[latest.outcome];
  const text: Record<SportOutcome, string> = {
    SUCCESS: 'Каталог обновляется',
    PARTIAL: 'Последний запуск с ошибками',
    FAILED: 'Последний запуск упал',
  };
  return (
    <Badge tone={outcome.tone} icon={outcome.icon}>
      {text[latest.outcome]}
    </Badge>
  );
}

export function SportPage() {
  const status = useSportStatus();
  return (
    <>
      <PageHeader
        title="Спорт"
        description="Обновление каталога занятий и очереди записи"
        actions={status.data && <Health runs={status.data.runs} />}
      />
      {status.isPending ? (
        <div className={styles.stack} role="status" aria-label="Загружаем состояние спорта">
          <div className={styles.tiles}>
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} height={108} className={styles.skeleton} />
            ))}
          </div>
          <Skeleton height={320} className={styles.skeleton} />
        </div>
      ) : status.isError ? (
        <ErrorState
          title="Не удалось загрузить состояние спорта"
          description={errorText(status.error, 'Попробуйте ещё раз.')}
          onRetry={() => void status.refetch()}
          retrying={status.isFetching}
        />
      ) : (
        <SportView status={status.data} />
      )}
    </>
  );
}

function SportView({ status }: { status: SportStatus }) {
  const { outcomes7d: outcomes } = status;
  const runs7d = outcomes.SUCCESS + outcomes.PARTIAL + outcomes.FAILED;
  const errors = (Object.keys(ERROR_CATEGORIES) as SportErrorCategory[]).filter(
    (category) => status.errors7d[category] > 0,
  );
  return (
    <div className={styles.stack}>
      <div className={styles.tiles}>
        <Stat
          icon="update"
          label="Последнее успешное"
          value={status.lastSuccessAt ? formatRelative(status.lastSuccessAt) : 'Не было'}
          caption={status.lastSuccessAt ? formatDateTime(status.lastSuccessAt) : undefined}
        />
        <Stat
          icon="sync"
          label="Запуски за 7 дней"
          value={formatNumber(runs7d)}
          caption={`успешно ${outcomes.SUCCESS} · частично ${outcomes.PARTIAL} · сбой ${outcomes.FAILED}`}
        />
        <Stat
          icon="timer"
          label="Средняя длительность"
          value={
            status.averageDurationMillis7d === null
              ? '—'
              : formatDuration(status.averageDurationMillis7d)
          }
          caption="за 7 дней"
        />
        <Stat
          icon="event_available"
          label="Автозапись"
          value={formatNumber(status.activeAutoSignEntries)}
          caption="ждут записи"
        />
        <Stat
          icon="event_upcoming"
          label="Свободная запись"
          value={formatNumber(status.activeFreeSignEntries)}
          caption="ждут места"
        />
      </div>
      <Card as="section" padding="large" aria-label="Ошибки за 7 дней">
        <CardHeader title="Ошибки за 7 дней" />
        {errors.length === 0 ? (
          <p className={styles.muted}>Ошибок не было</p>
        ) : (
          <ul className={styles.errorList}>
            {errors.map((category) => (
              <li key={category}>
                <Badge tone="error">
                  {ERROR_CATEGORIES[category]}: {status.errors7d[category]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <section className={styles.section} aria-labelledby="sport-runs">
        <h2 id="sport-runs" className={styles.sectionTitle}>
          Последние запуски
        </h2>
        <Table
          caption="Последние запуски"
          columns={RUN_COLUMNS}
          rows={status.runs}
          rowKey={(run) => String(run.id)}
          maxHeight="none"
          empty={{ icon: 'sync_disabled', title: 'Запусков ещё не было' }}
        />
      </section>
    </div>
  );
}
