import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { formatDate, formatNumber } from '../../ui';
import styles from './DashboardPage.module.css';
import type { DashboardDay, DayMetric } from './types';

export interface TrendChartProps {
  days: readonly DashboardDay[];
  metric: DayMetric;
  /** Tooltip label for one day's value, e.g. «новых». */
  unit: string;
}

const TICK = { fill: 'var(--on-surface-variant)', fontSize: 12 };

function DayTooltip({ active, payload, unit }: TooltipContentProps & { unit: string }) {
  const point = payload[0];
  if (!active || !point) return null;
  const day = point.payload as DashboardDay;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipDate}>{formatDate(day.date)}</span>
      <span>
        <strong>{formatNumber(Number(point.value))}</strong> {unit}
      </span>
    </div>
  );
}

/** One series over 30 days: a 2 px line over a light wash, recessive axes. */
export default function TrendChart({ days, metric, unit }: TrendChartProps) {
  const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  return (
    <ResponsiveContainer width="100%" height={180} initialDimension={{ width: 480, height: 180 }}>
      <AreaChart data={days as DashboardDay[]} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--outline-variant)" strokeWidth={1} />
        <XAxis
          dataKey="date"
          tickFormatter={(date: string) => formatDate(date)}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          allowDecimals={false}
          tick={TICK}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) => formatNumber(value)}
        />
        <Tooltip
          cursor={{ stroke: 'var(--outline)', strokeWidth: 1 }}
          content={(props) => <DayTooltip {...props} unit={unit} />}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="var(--primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={`url(#${gradientId})`}
          activeDot={{ r: 5, fill: 'var(--primary)', stroke: 'var(--surface-low)', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
