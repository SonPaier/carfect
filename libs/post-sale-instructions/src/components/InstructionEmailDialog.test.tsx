import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstructionEmailDialog } from './InstructionEmailDialog';
import type { InstructionListItem } from '../types';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const customRow: InstructionListItem = {
  kind: 'custom',
  row: {
    id: 'instr-1',
    instance_id: 'inst-1',
    title: 'My Custom Instruction',
    slug: 'my-custom-instruction',
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
    titlePl: 'PPF Care',
    titleEn: 'PPF care',
    getContent: () => ({ type: 'doc', content: [] }),
  },
};

const functionsInvoke = vi.fn();
const supabaseMock = {
  functions: { invoke: (...args: unknown[]) => functionsInvoke(...args) },
} as never;

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
  functionsInvoke.mockReset();
});

describe('InstructionEmailDialog', () => {
  it('renders nothing for a builtin item — caller must promote first', () => {
    const { container } = render(
      <InstructionEmailDialog
        open
        onOpenChange={vi.fn()}
        item={builtinPpf}
        supabase={supabaseMock}
      />,
    );
    expect(container.textContent).toBe('');
  });

  it('renders the custom row title in the header', () => {
    render(
      <InstructionEmailDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        defaultEmail="jan@example.com"
        supabase={supabaseMock}
      />,
    );
    expect(screen.getByText('My Custom Instruction')).toBeInTheDocument();
  });

  it('pre-fills the email field from defaultEmail', () => {
    render(
      <InstructionEmailDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        defaultEmail="jan@example.com"
        supabase={supabaseMock}
      />,
    );
    const input = screen.getByLabelText('Adres e-mail klienta') as HTMLInputElement;
    expect(input.value).toBe('jan@example.com');
  });

  it('keeps the send button disabled until an email address is supplied', () => {
    render(
      <InstructionEmailDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        supabase={supabaseMock}
      />,
    );
    const sendBtn = screen.getByRole('button', { name: /Wyślij/ });
    expect(sendBtn).toBeDisabled();
  });

  it('invokes send-instruction-email with instructionId + toEmail (no sendId path)', async () => {
    const user = userEvent.setup();
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(
      <InstructionEmailDialog
        open
        onOpenChange={vi.fn()}
        item={customRow}
        defaultEmail="jan@example.com"
        supabase={supabaseMock}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Wyślij/ }));

    await waitFor(() => {
      expect(functionsInvoke).toHaveBeenCalledWith(
        'send-instruction-email',
        expect.objectContaining({
          body: { instructionId: 'instr-1', toEmail: 'jan@example.com' },
        }),
      );
    });
  });

  it('closes the dialog and toasts success after the function returns', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
    render(
      <InstructionEmailDialog
        open
        onOpenChange={onOpenChange}
        item={customRow}
        defaultEmail="jan@example.com"
        supabase={supabaseMock}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Wyślij/ }));
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('surfaces a toast error and stays open when the function fails', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    functionsInvoke.mockResolvedValue({ data: null, error: { message: 'boom' } });
    render(
      <InstructionEmailDialog
        open
        onOpenChange={onOpenChange}
        item={customRow}
        defaultEmail="jan@example.com"
        supabase={supabaseMock}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Wyślij/ }));
    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
