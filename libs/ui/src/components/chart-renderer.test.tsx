import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChartRenderer, type ChartRendererSpec } from './chart-renderer';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 300 }} className="recharts-wrapper">
        {children}
      </div>
    ),
  };
});

const baseBar: ChartRendererSpec = {
  type: 'bar',
  title: 'Revenue per service',
  data: [
    { name: 'Detailing', value: 12000 },
    { name: 'Tires', value: 4500 },
    { name: 'Service', value: 8200 },
  ],
  xKey: 'name',
  yKeys: ['value'],
  unit: 'zł',
};

describe('ChartRenderer', () => {
  it('renders the title in figcaption', () => {
    render(<ChartRenderer spec={baseBar} />);
    expect(screen.getByText('Revenue per service')).toBeInTheDocument();
  });

  it('returns null for empty data', () => {
    const { container } = render(<ChartRenderer spec={{ ...baseBar, data: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('returns null when yKeys is empty', () => {
    const { container } = render(<ChartRenderer spec={{ ...baseBar, yKeys: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mounts the responsive wrapper around the chart', () => {
    const { container } = render(<ChartRenderer spec={baseBar} />);
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('renders title for type=line', () => {
    render(<ChartRenderer spec={{ ...baseBar, type: 'line', title: 'Trend' }} />);
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('renders title for type=pie', () => {
    render(<ChartRenderer spec={{ ...baseBar, type: 'pie', title: 'Mix' }} />);
    expect(screen.getByText('Mix')).toBeInTheDocument();
  });

  it('does not leak raw spec keys (xKey/yKeys) into the DOM', () => {
    render(<ChartRenderer spec={baseBar} />);
    expect(screen.queryByText(/xKey/)).not.toBeInTheDocument();
    expect(screen.queryByText(/yKeys/)).not.toBeInTheDocument();
  });
});
