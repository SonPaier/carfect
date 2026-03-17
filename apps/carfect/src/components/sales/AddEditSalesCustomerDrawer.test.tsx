import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddEditSalesCustomerDrawer from './AddEditSalesCustomerDrawer';

// Mock supabase
const mockFrom = vi.fn();
const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'order',
    'limit',
    'single',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({ data: resolveData, error: resolveError }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return {
    ...actual,
    useIsMobile: () => false,
  };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('./hooks/useGusLookup', () => ({
  useGusLookup: () => ({
    lookupNip: vi.fn(),
    loading: false,
  }),
}));

const mockCustomer = {
  id: 'cust-1',
  name: 'Test Firma Sp. z o.o.',
  contact_person: 'Jan Kowalski',
  phone: '+48123456789',
  email: 'jan@firma.pl',
  default_currency: 'PLN',
  discount_percent: 10,
  is_net_payer: true,
  sales_notes: 'Notatka testowa',
  shipping_addressee: 'Magazyn centralny',
  shipping_country_code: 'PL',
  shipping_street: 'ul. Wysyłkowa 5',
  shipping_street_line2: null,
  shipping_postal_code: '00-001',
  shipping_city: 'Warszawa',
  nip: '1234567890',
  company: 'Test Firma Sp. z o.o.',
  billing_street: 'ul. Firmowa 10',
  billing_postal_code: '00-002',
  billing_city: 'Kraków',
  billing_country_code: 'PL',
  billing_street_line2: null,
  shipping_same_as_billing: false,
};

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  customer: null as typeof mockCustomer | null,
  instanceId: 'inst-1',
  onSaved: vi.fn(),
};

