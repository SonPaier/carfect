import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiAnalystView, parseChartPart, specToRenderer } from './AiAnalystView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

vi.mock('./useAiAnalyst', () => ({
  useAiAnalyst: () => ({
    messages: [
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Pytanie' }] },
      {
        id: '2',
        role: 'assistant',
        parts: [
          { type: 'text', text: '**Odpowiedź** liczba: 42' },
          {
            type: 'tool-run_sql',
            data: { query: 'SELECT 1' },
          },
          {
            type: 'data-chart',
            data: {
              spec: {
                type: 'bar',
                title: 'Revenue per service',
                data: [
                  { name: 'Detailing', value: 12000 },
                  { name: 'Tires', value: 4500 },
                ],
                x_key: 'name',
                y_keys: ['value'],
                unit: 'zł',
              },
            },
          },
        ],
      },
    ],
    sendMessage: vi.fn(),
    status: 'idle',
    error: null,
  }),
}));

describe('AiAnalystView', () => {
  it('renders markdown bold from assistant text', () => {
    const { container } = render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    expect(container.querySelector('strong')?.textContent).toBe('Odpowiedź');
  });

  it('hides tool-run_sql parts', () => {
    render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    // tool parts are filtered out — no text content from tool types should appear
    expect(screen.queryByText('tool-run_sql')).not.toBeInTheDocument();
  });

  it('renders data-chart parts via ChartRenderer', () => {
    const { container } = render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    expect(screen.getByText('Revenue per service')).toBeInTheDocument();
    expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
  });

  it('does not leak raw spec keys (x_key/y_keys) into the DOM', () => {
    render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    expect(screen.queryByText(/x_key/)).not.toBeInTheDocument();
    expect(screen.queryByText(/y_keys/)).not.toBeInTheDocument();
  });
});

describe('parseChartPart', () => {
  const validSpec = {
    type: 'bar',
    title: 'T',
    data: [{ name: 'A', value: 1 }],
    x_key: 'name',
    y_keys: ['value'],
  };

  it('returns null for non-chart part types', () => {
    expect(parseChartPart({ type: 'text' })).toBeNull();
    expect(parseChartPart({ type: 'tool-run_sql' })).toBeNull();
  });

  it('returns null when spec is missing', () => {
    expect(parseChartPart({ type: 'data-chart' })).toBeNull();
    const part = { type: 'data-chart', data: {} };
    expect(parseChartPart(part)).toBeNull();
  });

  it('returns null for unknown chart type (e.g. scatter)', () => {
    const part = { type: 'data-chart', data: { spec: { ...validSpec, type: 'scatter' } } };
    expect(parseChartPart(part)).toBeNull();
  });

  it('returns null when data is null or non-array', () => {
    const nullData = { type: 'data-chart', data: { spec: { ...validSpec, data: null } } };
    const stringData = { type: 'data-chart', data: { spec: { ...validSpec, data: 'oops' } } };
    expect(parseChartPart(nullData)).toBeNull();
    expect(parseChartPart(stringData)).toBeNull();
  });

  it('returns null for empty data array (renderer would render nothing anyway)', () => {
    const part = { type: 'data-chart', data: { spec: { ...validSpec, data: [] } } };
    expect(parseChartPart(part)).toBeNull();
  });

  it('returns parsed spec for a valid chart part', () => {
    const part = { type: 'data-chart', data: { spec: validSpec } };
    expect(parseChartPart(part)).toEqual(validSpec);
  });
});

describe('specToRenderer', () => {
  it('maps snake_case ChartSpec to camelCase ChartRendererSpec', () => {
    expect(
      specToRenderer({
        type: 'line',
        title: 'Trend',
        data: [{ d: '2026-01', v: 10 }],
        x_key: 'd',
        y_keys: ['v'],
        unit: 'zł',
      }),
    ).toEqual({
      type: 'line',
      title: 'Trend',
      data: [{ d: '2026-01', v: 10 }],
      xKey: 'd',
      yKeys: ['v'],
      unit: 'zł',
    });
  });
});
