import { lazy, Suspense, type ReactNode } from 'react';
import { Link } from 'react-router';
import { errorText } from '../../api/errors';
import {
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  formatDate,
  formatNumber,
  Icon,
  PageHeader,
  Skeleton,
  Stat,
  Table,
} from '../../ui';
import type { LinkStatus } from '../moderation/types';
import { useDashboard } from './api';
import styles from './DashboardPage.module.css';
import type { Dashboard, DashboardDay, DashboardTotals, DayMetric } from './types';

/** Charts load separately, so recharts stays out of the main bundle. */
const TrendChart = lazy(() => import('./TrendChart'));

const TRENDS: { metric: DayMetric; title: string; unit: string }[] = [
  { metric: 'newUsers', title: 'Новые пользователи', unit: 'новых' },
  { metric: 'activeDevices', title: 'Активные устройства', unit: 'устройств' },
  { metric: 'createdLinks', title: 'Новые ссылки', unit: 'ссылок' },
];

const LINK_STATUSES: { status: LinkStatus; label: string }[] = [
  { status: 'PUBLISHED', label: 'Опубликованы' },
  { status: 'PENDING', label: 'На проверке' },
  { status: 'REJECTED', label: 'Отклонены' },
  { status: 'HIDDEN', label: 'Скрыты' },
  { status: 'PRIVATE', label: 'Личные' },
];

export function DashboardPage() {
  const dashboard = useDashboard();
  return (
    <>
      <PageHeader title="Дашборд" description="Итоги и последние 30 дней" />
      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <ErrorState
          title="Не удалось загрузить дашборд"
          description={errorText(dashboard.error, 'Попробуйте ещё раз.')}
          onRetry={() => void dashboard.refetch()}
          retrying={dashboard.isFetching}
        />
      ) : (
        <DashboardView data={dashboard.data} />
      )}
    </>
  );
}

function DashboardView({ data }: { data: Dashboard }) {
  return (
    <div className={styles.page}>
      <Totals totals={data.totals} />
      <div className={styles.charts}>
        {TRENDS.map((trend) => (
          <TrendCard key={trend.metric} days={data.days} {...trend} />
        ))}
        <LinksByStatus links={data.totals.links} />
      </div>
      <DaysTable days={data.days} />
    </div>
  );
}

function Totals({ totals }: { totals: DashboardTotals }) {
  return (
    <div className={styles.tiles}>
      <Stat
        icon="group"
        label="Пользователи"
        value={formatNumber(totals.users)}
        caption={`+${formatNumber(totals.newUsers7d)} за 7 дней`}
      />
      <Stat
        icon="smartphone"
        label="Активные устройства"
        value={formatNumber(totals.activeDevices7d)}
        caption={`за 7 дней · ${formatNumber(totals.activeDevices30d)} за 30`}
      />
      <Stat
        icon="language"
        label="Входы на сайт"
        value={formatNumber(totals.webSessions7d)}
        caption="за 7 дней"
      />
      <Stat icon="diversity_3" label="Дружбы" value={formatNumber(totals.friendships)} />
      <Stat
        icon="fitness_center"
        label="Очереди спорта"
        value={formatNumber(totals.activeAutoSignEntries + totals.activeFreeSignEntries)}
        caption={`авто ${formatNumber(totals.activeAutoSignEntries)} · свободная ${formatNumber(totals.activeFreeSignEntries)}`}
      />
      <Link to="/admin/moderation" className={styles.casesTile}>
        <span className={styles.casesLabel}>
          <Icon name="gavel" size={20} />
          Открытые заявки
        </span>
        <span className={styles.casesValue}>{formatNumber(totals.openCases)}</span>
        <span className={styles.casesAction}>
          В очередь
          <Icon name="arrow_forward" size={18} />
        </span>
      </Link>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card as="section" padding="large" aria-label={title} className={styles.chartCard}>
      <CardHeader title={title} subtitle={subtitle} />
      {children}
    </Card>
  );
}

function TrendCard({
  days,
  metric,
  title,
  unit,
}: {
  days: readonly DashboardDay[];
  metric: DayMetric;
  title: string;
  unit: string;
}) {
  const total = days.reduce((sum, day) => sum + day[metric], 0);
  return (
    <ChartCard title={title} subtitle={`${formatNumber(total)} за 30 дней`}>
      {total === 0 ? (
        <EmptyState compact icon="show_chart" title="За 30 дней ничего" />
      ) : (
        <figure className={styles.figure} aria-label={`${title} по дням, всего ${total}`}>
          <Suspense fallback={<Skeleton height={180} />}>
            <TrendChart days={days} metric={metric} unit={unit} />
          </Suspense>
        </figure>
      )}
    </ChartCard>
  );
}

function LinksByStatus({ links }: { links: DashboardTotals['links'] }) {
  const total = LINK_STATUSES.reduce((sum, { status }) => sum + links[status], 0);
  const max = Math.max(1, ...LINK_STATUSES.map(({ status }) => links[status]));
  return (
    <ChartCard title="Ссылки по состоянию" subtitle={`${formatNumber(total)} всего`}>
      <ul className={styles.bars}>
        {LINK_STATUSES.map(({ status, label }) => (
          <li key={status} className={styles.bar}>
            <span className={styles.barLabel}>{label}</span>
            <span className={styles.barTrack} aria-hidden>
              <span
                className={styles.barFill}
                style={{ width: `${(links[status] / max) * 100}%` }}
              />
            </span>
            <span className={styles.barValue}>{formatNumber(links[status])}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

/** The chart data as a table, for exact values and screen readers. */
function DaysTable({ days }: { days: readonly DashboardDay[] }) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        <Icon name="table" size={20} />
        Данные по дням
      </summary>
      <Table
        caption="Данные по дням"
        rows={[...days].reverse()}
        rowKey={(day) => day.date}
        maxHeight="none"
        columns={[
          { key: 'date', header: 'День', render: (day) => formatDate(day.date) },
          ...TRENDS.map((trend) => ({
            key: trend.metric,
            header: trend.title,
            align: 'end' as const,
            render: (day: DashboardDay) => formatNumber(day[trend.metric]),
          })),
        ]}
      />
    </details>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.page} role="status" aria-label="Загружаем дашборд">
      <div className={styles.tiles}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height={108} className={styles.skeletonTile} />
        ))}
      </div>
      <div className={styles.charts}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={260} className={styles.skeletonTile} />
        ))}
      </div>
    </div>
  );
}
