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

function renderList(
  props: {
    onEdit?: (id: string | null) => void;
    onDuplicateBuiltin?: (key: 'ppf' | 'ceramic') => void;
    onPreview?: (item: InstructionListItem) => void;
  } = {},
) {
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
        onPreview: props.onPreview,
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

const customFromPpf: InstructionListItem = {
  kind: 'custom',
  row: {
    id: 'row-2',
    instance_id: 'inst-1',
    title: 'Customized PPF guide',
    content: { type: 'doc', content: [] },
    hardcoded_key: 'ppf',
    created_by: null,
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-02T10:00:00Z',
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

async function openMenuFor(title: string) {
  const user = userEvent.setup();
  const card = screen.getByText(title).closest('[class*="card"], div');
  // Each card renders one MoreVertical trigger; find the closest trigger button
  const triggers = screen.getAllByRole('button', { name: 'Akcje' });
  const titleEl = screen.getByText(title);
  const trigger = triggers.find(
    (t) => titleEl.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  expect(trigger ?? card).toBeDefined();
  await user.click(trigger!);
  return user;
}

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  mockUseInstructions.mockReset();
  mockDeleteMutateAsync.mockReset();
});

describe('InstructionList', () => {
  it('renders both built-in templates without a builtin badge', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, builtinCeramic],
      isLoading: false,
    });

    renderList();

    expect(screen.getByText('Pielęgnacja folii PPF')).toBeInTheDocument();
    expect(screen.getByText('Pielęgnacja powłoki ceramicznej')).toBeInTheDocument();
    expect(screen.queryByText('Wbudowana')).not.toBeInTheDocument();
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
      builtinTitle.compareDocumentPosition(customTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('hides a builtin once a custom row exists with the same hardcoded_key', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, builtinCeramic, customFromPpf],
      isLoading: false,
    });

    renderList();

    // The PPF builtin should be hidden; the customized PPF row replaces it.
    expect(screen.queryByText('Pielęgnacja folii PPF')).not.toBeInTheDocument();
    expect(screen.getByText('Customized PPF guide')).toBeInTheDocument();
    // Ceramic builtin still visible because there is no custom for it.
    expect(screen.getByText('Pielęgnacja powłoki ceramicznej')).toBeInTheDocument();
  });

  it('does not show the delete action on built-in rows', async () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderList();

    await openMenuFor('Pielęgnacja folii PPF');
    expect(screen.getByRole('menuitem', { name: /Edytuj/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Usuń/ })).not.toBeInTheDocument();
  });

  it('calls onEdit(null) when the new-button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    mockUseInstructions.mockReturnValue({ data: [], isLoading: false });

    renderList({ onEdit });

    await user.click(screen.getByText('Dodaj'));
    expect(onEdit).toHaveBeenCalledWith(null);
  });

  it('auto-promotes a builtin to a custom row when Edit is clicked', async () => {
    const onDuplicateBuiltin = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderList({ onDuplicateBuiltin });

    const user = await openMenuFor('Pielęgnacja folii PPF');
    await user.click(screen.getByRole('menuitem', { name: /Edytuj/ }));
    expect(onDuplicateBuiltin).toHaveBeenCalledWith('ppf');
  });

  it('calls onEdit(rowId) when Edit is clicked on a custom row', async () => {
    const onEdit = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderList({ onEdit });

    const user = await openMenuFor('My Custom Instruction');
    await user.click(screen.getByRole('menuitem', { name: /Edytuj/ }));
    expect(onEdit).toHaveBeenCalledWith('row-1');
  });

  it('calls onPreview with the selected item when Preview is clicked', async () => {
    const onPreview = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderList({ onPreview });

    const user = await openMenuFor('My Custom Instruction');
    await user.click(screen.getByRole('menuitem', { name: /Podgląd/ }));
    expect(onPreview).toHaveBeenCalledWith(customRow);
  });

  it('hides the preview menu item when no onPreview prop is supplied', async () => {
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderList();
    await openMenuFor('My Custom Instruction');
    expect(screen.queryByRole('menuitem', { name: /Podgląd/ })).not.toBeInTheDocument();
  });

  it('shows the localized RESTRICT FK error toast when delete fails', async () => {
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    mockDeleteMutateAsync.mockRejectedValue(new Error('INSTRUCTION_RESTRICT_FK'));

    renderList();

    const user = await openMenuFor('My Custom Instruction');
    await user.click(screen.getByRole('menuitem', { name: /Usuń/ }));
    const confirmBtn = screen.getAllByText('Usuń').find((el) => el.closest('[role="alertdialog"]'));
    expect(confirmBtn).toBeDefined();
    await user.click(confirmBtn!);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        'Nie można usunąć — ta instrukcja została już wysłana. Edytuj ją zamiast usuwać.',
      );
    });
  });
});
