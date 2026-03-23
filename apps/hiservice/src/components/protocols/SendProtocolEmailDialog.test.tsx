import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SendProtocolEmailDialog from './SendProtocolEmailDialog';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultProtocol = {
  id: 'proto-1',
  customer_name: 'Jan Kowalski',
  customer_email: 'jan@example.com',
  public_token: 'tok-abc123',
  protocol_date: '2026-03-20',
};

function renderDialog(props = {}) {
  const user = userEvent.setup();
  return {
    user,
    ...render(
      <SendProtocolEmailDialog
        open={true}
        onClose={vi.fn()}
        protocol={defaultProtocol}
        instanceId="test-instance-id"
        onStatusChange={vi.fn()}
        {...props}
      />,
    ),
  };
}

describe('SendProtocolEmailDialog', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();

    // Default: instance with a template
    mockSupabaseQuery('instances', {
      data: {
        id: 'test-instance-id',
        name: 'Firma Serwisowa Sp. z o.o.',
        protocol_email_template:
          'Dzień dobry {imie_klienta},\n\nLink: {link_protokolu}\n\nFirma: {nazwa_firmy}\nData: {data_protokolu}',
      },
      error: null,
    });
  });

  // Helper: get the message textarea (Label is not linked via htmlFor so we query by display value or placeholder)
  function getMessageTextarea(): HTMLTextAreaElement {
    const textareas = document.querySelectorAll('textarea');
    // The message textarea is the one with rows=6 (or just the only textarea)
    for (const ta of textareas) {
      if (ta.getAttribute('rows') === '6') return ta as HTMLTextAreaElement;
    }
    return textareas[textareas.length - 1] as HTMLTextAreaElement;
  }

  describe('template variable substitution', () => {
    it('substitutes {imie_klienta} with customer first name', async () => {
      renderDialog();

      await waitFor(() => {
        const ta = getMessageTextarea();
        expect(ta.value).toContain('Jan');
      });
    });

    it('substitutes {link_protokolu} with full public URL', async () => {
      renderDialog();

      const expectedLink = `${window.location.origin}/protocols/tok-abc123`;

      await waitFor(() => {
        const ta = getMessageTextarea();
        expect(ta.value).toContain(expectedLink);
      });
    });

    it('substitutes {nazwa_firmy} with instance name', async () => {
      renderDialog();

      await waitFor(() => {
        const ta = getMessageTextarea();
        expect(ta.value).toContain('Firma Serwisowa Sp. z o.o.');
      });
    });

    it('substitutes {data_protokolu} with protocol date', async () => {
      renderDialog();

      await waitFor(() => {
        const ta = getMessageTextarea();
        expect(ta.value).toContain('2026-03-20');
      });
    });

    it('uses fallback message when no template is configured', async () => {
      mockSupabaseQuery('instances', {
        data: {
          id: 'test-instance-id',
          name: 'Test Instance',
          protocol_email_template: null,
        },
        error: null,
      });

      renderDialog();

      await waitFor(() => {
        const ta = getMessageTextarea();
        expect(ta.value).toContain('protokołu zakończenia prac');
      });
    });
  });

  describe('edge function invocation', () => {
    it('passes publicUrl and instanceId to edge function', async () => {
      const { user } = renderDialog();

      // Wait for the dialog to be rendered with send button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Wyślij' }));

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'send-protocol-email',
          expect.objectContaining({
            body: expect.objectContaining({
              instanceId: 'test-instance-id',
              publicUrl: `${window.location.origin}/protocols/tok-abc123`,
            }),
          }),
        );
      });
    });

    it('passes protocolId to edge function', async () => {
      const { user } = renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Wyślij' }));

      await waitFor(() => {
        expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
          'send-protocol-email',
          expect.objectContaining({
            body: expect.objectContaining({
              protocolId: 'proto-1',
            }),
          }),
        );
      });
    });

    it('calls onStatusChange with "sent" after successful send', async () => {
      const onStatusChange = vi.fn();
      const { user } = renderDialog({ onStatusChange });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Wyślij' }));

      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('proto-1', 'sent');
      });
    });

    it('shows error toast when edge function returns error', async () => {
      const { toast } = await import('sonner');
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'SMTP connection failed' },
      });

      const { user } = renderDialog();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: 'Wyślij' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Błąd wysyłania emaila');
      });
    });

    it('shows error when no recipient email is provided', async () => {
      const { toast } = await import('sonner');
      const { user } = renderDialog({
        protocol: { ...defaultProtocol, customer_email: null },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Wyślij' })).toBeInTheDocument();
      });

      // Recipient email field should be empty (since customer_email is null)
      const emailInput = screen.getByPlaceholderText('email@example.com');
      expect((emailInput as HTMLInputElement).value).toBe('');

      await user.click(screen.getByRole('button', { name: 'Wyślij' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Podaj adres email');
      });
    });
  });

  describe('pre-filling', () => {
    it('pre-fills recipient email from protocol customer_email', async () => {
      renderDialog();

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('email@example.com');
        expect((emailInput as HTMLInputElement).value).toBe('jan@example.com');
      });
    });

    it('pre-fills subject with customer name', async () => {
      renderDialog();

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        const subjectInput = inputs.find(
          (el) => (el as HTMLInputElement).value?.includes('Jan Kowalski')
        );
        expect(subjectInput).toBeDefined();
      });
    });
  });
});
