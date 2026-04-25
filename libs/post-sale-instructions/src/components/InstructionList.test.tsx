import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { InstructionList } from './InstructionList';
import type { InstructionListItem } from '../types';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const mockUseInstructions = vi.fn();
vi.mock('../hooks/useInstructions', () => ({
  useInstructions: (...args: unknown[]) => mockUseInstructions(...args),
}));

const mockDeleteMutateAsync = vi.fn();
vi.mock('../hooks/useDeleteInstruction', () => ({
  useDeleteInstruction: () => ({ mutateAsync: mockDeleteMutateAsync }),
}));

function renderList(props: {
  onEdit?: (id: string | null) => void;
  onDuplicateBuiltin?: (key: 'ppf' | 'ceramic') => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(InstructionList, {
        instanceId: 'inst-1',
        supabase: {} as never,
        onEdit: props.onEdit ?? vi.fn(),
        onDuplicateBuiltin: props.onDuplicateBuiltin ?? vi.fn(),
      }),
    ),
  );
}

const customRow: InstructionListItem = {
  kind: 'custom',
  row: {
    id: 'row-1',
    instance_id: 'inst-1',
    title: 'My Custom Instruction',
    content: { type: 'doc', content: [] },
    hardcoded_key: null,
    created_by: null,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
  },
};

const builtinPpf: InstructionListItem = {
  kind: 'builtin',
  template: {
    key: 'ppf',
    titlePl: 'Pielęgnacja folii PPF',
    titleEn: 'PPF care',
    getContent: () => ({ type: 'doc', content: [] }),
  },
};

const builtinCeramic: InstructionListItem = {
  kind: 'builtin',
  template: {
    key: 'ceramic',
    titlePl: 'Pielęgnacja powłoki ceramicznej',
    titleEn: 'Ceramic coating care',
    getContent: () => ({ type: 'doc', content: [] }),
  },
};

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  mockUseInstructions.mockReset();
  mockDeleteMutateAsync.mockReset();
});

describe('InstructionList', () => {
  it('renders both built-in templates with the builtin badge', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, builtinCeramic],
      isLoading: false,
    });

    renderList();

    expect(screen.getByText('Pielęgnacja folii PPF')).toBeInTheDocument();
    expect(screen.getByText('Pielęgnacja powłoki ceramicznej')).toBeInTheDocument();
    expect(screen.getAllByText('Wbudowana')).toHaveLength(2);
  });

  it('renders custom rows after built-ins', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, builtinCeramic, customRow],
      isLoading: false,
    });

    renderList();

    const builtinTitle = screen.getByText('Pielęgnacja folii PPF');
    const customTitle = screen.getByText('My Custom Instruction');
    expect(
      builtinTitle.compareDocumentPosition(customTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows only the duplicateAndEdit action on built-in rows', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderList();

    expect(screen.getByText('Duplikuj i edytuj')).toBeInTheDocument();
    expect(screen.queryByText('Edytuj')).not.toBeInTheDocument();
    expect(screen.queryByText('Usuń')).not.toBeInTheDocument();
  });

  it('calls onEdit(null) when the new-button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    mockUseInstructions.mockReturnValue({ data: [], isLoading: false });

    renderList({ onEdit });

    await user.click(screen.getByText('Nowa instrukcja'));
    expect(onEdit).toHaveBeenCalledWith(null);
  });

  it('calls onDuplicateBuiltin with the correct key when duplicateAndEdit is clicked', async () => {
    const user = userEvent.setup();
    const onDuplicateBuiltin = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderList({ onDuplicateBuiltin });

    await user.click(screen.getByText('Duplikuj i edytuj'));
    expect(onDuplicateBuiltin).toHaveBeenCalledWith('ppf');
  });

  it('calls onEdit(rowId) when a custom row edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderList({ onEdit });

    await user.click(screen.getByText('Edytuj'));
    expect(onEdit).toHaveBeenCalledWith('row-1');
  });

  it('shows the localized RESTRICT FK error toast when delete fails with INSTRUCTION_RESTRICT_FK', async () => {
    const user = userEvent.setup();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    mockDeleteMutateAsync.mockRejectedValue(new Error('INSTRUCTION_RESTRICT_FK'));

    renderList();

    await user.click(screen.getByText('Usuń'));
    // Confirm in AlertDialog
    const confirmBtn = screen.getAllByText('Usuń').find((el) =>
      el.closest('[role="alertdialog"]'),
    );
    expect(confirmBtn).toBeDefined();
    await user.click(confirmBtn!);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Nie można usunąć — ta instrukcja została już wysłana. Edytuj ją zamiast usuwać.',
      );
    });
  });
});
