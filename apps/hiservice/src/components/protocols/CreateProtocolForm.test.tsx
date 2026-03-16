import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateProtocolForm from './CreateProtocolForm';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' }, loading: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock child components that are complex
vi.mock('./ProtocolPhotosUploader', () => ({
  ProtocolPhotosUploader: () => <div data-testid="photos-uploader" />,
}));

vi.mock('./SignatureDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/admin/CustomerSearchInput', () => ({
  default: ({ onSelect, onClear }: any) => (
    <div data-testid="customer-search">
      <button
        onClick={() =>
          onSelect({
            id: 'cust-1',
            name: 'Jan Kowalski',
            phone: '123456789',
            email: 'jan@test.pl',
            nip: '1234567890',
          })
        }
      >
        Select Customer
      </button>
      <button onClick={onClear}>Clear Customer</button>
    </div>
  ),
}));

vi.mock('@/components/admin/CustomerAddressSelect', () => ({
  default: () => <div data-testid="address-select" />,
}));

// Mock Sheet to render children directly
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => (open ? <div data-testid="sheet">{children}</div> : null),
  SheetContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DrawerContent: ({ children }: any) => <div>{children}</div>,
}));

const { toast } = await import('sonner');

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  instanceId: 'test-instance-id',
  onSuccess: vi.fn(),
  editingProtocolId: null,
};

function renderForm(props: Record<string, any> = {}) {
  const user = userEvent.setup();
  const result = render(<CreateProtocolForm {...defaultProps} {...props} />);
  return { user, ...result };
}

