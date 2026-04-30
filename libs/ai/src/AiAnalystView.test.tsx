import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AiAnalystView } from './AiAnalystView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
              spec: { type: 'bar', title: 'T', data: [{ x: 1, y: 2 }], x_key: 'x', y_keys: ['y'] },
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

  it('hides data-chart parts (charts deferred to Chunk 8)', () => {
    const { container } = render(
      <AiAnalystView
        instanceId="i1"
        suggestions={[]}
        schemaContext="carfect"
        supabaseClient={{} as never}
      />,
    );
    // data-chart parts are hidden — no SVG chart rendered
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
