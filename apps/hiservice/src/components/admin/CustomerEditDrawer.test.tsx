import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomerEditDrawer from './CustomerEditDrawer';
import { mockSupabase, mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('@/hooks/useCustomerCategories', () => ({
  useCustomerCategories: () => ({
    categories: [],
    assignments: [],
    customerCounts: {},
    customerCategoryMap: new Map(),
    loading: false,
    refetch: vi.fn(),
  }),
  syncCustomerCategoryAssignments: vi.fn(),
}));

vi.mock('@/hooks/useInstanceFeatures', () => ({
  useInstanceFeature: () => ({ enabled: false, loading: false, toggle: vi.fn() }),
}));

vi.mock('@/hooks/useEmployees', () => ({
  useEmployees: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/useNotifications', () => ({
  createNotification: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AddressSearchInput to avoid external API calls
vi.mock('./AddressSearchInput', () => ({
  default: () => <input placeholder="Szukaj adresu..." />,
}));

const defaultProps = {
  customer: null,
  instanceId: 'test-instance-id',
  open: true,
  onClose: vi.fn(),
  onCustomerUpdated: vi.fn(),
  isAddMode: true,
};

function renderDrawer(props = {}) {
  const user = userEvent.setup();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <CustomerEditDrawer {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
  return { user, ...result };
}

function getInputByLabel(labelText: string): HTMLInputElement | HTMLTextAreaElement {
  const label = screen.getByText(labelText, { exact: false });
  const parent = label.closest('div')!;
  const input = parent.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
  if (!input) throw new Error(`No input found for label "${labelText}"`);
  return input;
}

// Hoist mocked toast — safe because sonner is vi.mock'd at module level
const toastMock = vi.mocked((await import('sonner')).toast);

describe('CustomerEditDrawer — add mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMocks();

    // Default mock for new customer insert
    mockSupabaseQuery(
      'customers',
      {
        data: { id: 'new-customer-id' },
        error: null,
      },
      'insert',
    );

    mockSupabaseQuery(
      'customers',
      {
        data: null,
        error: null,
      },
      'select',
    );

    mockSupabaseQuery(
      'customer_addresses',
      {
        data: { id: 'new-addr-id' },
        error: null,
      },
      'insert',
    );

    mockSupabaseQuery(
      'customer_category_assignments',
      {
        data: [],
        error: null,
      },
      'select',
    );
  });

  describe('rendering', () => {
    it('renders "Nowy klient" title in add mode', () => {
      renderDrawer();
      expect(screen.getByText('Nowy klient')).toBeInTheDocument();
    });

    it('renders required form fields', () => {
      renderDrawer();
      expect(getInputByLabel('Imię i nazwisko')).toBeInTheDocument();
      expect(getInputByLabel('Telefon')).toBeInTheDocument();
      expect(getInputByLabel('Email')).toBeInTheDocument();
      expect(getInputByLabel('Notatki')).toBeInTheDocument();
    });

    it('renders save and cancel buttons', () => {
      renderDrawer();
      expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Anuluj' })).toBeInTheDocument();
    });

    it('renders company data section (collapsed)', () => {
      renderDrawer();
      expect(screen.getByText('Dane firmy')).toBeInTheDocument();
    });

    it('renders addresses section', () => {
      renderDrawer();
      expect(screen.getByText('Adresy serwisowe')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderDrawer({ open: false });
      expect(screen.queryByText('Nowy klient')).not.toBeInTheDocument();
    });

    it('starts with empty fields in add mode', () => {
      renderDrawer();
      expect(getInputByLabel('Imię i nazwisko')).toHaveValue('');
      expect(getInputByLabel('Telefon')).toHaveValue('');
      expect(getInputByLabel('Email')).toHaveValue('');
    });

    it('uses prefilledName when provided', () => {
      renderDrawer({ prefilledName: 'Jan Kowalski' });
      expect(getInputByLabel('Imię i nazwisko')).toHaveValue('Jan Kowalski');
    });
  });

  describe('validation', () => {
    it('shows error when name is empty on save', async () => {
      const { user } = renderDrawer();

      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      expect(toastMock.error).toHaveBeenCalledWith('Imię i nazwisko jest wymagane');
    });

    it('shows error when name is only whitespace', async () => {
      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), '   ');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      expect(toastMock.error).toHaveBeenCalledWith('Imię i nazwisko jest wymagane');
    });

    it('shows error when phone is empty on save (bugfix regression)', async () => {
      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Jan Kowalski');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      expect(toastMock.error).toHaveBeenCalledWith('Telefon jest wymagany');
    });

    it('does not show error when name is provided', async () => {
      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Jan Kowalski');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      expect(toastMock.error).not.toHaveBeenCalledWith('Imię i nazwisko jest wymagane');
    });
  });

  describe('submission — new customer', () => {
    it('creates a new customer with name and phone', async () => {
      const onClose = vi.fn();
      const onCustomerUpdated = vi.fn();
      const { user } = renderDrawer({ onClose, onCustomerUpdated });

      await user.type(getInputByLabel('Imię i nazwisko'), 'Anna Nowak');
      await user.type(getInputByLabel('Telefon'), '600200300');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      });

      await waitFor(() => {
        expect(toastMock.success).toHaveBeenCalledWith('Klient zapisany');
      });
      expect(onClose).toHaveBeenCalled();
      expect(onCustomerUpdated).toHaveBeenCalled();
    });

    it('calls onCustomerCreated callback with customer data', async () => {
      const onCustomerCreated = vi.fn();
      const { user } = renderDrawer({ onCustomerCreated });

      await user.type(getInputByLabel('Imię i nazwisko'), 'Piotr Zieliński');
      await user.type(getInputByLabel('Telefon'), '700300400');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(onCustomerCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'new-customer-id',
            name: 'Piotr Zieliński',
            phone: '+48700300400',
          }),
          undefined, // no addresses => no firstAddressId
        );
      });
    });

    it('checks for existing customer by phone before insert', async () => {
      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Test');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        // Should call customers select (duplicate check via maybeSingle)
        expect(mockSupabase.from).toHaveBeenCalledWith('customers');
      });
    });

    it('updates existing customer if phone already exists', async () => {
      // Mock: existing customer found by phone
      mockSupabaseQuery(
        'customers',
        {
          data: { id: 'existing-customer-id' },
          error: null,
        },
        'select',
      );

      mockSupabaseQuery(
        'customers',
        {
          data: { id: 'existing-customer-id' },
          error: null,
        },
        'update',
      );

      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Updated Name');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toastMock.success).toHaveBeenCalledWith('Zaktualizowano istniejącego klienta');
      });
    });

    it('submits with email and notes', async () => {
      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Jan Kowalski');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.type(getInputByLabel('Email'), 'jan@example.com');
      await user.type(getInputByLabel('Notatki'), 'Ważny klient');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toastMock.success).toHaveBeenCalledWith('Klient zapisany');
      });
    });
  });

  describe('error handling', () => {
    it('shows error toast on supabase insert failure', async () => {
      mockSupabaseQuery(
        'customers',
        {
          data: null,
          error: { message: 'Database error' },
        },
        'insert',
      );

      const { user } = renderDrawer();

      await user.type(getInputByLabel('Imię i nazwisko'), 'Test');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalledWith('Błąd zapisywania klienta');
      });
    });

    it('does not call onClose on error', async () => {
      mockSupabaseQuery(
        'customers',
        {
          data: null,
          error: { message: 'Database error' },
        },
        'insert',
      );

      const onClose = vi.fn();
      const { user } = renderDrawer({ onClose });

      await user.type(getInputByLabel('Imię i nazwisko'), 'Test');
      await user.type(getInputByLabel('Telefon'), '500100200');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      await waitFor(() => {
        expect(toastMock.error).toHaveBeenCalled();
      });
      // onClose should NOT have been called
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('cancel behavior', () => {
    it('calls onClose when cancel is clicked in add mode', async () => {
      const onClose = vi.fn();
      const { user } = renderDrawer({ onClose });

      await user.click(screen.getByRole('button', { name: 'Anuluj' }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('company data section', () => {
    it('expands company data section on click', async () => {
      const { user } = renderDrawer();

      await user.click(screen.getByText('Dane firmy'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0000000000')).toBeInTheDocument();
      });
    });
  });

  describe('categories', () => {
    it('renders category checkboxes when categories provided', () => {
      const categories = [
        { id: 'cat-1', name: 'VIP', sort_order: 0 },
        { id: 'cat-2', name: 'Firma', sort_order: 1 },
      ];
      renderDrawer({ customerCategories: categories });

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Firma')).toBeInTheDocument();
    });

    it('toggles category selection', async () => {
      const categories = [{ id: 'cat-1', name: 'VIP', sort_order: 0 }];
      const { user } = renderDrawer({ customerCategories: categories });

      const checkbox = screen.getByRole('checkbox', { name: 'VIP' });
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe('null safety', () => {
    it('handles null instanceId gracefully', async () => {
      const { user } = renderDrawer({ instanceId: null });

      await user.type(getInputByLabel('Imię i nazwisko'), 'Test');
      await user.click(screen.getByRole('button', { name: 'Zapisz' }));

      // Should return early without calling supabase
      expect(toastMock.success).not.toHaveBeenCalled();
      expect(toastMock.error).not.toHaveBeenCalled();
    });
  });
});
