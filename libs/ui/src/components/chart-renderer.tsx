import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '../lib/utils';

export type ChartRendererSpec = {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKeys: string[];
  unit?: string;
};

const PALETTE = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function formatValue(value: number | string, unit?: string): string {
  if (typeof value !== 'number') return String(value);
  const formatted = value.toLocaleString();
  return unit ? `${formatted} ${unit}` : formatted;
}

export interface ChartRendererProps {
  spec: ChartRendererSpec;
  className?: string;
  height?: number;
}

export function ChartRenderer({ spec, className, height = 256 }: ChartRendererProps) {
  const { type, title, data, xKey, yKeys, unit } = spec;
  if (!data.length || !yKeys.length) return null;

  return (
    <figure className={cn('my-3 rounded-lg border border-border bg-card p-3', className)}>
      <figcaption className="mb-2 text-sm font-medium text-foreground">{title}</figcaption>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(type, data, xKey, yKeys, unit)}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function renderChart(
  type: ChartRendererSpec['type'],
  data: ChartRendererSpec['data'],
  xKey: string,
  yKeys: string[],
  unit: string | undefined,
): React.ReactElement {
  const tooltipFormatter = (v: number | string) => formatValue(v, unit);

  if (type === 'pie') {
    const pieKey = yKeys[0];
    return (
      <PieChart>
        <Pie data={data} dataKey={pieKey} nameKey={xKey} outerRadius={80} label>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={tooltipFormatter} />
        <Legend />
      </PieChart>
    );
  }

  const bars = yKeys.map((key, i) => (
    <Bar key={key} dataKey={key} fill={PALETTE[i % PALETTE.length]} />
  ));
  const lines = yKeys.map((key, i) => (
    <Line
      key={key}
      type="monotone"
      dataKey={key}
      stroke={PALETTE[i % PALETTE.length]}
      dot={false}
    />
  ));

  if (type === 'line') {
    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={tooltipFormatter} />
        {yKeys.length > 1 && <Legend />}
        {lines}
      </LineChart>
    );
  }

  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip formatter={tooltipFormatter} />
      {yKeys.length > 1 && <Legend />}
      {bars}
    </BarChart>
  );
}