describe('CreateProtocolForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();
    mockSupabaseQuery('protocols', { data: null, error: null }, 'insert');
    mockSupabaseQuery('protocols', { data: null, error: null }, 'update');
    mockSupabaseQuery('employees', { data: [], error: null });
  });

  it('renders form with required fields', async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByText('Protokół')).toBeInTheDocument();
    });
    expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    expect(screen.getByText('Anuluj')).toBeInTheDocument();
  });

  it('shows error when submitting without customer name', async () => {
    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Utwórz protokół'));

    expect(toast.error).toHaveBeenCalledWith('Podaj nazwę klienta');
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('creates protocol successfully with customer data', async () => {
    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    // Select customer via mock
    await user.click(screen.getByText('Select Customer'));

    await user.click(screen.getByText('Utwórz protokół'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Protokół utworzony');
    });
    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows generic error on insert failure', async () => {
    mockSupabaseQuery('protocols', { data: null, error: { message: 'DB error' } }, 'insert');
    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Customer'));
    await user.click(screen.getByText('Utwórz protokół'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Błąd podczas zapisywania protokołu');
    });
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('retries without calendar_item_id on FK constraint error (23503)', async () => {
    // First insert fails with FK error, retry succeeds
    let insertCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        return {
          insert: vi.fn().mockImplementation(() => {
            insertCallCount++;
            if (insertCallCount === 1) {
              return Promise.resolve({
                data: null,
                error: { message: 'FK violation', code: '23503' },
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cal-item-1' }, error: null }),
        };
      }
      if (table === 'calendar_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cal-item-1' }, error: null }),
        };
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      // Default
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { user } = renderForm({ prefillCalendarItemId: 'cal-item-1' });
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Customer'));
    await user.click(screen.getByText('Utwórz protokół'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Protokół utworzony');
    });
    expect(toast.error).toHaveBeenCalledWith(
      'Zlecenie zostało usunięte. Protokół zostanie zapisany bez powiązania.',
    );
    expect(insertCallCount).toBe(2);
    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it('shows error when retry also fails after FK constraint', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        return {
          insert: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: 'FK violation', code: '23503' } }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cal-item-1' }, error: null }),
        };
      }
      if (table === 'calendar_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'cal-item-1' }, error: null }),
        };
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { user } = renderForm({ prefillCalendarItemId: 'cal-item-1' });
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Customer'));
    await user.click(screen.getByText('Utwórz protokół'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Błąd podczas zapisywania protokołu');
    });
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('prefills customer data from props', async () => {
    renderForm({
      prefillCustomerId: 'cust-prefill',
      prefillCustomerName: 'Anna Nowak',
      prefillCustomerPhone: '987654321',
      prefillCustomerEmail: 'anna@test.pl',
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Anna Nowak')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('987654321')).toBeInTheDocument();
    expect(screen.getByDisplayValue('anna@test.pl')).toBeInTheDocument();
  });

  it('prevents double submit when loading', async () => {
    // Make insert hang (never resolves)
    let resolveInsert: (v: any) => void;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        return {
          insert: vi.fn().mockReturnValue(
            new Promise((r) => {
              resolveInsert = r;
            }),
          ),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Customer'));
    await user.click(screen.getByText('Utwórz protokół'));

    // Button should be disabled
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół').closest('button')).toBeDisabled();
    });

    // Resolve to avoid hanging test
    resolveInsert!({ data: null, error: null });
  });

  it('calls onClose on cancel', async () => {
    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Anuluj'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows edit title when editingProtocolId is set', async () => {
    const protocolData = {
      id: 'proto-1',
      protocol_type: 'completion',
      customer_id: 'c1',
      customer_name: 'Test',
      customer_phone: '123',
      customer_email: 'a@b.pl',
      customer_nip: '',
      customer_address_id: null,
      photo_urls: [],
      notes: '',
      protocol_date: '2026-03-16',
      prepared_by: 'Jan',
      customer_signature: null,
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        const builder: any = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockReturnValue(builder);
        builder.single = vi.fn().mockResolvedValue({ data: protocolData, error: null });
        builder.update = vi.fn().mockReturnValue(builder);
        builder.insert = vi.fn().mockResolvedValue({ data: null, error: null });
        return builder;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    renderForm({ editingProtocolId: 'proto-1' });

    await waitFor(() => {
      expect(screen.getByText('Edytuj protokół')).toBeInTheDocument();
    });
    expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
  });

  it('updates existing protocol in edit mode', async () => {
    const protocolData = {
      id: 'proto-1',
      protocol_type: 'completion',
      customer_id: 'c1',
      customer_name: 'Existing Customer',
      customer_phone: '123',
      customer_email: '',
      customer_nip: '',
      customer_address_id: null,
      photo_urls: [],
      notes: '',
      protocol_date: '2026-03-16',
      prepared_by: '',
      customer_signature: null,
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        const builder: any = {};
        builder.select = vi.fn().mockReturnValue(builder);
        builder.eq = vi.fn().mockReturnValue(builder);
        builder.single = vi
          .fn()
          .mockReturnValue({
            then: (resolve: any) => resolve({ data: protocolData, error: null }),
          });
        builder.update = vi
          .fn()
          .mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
        builder.insert = vi.fn().mockResolvedValue({ data: null, error: null });
        return builder;
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { user } = renderForm({ editingProtocolId: 'proto-1' });

    await waitFor(() => {
      expect(screen.getByText('Zapisz zmiany')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Zapisz zmiany'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Protokół zaktualizowany');
    });
    expect(defaultProps.onSuccess).toHaveBeenCalled();
  });

  it('skips calendar_item_id when item does not exist (pre-check)', async () => {
    // calendar_items check returns null (item deleted)
    mockSupabaseQuery('calendar_items', { data: null, error: null });

    let insertedPayload: any = null;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'protocols') {
        return {
          insert: vi.fn().mockImplementation((data: any) => {
            insertedPayload = data;
            return Promise.resolve({ data: null, error: null });
          }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'calendar_items') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const { user } = renderForm({ prefillCalendarItemId: 'deleted-item' });
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Select Customer'));
    await user.click(screen.getByText('Utwórz protokół'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Protokół utworzony');
    });
    expect(insertedPayload).toBeDefined();
    expect(insertedPayload.calendar_item_id).toBeUndefined();
  });

  it('clears customer data when Clear Customer is clicked', async () => {
    const { user } = renderForm();
    await waitFor(() => {
      expect(screen.getByText('Utwórz protokół')).toBeInTheDocument();
    });

    // Select then clear
    await user.click(screen.getByText('Select Customer'));
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jan Kowalski')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Clear Customer'));
    await waitFor(() => {
      expect(screen.queryByDisplayValue('Jan Kowalski')).not.toBeInTheDocument();
    });
  });
});
