import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { InstructionSendDialog } from './InstructionSendDialog';
import type { InstructionListItem, InstructionSendRow } from '../types';

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

const mockUseInstructionSends = vi.fn();
vi.mock('../hooks/useInstructionSends', () => ({
  useInstructionSends: (...args: unknown[]) => mockUseInstructionSends(...args),
}));

const sendMutateAsync = vi.fn();
vi.mock('../hooks/useSendInstruction', () => ({
  useSendInstruction: () => ({ mutateAsync: sendMutateAsync, isPending: false }),
  buildInstructionPublicUrl: (slug: string, token: string) =>
    `https://${slug}.carfect.pl/instructions/${token}`,
}));

const createMutateAsync = vi.fn();
vi.mock('../hooks/useCreateInstruction', () => ({
  useCreateInstruction: () => ({ mutateAsync: createMutateAsync, isPending: false }),
}));

const customRow: InstructionListItem = {
  kind: 'custom',
  row: {
    id: 'instr-1',
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

const sentRow: InstructionSendRow = {
  id: 'send-1',
  instruction_id: 'instr-1',
  reservation_id: 'res-1',
  customer_id: 'cust-1',
  instance_id: 'inst-1',
  public_token: 'tok-abc',
  sent_at: '2026-04-25T10:00:00Z',
  viewed_at: null,
  created_by: null,
};

const functionsInvoke = vi.fn();
const supabaseMock = {
  functions: { invoke: (...args: unknown[]) => functionsInvoke(...args) },
} as never;

function renderDialog(props: Partial<Parameters<typeof InstructionSendDialog>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(InstructionSendDialog, {
        open: true,
        onOpenChange: vi.fn(),
        reservationId: 'res-1',
        customerId: 'cust-1',
        customerEmail: 'jan@example.com',
        instanceId: 'inst-1',
        instanceSlug: 'armcar',
        supabase: supabaseMock,
        ...props,
      }),
    ),
  );
}

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  mockUseInstructions.mockReset();
  mockUseInstructionSends.mockReset();
  sendMutateAsync.mockReset();
  createMutateAsync.mockReset();
  functionsInvoke.mockReset();
  mockUseInstructionSends.mockReturnValue({ data: [], isLoading: false });
});

describe('InstructionSendDialog', () => {
  it('lists templates without the builtin badge', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, customRow],
      isLoading: false,
    });
    renderDialog();
    expect(screen.getByText('Pielęgnacja folii PPF')).toBeInTheDocument();
    expect(screen.getByText('My Custom Instruction')).toBeInTheDocument();
    expect(screen.queryByText('Wbudowana')).not.toBeInTheDocument();
  });

  it('hides a builtin from the picker when a custom row exists with the same hardcoded_key', () => {
    const promotedPpf = {
      kind: 'custom' as const,
      row: { ...customRow.row, id: 'instr-2', hardcoded_key: 'ppf' as const },
    };
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, promotedPpf],
      isLoading: false,
    });
    renderDialog();
    // Only the promoted custom title should appear; builtin is filtered out.
    expect(screen.queryByText('Pielęgnacja folii PPF')).not.toBeInTheDocument();
  });

  it('pre-fills the email field with the customer email from props', () => {
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    renderDialog();
    const emailInput = screen.getByLabelText('Adres e-mail klienta') as HTMLInputElement;
    expect(emailInput.value).toBe('jan@example.com');
  });

  it('keeps the send button disabled until both an instruction and an email are present', () => {
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    renderDialog({ customerEmail: null });
    const sendBtn = screen.getByRole('button', { name: /Wyślij/ });
    expect(sendBtn).toBeDisabled();
  });

  it('inserts send + invokes email function in one click for a custom instruction', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderDialog();
    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByRole('button', { name: /Wyślij/ }));

    await waitFor(() => {
      expect(sendMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ instructionId: 'instr-1', reservationId: 'res-1' }),
      );
    });
    await waitFor(() => {
      expect(functionsInvoke).toHaveBeenCalledWith(
        'send-instruction-email',
        expect.objectContaining({
          body: { sendId: 'send-1', toEmail: 'jan@example.com' },
        }),
      );
    });
  });

  it('auto-creates a custom row from a builtin before sending', async () => {
    const user = userEvent.setup();
    createMutateAsync.mockResolvedValue({ id: 'new-instr-1', hardcoded_key: 'ppf' });
    sendMutateAsync.mockResolvedValue({ ...sentRow, instruction_id: 'new-instr-1' });
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderDialog();
    await user.click(screen.getByText('Pielęgnacja folii PPF'));
    await user.click(screen.getByRole('button', { name: /Wyślij/ }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ hardcodedKey: 'ppf' }),
      );
    });
    await waitFor(() => {
      expect(sendMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ instructionId: 'new-instr-1' }),
      );
    });
  });

  it('shows the alreadySentAt banner when the instruction was previously sent to this reservation', async () => {
    const user = userEvent.setup();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    mockUseInstructionSends.mockReturnValue({
      data: [{ ...sentRow, sent_at: '2026-04-20T10:30:00Z' }],
      isLoading: false,
    });

    renderDialog();
    await user.click(screen.getByText('My Custom Instruction'));
    expect(screen.getByText(/Wysłano:.*20\.04\.2026/)).toBeInTheDocument();
  });
});
