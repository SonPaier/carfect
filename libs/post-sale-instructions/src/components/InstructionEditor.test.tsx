import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { InstructionEditor } from './InstructionEditor';
import type { PostSaleInstructionRow, TiptapDocument } from '../types';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
vi.mock('../hooks/useCreateInstruction', () => ({
  useCreateInstruction: () => ({ mutateAsync: createMutateAsync, isPending: false }),
}));
vi.mock('../hooks/useUpdateInstruction', () => ({
  useUpdateInstruction: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock('@shared/ui', async (importOriginal) => {
  const original = await importOriginal<typeof import('@shared/ui')>();
  return {
    ...original,
    RichTextEditor: ({
      value,
      onChange,
    }: {
      value: TiptapDocument | null;
      onChange: (doc: TiptapDocument) => void;
    }) => (
      <textarea
        data-testid="rich-text-editor"
        value={JSON.stringify(value ?? {})}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value) as TiptapDocument);
          } catch {
            // ignore parse errors in test
          }
        }}
      />
    ),
  };
});

function renderEditor(props: {
  mode: Parameters<typeof InstructionEditor>[0]['mode'];
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(InstructionEditor, {
        instanceId: 'inst-1',
        supabase: {} as never,
        mode: props.mode,
        previewInstance: { name: 'Test', phone: '+48 000 000 000', email: 'test@example.com' },
        onClose: props.onClose ?? vi.fn(),
        onSaved: props.onSaved ?? vi.fn(),
      }),
    ),
  );
}

const existingRow: PostSaleInstructionRow = {
  id: 'row-1',
  instance_id: 'inst-1',
  title: 'Existing Title',
  content: { type: 'doc', content: [] },
  hardcoded_key: null,
  created_by: null,
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
};

beforeEach(() => {
  createMutateAsync.mockReset();
  updateMutateAsync.mockReset();
});

describe('InstructionEditor', () => {
  it('renders empty form fields in new mode', () => {
    renderEditor({ mode: { kind: 'new' } });
    const titleInput = screen.getByLabelText('Tytuł') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('pre-fills the form with the existing row in edit mode', () => {
    renderEditor({ mode: { kind: 'edit', row: existingRow } });
    const titleInput = screen.getByLabelText('Tytuł') as HTMLInputElement;
    expect(titleInput.value).toBe('Existing Title');
  });

  it('pre-fills the form from the built-in template in duplicate mode', () => {
    renderEditor({ mode: { kind: 'duplicate', key: 'ppf' } });
    const titleInput = screen.getByLabelText('Tytuł') as HTMLInputElement;
    expect(titleInput.value.length).toBeGreaterThan(0);
  });

  it('shows a validation error when title is empty on submit', async () => {
    const user = userEvent.setup();
    renderEditor({ mode: { kind: 'new' } });

    await user.click(screen.getByRole('button', { name: /Zapisz|common\.save/ }));

    await waitFor(() => {
      expect(screen.getByText('Tytuł jest wymagany')).toBeInTheDocument();
    });
    expect(createMutateAsync).not.toHaveBeenCalled();
  });

  it('calls useCreateInstruction with hardcoded_key set in duplicate mode', async () => {
    const user = userEvent.setup();
    createMutateAsync.mockResolvedValue({ id: 'new-1' });
    const onSaved = vi.fn();
    renderEditor({ mode: { kind: 'duplicate', key: 'ceramic' }, onSaved });

    await user.click(screen.getByRole('button', { name: /Zapisz|common\.save/ }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId: 'inst-1',
          hardcodedKey: 'ceramic',
        }),
      );
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('calls useUpdateInstruction in edit mode and triggers onSaved on success', async () => {
    const user = userEvent.setup();
    updateMutateAsync.mockResolvedValue({ id: existingRow.id });
    const onSaved = vi.fn();
    renderEditor({ mode: { kind: 'edit', row: existingRow }, onSaved });

    await user.click(screen.getByRole('button', { name: /Zapisz|common\.save/ }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'row-1', instanceId: 'inst-1' }),
      );
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('calls onClose when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderEditor({ mode: { kind: 'new' }, onClose });

    await user.click(screen.getByRole('button', { name: /Anuluj|common\.cancel/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
