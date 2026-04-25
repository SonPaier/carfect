import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import PostSaleInstructionsSettings from './PostSaleInstructionsSettings';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'row-1',
              instance_id: 'inst-1',
              title: 'Existing',
              content: { type: 'doc', content: [] },
              hardcoded_key: null,
              created_by: null,
              created_at: '2026-04-01T00:00:00Z',
              updated_at: '2026-04-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

interface ListProps {
  onEdit: (id: string | null) => void;
  onDuplicateBuiltin: (key: 'ppf' | 'ceramic') => void;
}
interface EditorProps {
  mode: { kind: 'new' | 'edit' | 'duplicate'; key?: string; row?: { id: string } };
  onClose: () => void;
  onSaved: () => void;
}

vi.mock('@shared/post-sale-instructions', () => ({
  InstructionList: ({ onEdit, onDuplicateBuiltin }: ListProps) => (
    <div data-testid="list-stub">
      <button onClick={() => onEdit(null)}>list:new</button>
      <button onClick={() => onEdit('row-1')}>list:edit</button>
      <button onClick={() => onDuplicateBuiltin('ppf')}>list:duplicate</button>
    </div>
  ),
  InstructionEditor: ({ mode, onClose, onSaved }: EditorProps) => (
    <div data-testid="editor-stub">
      <span>mode:{mode.kind}</span>
      {mode.kind === 'duplicate' && <span>key:{mode.key}</span>}
      {mode.kind === 'edit' && mode.row && <span>row:{mode.row.id}</span>}
      <button onClick={onClose}>editor:close</button>
      <button onClick={onSaved}>editor:saved</button>
    </div>
  ),
  InstructionPreviewDialog: () => <div data-testid="preview-dialog-stub" />,
  InstructionEmailDialog: () => <div data-testid="email-dialog-stub" />,
  buildInstructionPublicUrl: (instanceSlug: string, slug: string) =>
    `https://${instanceSlug}.carfect.pl/instrukcje/${slug}`,
  previewInstructionPdf: vi.fn(),
}));

function renderSettings() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(PostSaleInstructionsSettings, { instanceId: 'inst-1' }),
    ),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PostSaleInstructionsSettings', () => {
  it('renders the InstructionList by default', () => {
    renderSettings();
    expect(screen.getByTestId('list-stub')).toBeInTheDocument();
  });

  it('switches to the editor in new mode when onEdit(null) is called', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByText('list:new'));
    expect(screen.getByTestId('editor-stub')).toBeInTheDocument();
    expect(screen.getByText('mode:new')).toBeInTheDocument();
  });

  it('switches to the editor in duplicate mode when onDuplicateBuiltin is called', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByText('list:duplicate'));
    expect(screen.getByText('mode:duplicate')).toBeInTheDocument();
    expect(screen.getByText('key:ppf')).toBeInTheDocument();
  });

  it('returns to the list when the editor calls onClose', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByText('list:new'));
    await user.click(screen.getByText('editor:close'));
    expect(screen.getByTestId('list-stub')).toBeInTheDocument();
  });

  it('returns to the list when the editor calls onSaved', async () => {
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByText('list:new'));
    await user.click(screen.getByText('editor:saved'));
    expect(screen.getByTestId('list-stub')).toBeInTheDocument();
  });
});