describe('AddEditSalesCustomerDrawer', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(createChainMock([]));
  });

  describe('New customer form — field order', () => {
    it('renders Nazwa and NIP in section 1', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.getByLabelText('Nazwa *')).toBeInTheDocument();
      expect(screen.getByLabelText('NIP')).toBeInTheDocument();
    });

    it('renders GUS button next to NIP', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Pobierz dane z GUS/i })).toBeInTheDocument();
    });

    it('renders contact fields in correct order after separator', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      const labels = screen.getAllByText(
        /^(Telefon \*|Email|Osoba kontaktowa|Waluta|Rabat|Płatnik netto)$/,
      );
      const labelTexts = labels.map((el) => el.textContent);
      expect(labelTexts).toEqual([
        'Telefon *',
        'Email',
        'Osoba kontaktowa',
        'Waluta',
        'Rabat',
        'Płatnik netto',
      ]);
    });

    it('renders Adres firmy section', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.getByText('Adres firmy')).toBeInTheDocument();
    });

    it('renders Adres nadawcy section with checkbox', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.getByText('Adres nadawcy')).toBeInTheDocument();
      expect(screen.getByLabelText('Taki sam jak adres firmy')).toBeInTheDocument();
    });

    it('renders Notatki at the bottom', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.getByLabelText('Notatki')).toBeInTheDocument();
    });
  });

  describe('Address line 2 — conditional visibility', () => {
    it('hides billing line 2 when country is PL', () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      expect(screen.queryByPlaceholderText('Linia 2')).not.toBeInTheDocument();
    });

    it('shows billing line 2 when country is not PL', async () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);
      // Use the billing country select (first one with id="billing-country")
      const billingCountryTrigger = document.getElementById('billing-country')!;
      await user.click(billingCountryTrigger);
      const option = screen.getByRole('option', { name: 'Niemcy' });
      await user.click(option);

      expect(screen.getByPlaceholderText('Linia 2')).toBeInTheDocument();
    });
  });

  describe('Shipping same as billing', () => {
    it('collapses sender address fields when checkbox is checked', async () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);

      // Sender fields should be visible initially
      expect(screen.getByLabelText('Adresat')).toBeInTheDocument();

      // Check the "same as billing" checkbox
      const checkbox = screen.getByLabelText('Taki sam jak adres firmy');
      await user.click(checkbox);

      // Sender fields should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText('Adresat')).not.toBeInTheDocument();
      });
    });

    it('expands sender address fields when checkbox is unchecked', async () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} />);

      const checkbox = screen.getByLabelText('Taki sam jak adres firmy');
      // Check
      await user.click(checkbox);
      await waitFor(() => {
        expect(screen.queryByLabelText('Adresat')).not.toBeInTheDocument();
      });

      // Uncheck
      await user.click(checkbox);
      await waitFor(() => {
        expect(screen.getByLabelText('Adresat')).toBeInTheDocument();
      });
    });
  });

  describe('Save — shipping sync', () => {
    it('syncs billing to shipping when shippingSameAsBilling is checked', async () => {
      const onSaved = vi.fn();
      const updateChain = createChainMock(null, null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_customers') return updateChain;
        return createChainMock([]);
      });

      render(
        <AddEditSalesCustomerDrawer
          {...defaultProps}
          customer={mockCustomer}
          initialEditMode
          onSaved={onSaved}
        />,
      );

      // Check "same as billing"
      const checkbox = screen.getByLabelText('Taki sam jak adres firmy');
      await user.click(checkbox);

      // Save
      const saveBtn = screen.getByRole('button', { name: 'Zapisz' });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateChain.update).toHaveBeenCalled();
      });

      const payload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload.shipping_same_as_billing).toBe(true);
      expect(payload.shipping_street).toBe(payload.billing_street);
      expect(payload.shipping_postal_code).toBe(payload.billing_postal_code);
      expect(payload.shipping_city).toBe(payload.billing_city);
      expect(payload.shipping_country_code).toBe(payload.billing_country_code);
    });

    it('sets company to name for Apaczka backward compatibility', async () => {
      const updateChain = createChainMock(null, null);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'sales_customers') return updateChain;
        return createChainMock([]);
      });

      render(
        <AddEditSalesCustomerDrawer
          {...defaultProps}
          customer={mockCustomer}
          initialEditMode
          onSaved={vi.fn()}
        />,
      );

      const saveBtn = screen.getByRole('button', { name: 'Zapisz' });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateChain.update).toHaveBeenCalled();
      });

      const payload = (updateChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload.company).toBe(payload.name);
    });
  });

  describe('Cancel — form revert', () => {
    it('reverts form state when canceling edit mode', async () => {
      render(
        <AddEditSalesCustomerDrawer {...defaultProps} customer={mockCustomer} initialEditMode />,
      );

      // Change the name
      const nameInput = screen.getByLabelText('Nazwa *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');
      expect(nameInput).toHaveValue('Changed Name');

      // Cancel — reverts to view mode
      const cancelBtn = screen.getByRole('button', { name: 'Anuluj' });
      await user.click(cancelBtn);

      // Now in view mode — click edit (pencil) button to re-enter edit mode
      const pencilBtn = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('.lucide-pencil'));
      expect(pencilBtn).toBeDefined();
      await user.click(pencilBtn!);

      // Name should be reverted to original
      const revertedInput = screen.getByLabelText('Nazwa *');
      expect(revertedInput).toHaveValue('Test Firma Sp. z o.o.');
    });
  });

  describe('View mode', () => {
    it('shows "Taki sam jak adres firmy" when shipping_same_as_billing is true', async () => {
      render(
        <AddEditSalesCustomerDrawer
          {...defaultProps}
          customer={{ ...mockCustomer, shipping_same_as_billing: true }}
        />,
      );

      const dataTab = screen.getByRole('tab', { name: 'Dane' });
      await user.click(dataTab);

      expect(screen.getByText('Taki sam jak adres firmy')).toBeInTheDocument();
    });

    it('shows NIP in view mode', async () => {
      render(<AddEditSalesCustomerDrawer {...defaultProps} customer={mockCustomer} />);

      const dataTab = screen.getByRole('tab', { name: 'Dane' });
      await user.click(dataTab);

      expect(screen.getByText('1234567890')).toBeInTheDocument();
    });
  });
});
