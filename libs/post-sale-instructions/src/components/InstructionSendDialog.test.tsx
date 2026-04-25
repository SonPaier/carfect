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
        onRequestDuplicate: vi.fn(),
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
  functionsInvoke.mockReset();
  mockUseInstructionSends.mockReturnValue({ data: [], isLoading: false });
});

describe('InstructionSendDialog', () => {
  it('lists all templates including built-ins on open', () => {
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf, customRow],
      isLoading: false,
    });

    renderDialog();

    expect(screen.getByText('Pielęgnacja folii PPF')).toBeInTheDocument();
    expect(screen.getByText('My Custom Instruction')).toBeInTheDocument();
  });

  it('shows duplicate prompt when a built-in template is selected', async () => {
    const user = userEvent.setup();
    const onRequestDuplicate = vi.fn();
    mockUseInstructions.mockReturnValue({
      data: [builtinPpf],
      isLoading: false,
    });

    renderDialog({ onRequestDuplicate });

    await user.click(screen.getByText('Pielęgnacja folii PPF'));
    expect(screen.getByText('Aby wysłać wbudowaną instrukcję, najpierw ją zduplikuj i edytuj.')).toBeInTheDocument();
  });

  it('calls useSendInstruction when a custom template is selected and Generate is clicked', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByText('Wygeneruj link'));

    await waitFor(() => {
      expect(sendMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          instructionId: 'instr-1',
          reservationId: 'res-1',
          customerId: 'cust-1',
          instanceId: 'inst-1',
        }),
      );
    });
  });

  it('renders the generated public link in a read-only input after send', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByText('Wygeneruj link'));

    await waitFor(() => {
      const input = screen.getByDisplayValue(
        'https://armcar.carfect.pl/instructions/tok-abc',
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.readOnly).toBe(true);
    });
  });

  it('copies the link to the clipboard and shows a toast when copy is clicked', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByText('Wygeneruj link'));

    await waitFor(() => screen.getByDisplayValue(/tok-abc/));
    const buttons = screen.getAllByRole('button');
    const copyBtn = buttons.find((b) => b.querySelector('svg.lucide-copy'));
    expect(copyBtn).toBeDefined();
    await user.click(copyBtn!);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://armcar.carfect.pl/instructions/tok-abc');
    });
    expect(toastSuccess).toHaveBeenCalledWith('Link skopiowany');
  });

  it('pre-fills the email field with the customer email from props', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByText('Wygeneruj link'));

    await waitFor(() => screen.getByDisplayValue(/tok-abc/));
    await user.click(screen.getByText('Wyślij e-mailem'));

    const emailInput = screen.getByLabelText('Adres e-mail klienta') as HTMLInputElement;
    expect(emailInput.value).toBe('jan@example.com');
  });

  it('invokes send-instruction-email with sendId and customEmailBody on email submit', async () => {
    const user = userEvent.setup();
    sendMutateAsync.mockResolvedValue(sentRow);
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    await user.click(screen.getByText('Wygeneruj link'));

    await waitFor(() => screen.getByDisplayValue(/tok-abc/));
    await user.click(screen.getByText('Wyślij e-mailem'));

    const bodyTextarea = screen.getByLabelText('Treść wiadomości');
    await user.type(bodyTextarea, 'Dzień dobry');
    await user.click(screen.getByRole('button', { name: 'Wyślij' }));

    await waitFor(() => {
      expect(functionsInvoke).toHaveBeenCalledWith(
        'send-instruction-email',
        expect.objectContaining({
          body: expect.objectContaining({
            sendId: 'send-1',
            customEmailBody: 'Dzień dobry',
            toEmail: 'jan@example.com',
          }),
        }),
      );
    });
  });

  it('shows the alreadySentAt banner when the instruction was previously sent', async () => {
    const user = userEvent.setup();
    mockUseInstructions.mockReturnValue({
      data: [customRow],
      isLoading: false,
    });
    mockUseInstructionSends.mockReturnValue({
      data: [
        {
          ...sentRow,
          sent_at: '2026-04-20T10:30:00Z',
        },
      ],
      isLoading: false,
    });

    renderDialog();

    await user.click(screen.getByText('My Custom Instruction'));
    expect(screen.getByText(/Wysłano:.*20\.04\.2026/)).toBeInTheDocument();
  });
});
