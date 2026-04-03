import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerDataStep } from './CustomerDataStep';

// ---- Supabase mock ----
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'or',
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
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

// ---- Mock child components ----

// Capture callbacks from ClientSearchAutocomplete for test control
let capturedOnChange: ((val: string) => void) | null = null;
let capturedOnSelect: ((customer: { id: string; name: string; phone: string; email?: string | null }) => void) | null = null;
let capturedOnClear: (() => void) | null = null;
let capturedSuppressAutoSearch: boolean | undefined = undefined;

vi.mock('@/components/ui/client-search-autocomplete', () => ({
  default: ({
    value,
    onChange,
    onSelect,
    onClear,
    suppressAutoSearch,
  }: {
    instanceId: string;
    value: string;
    onChange: (val: string) => void;
    onSelect?: (customer: {
      id: string;
      name: string;
      phone: string;
      email?: string | null;
    }) => void;
    onClear?: () => void;
    className?: string;
    suppressAutoSearch?: boolean;
  }) => {
    capturedOnChange = onChange;
    capturedOnSelect = onSelect ?? null;
    capturedOnClear = onClear ?? null;
    capturedSuppressAutoSearch = suppressAutoSearch;
    return (
      <input
        data-testid="client-search-autocomplete"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  },
}));

vi.mock('@/components/ui/car-search-autocomplete', () => ({
  CarSearchAutocomplete: ({ value }: { value: string; onChange: unknown; error?: boolean }) => (
    <input data-testid="car-search-autocomplete" defaultValue={value} readOnly />
  ),
}));

vi.mock('@/contexts/CarModelsContext', () => ({
  useCarModels: () => ({ searchModels: () => [] }),
}));

// ---- Default test data ----
const defaultCustomerData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  nip: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
};

const defaultVehicleData = {
  brandModel: '',
  paintColor: '',
  paintType: 'gloss',
};

const defaultProps = {
  instanceId: 'inst-1',
  customerData: defaultCustomerData,
  vehicleData: defaultVehicleData,
  onCustomerChange: vi.fn(),
  onVehicleChange: vi.fn(),
};

describe('CustomerDataStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnChange = null;
    capturedOnSelect = null;
    capturedOnClear = null;
    capturedSuppressAutoSearch = undefined;
    mockFrom.mockImplementation(() => createChainMock([], null));
  });

  // ---- Section headers ----

  it('does NOT render "Dane klienta" section header', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByText('Dane klienta')).not.toBeInTheDocument();
  });

  it('does NOT render "Dane pojazdu" section header', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByText('Dane pojazdu')).not.toBeInTheDocument();
  });

  // ---- Company section collapsed by default ----

  it('renders company section header "Dane firmy (opcjonalne)" collapsed by default', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.getByText('Dane firmy (opcjonalne)')).toBeInTheDocument();
  });

  it('does not show NIP field when company section is collapsed by default', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByLabelText('NIP')).not.toBeInTheDocument();
  });

  it('does not show company name, address, postal code, city fields when section is collapsed', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByLabelText('Nazwa firmy')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Adres (ulica i numer)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Kod pocztowy')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Miejscowość')).not.toBeInTheDocument();
  });

  it('does not show GUS button when company section is collapsed', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByText('GUS')).not.toBeInTheDocument();
  });

  // ---- Company section expanded on click ----

  it('expands company section showing NIP field and GUS button when header is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerDataStep {...defaultProps} />);

    await user.click(screen.getByText('Dane firmy (opcjonalne)'));

    expect(screen.getByLabelText('NIP')).toBeInTheDocument();
    expect(screen.getByText('GUS')).toBeInTheDocument();
  });

  it('shows only NIP + GUS after expanding (no company name/address fields when no company data)', async () => {
    const user = userEvent.setup();
    render(<CustomerDataStep {...defaultProps} />);

    await user.click(screen.getByText('Dane firmy (opcjonalne)'));

    expect(screen.getByLabelText('NIP')).toBeInTheDocument();
    expect(screen.getByText('GUS')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nazwa firmy')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Adres (ulica i numer)')).not.toBeInTheDocument();
  });

  it('collapses company section again when header is clicked a second time', async () => {
    const user = userEvent.setup();
    render(<CustomerDataStep {...defaultProps} />);

    await user.click(screen.getByText('Dane firmy (opcjonalne)'));
    expect(screen.getByLabelText('NIP')).toBeInTheDocument();

    await user.click(screen.getByText('Dane firmy (opcjonalne)'));
    expect(screen.queryByLabelText('NIP')).not.toBeInTheDocument();
  });

  // ---- Company section auto-expanded when existing company data ----

  it('renders company section expanded when customerData already has NIP', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, nip: '1234567890' }}
      />,
    );
    expect(screen.getByLabelText('NIP')).toBeInTheDocument();
  });

  it('renders company section expanded when customerData already has company name', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, company: 'ACME Sp. z o.o.' }}
      />,
    );
    expect(screen.getByLabelText('NIP')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa firmy')).toBeInTheDocument();
  });

  // ---- GUS lookup — company fields appear after success ----

  it('shows company name, address, postal code, city fields after successful GUS lookup', async () => {
    const user = userEvent.setup();

    // Mock fetch for GUS API
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          subject: {
            name: 'Test Firma Sp. z o.o.',
            workingAddress: 'ul. Testowa 1, 00-001 Warszawa',
          },
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const onCustomerChange = vi.fn();

    // Use stateful wrapper so customerData updates propagate
    const StatefulWrapper = () => {
      const [customerData, setCustomerData] = React.useState({
        ...defaultCustomerData,
        nip: '1234567890',
      });
      return (
        <CustomerDataStep
          {...defaultProps}
          customerData={customerData}
          onCustomerChange={(partial) => {
            onCustomerChange(partial);
            setCustomerData((prev) => ({ ...prev, ...partial }));
          }}
        />
      );
    };

    render(<StatefulWrapper />);

    // Section should be expanded because NIP is set
    expect(screen.getByLabelText('NIP')).toBeInTheDocument();

    await user.click(screen.getByText('GUS'));

    await waitFor(() => {
      expect(screen.getByLabelText('Nazwa firmy')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Adres (ulica i numer)')).toBeInTheDocument();
    expect(screen.getByLabelText('Kod pocztowy')).toBeInTheDocument();
    expect(screen.getByLabelText('Miejscowość')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('calls onCustomerChange with company data after successful GUS lookup', async () => {
    const user = userEvent.setup();

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          subject: {
            name: 'Test Firma Sp. z o.o.',
            workingAddress: 'ul. Testowa 1, 00-001 Warszawa',
          },
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const onCustomerChange = vi.fn();
    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, nip: '1234567890' }}
        onCustomerChange={onCustomerChange}
      />,
    );

    await user.click(screen.getByText('GUS'));

    await waitFor(() => {
      expect(onCustomerChange).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Test Firma Sp. z o.o.',
        }),
      );
    });

    vi.unstubAllGlobals();
  });

  it('shows error toast when GUS lookup NIP is shorter than 10 digits', async () => {
    const user = userEvent.setup();
    // nip='123' is truthy, so section auto-expands — no need to click header
    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, nip: '123' }}
      />,
    );

    // Section is already expanded because nip is set
    expect(screen.getByText('GUS')).toBeInTheDocument();
    await user.click(screen.getByText('GUS'));

    expect(mockToast.error).toHaveBeenCalledWith('Wprowadź poprawny NIP (10 cyfr)');
  });

  // ---- Vehicle section labels ----

  it('renders label "Marka i model pojazdu *" for the vehicle brand/model field', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.getByText('Marka i model pojazdu *')).toBeInTheDocument();
  });

  // ---- Notes label ----

  it('renders label "Notatka własna" for the internal notes field when onInternalNotesChange is provided', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        internalNotes=""
        onInternalNotesChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Notatka własna')).toBeInTheDocument();
  });

  it('does not render "Notatka wewnętrzna" label', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        internalNotes=""
        onInternalNotesChange={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Notatka wewnętrzna/i)).not.toBeInTheDocument();
  });

  it('does not render internal notes field when onInternalNotesChange is not provided', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.queryByText('Notatka własna')).not.toBeInTheDocument();
  });

  // ---- Placeholders removed from textareas ----

  it('inquiry content textarea has no placeholder text', () => {
    render(<CustomerDataStep {...defaultProps} />);
    const inquiryTextarea = screen.getByLabelText('Treść zapytania');
    expect(inquiryTextarea).toHaveAttribute('placeholder', '');
  });

  it('internal notes textarea has no placeholder text', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        internalNotes=""
        onInternalNotesChange={vi.fn()}
      />,
    );
    const notesTextarea = screen.getByLabelText('Notatka własna');
    expect(notesTextarea).toHaveAttribute('placeholder', '');
  });

  // ---- suppressAutoSearch passed to ClientSearchAutocomplete ----

  it('passes suppressAutoSearch=true to ClientSearchAutocomplete when name has a value', () => {
    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, name: 'Jan Kowalski' }}
      />,
    );
    expect(capturedSuppressAutoSearch).toBe(true);
  });

  it('passes suppressAutoSearch=false to ClientSearchAutocomplete when name is empty', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(capturedSuppressAutoSearch).toBe(false);
  });

  // ---- phoneUserInteractedRef prevents phone dropdown on mount ----

  it('does not show phone dropdown on mount even when existing phone data is present', async () => {
    mockFrom.mockImplementation(() =>
      createChainMock(
        [{ id: 'c1', name: 'Jan Kowalski', phone: '123456789', email: 'jan@example.com' }],
        null,
      ),
    );

    render(
      <CustomerDataStep
        {...defaultProps}
        customerData={{ ...defaultCustomerData, phone: '123456789' }}
      />,
    );

    // Wait to ensure no debounced query fires
    await new Promise((r) => setTimeout(r, 400));

    expect(screen.queryByText('Jan Kowalski')).not.toBeInTheDocument();
  });

  // ---- Customer info basic functionality ----

  it('calls onCustomerChange with name when user types in name field', async () => {
    const onCustomerChange = vi.fn();
    render(<CustomerDataStep {...defaultProps} onCustomerChange={onCustomerChange} />);

    expect(capturedOnChange).not.toBeNull();
    act(() => {
      capturedOnChange!('Jan Kowalski');
    });

    expect(onCustomerChange).toHaveBeenCalledWith({ name: 'Jan Kowalski' });
  });

  it('calls onCustomerChange with name, phone, and email when customer is selected from name autocomplete', async () => {
    const onCustomerChange = vi.fn();
    render(<CustomerDataStep {...defaultProps} onCustomerChange={onCustomerChange} />);

    expect(capturedOnSelect).not.toBeNull();
    act(() => {
      capturedOnSelect!({
        id: '1',
        name: 'Jan Kowalski',
        phone: '+48111222333',
        email: 'jan@test.pl',
      });
    });

    expect(onCustomerChange).toHaveBeenCalledWith({
      name: 'Jan Kowalski',
      phone: '+48111222333',
      email: 'jan@test.pl',
    });
  });

  it('calls onCustomerChange with empty name and phone when name field is cleared', async () => {
    const onCustomerChange = vi.fn();
    render(
      <CustomerDataStep
        {...defaultProps}
        onCustomerChange={onCustomerChange}
        customerData={{
          ...defaultCustomerData,
          name: 'Jan Kowalski',
          phone: '111222333',
          email: 'jan@example.com',
        }}
      />,
    );

    expect(capturedOnClear).not.toBeNull();
    act(() => {
      capturedOnClear!();
    });

    expect(onCustomerChange).toHaveBeenCalledWith({ name: '', phone: '' });
  });

  // ---- Phone search ----

  it('shows phone dropdown with customer names after typing digits in phone field', async () => {
    const user = userEvent.setup();

    const mockCustomers = [
      { id: 'c1', name: 'Anna Nowak', phone: '123456789', email: 'anna@example.com' },
      { id: 'c2', name: 'Piotr Wiśniewski', phone: '123000000', email: null },
    ];
    mockFrom.mockImplementation(() => createChainMock(mockCustomers, null));

    const StatefulWrapper = () => {
      const [customerData, setCustomerData] = React.useState({ ...defaultCustomerData, phone: '' });
      return (
        <CustomerDataStep
          {...defaultProps}
          customerData={customerData}
          onCustomerChange={(partial) => setCustomerData((prev) => ({ ...prev, ...partial }))}
        />
      );
    };

    render(<StatefulWrapper />);

    const phoneInput = screen.getByTestId('phone-input');
    await user.type(phoneInput, '123456');

    await waitFor(() => {
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    });

    expect(screen.getByText('Piotr Wiśniewski')).toBeInTheDocument();
  });

  it('calls onCustomerChange with name, phone, and email when a phone dropdown result is clicked', async () => {
    const user = userEvent.setup();
    const onCustomerChange = vi.fn();

    const mockCustomers = [
      { id: 'c1', name: 'Anna Nowak', phone: '123456789', email: 'anna@example.com' },
    ];
    mockFrom.mockImplementation(() => createChainMock(mockCustomers, null));

    const StatefulWrapper = () => {
      const [customerData, setCustomerData] = React.useState({ ...defaultCustomerData, phone: '' });
      return (
        <CustomerDataStep
          {...defaultProps}
          customerData={customerData}
          onCustomerChange={(partial) => {
            onCustomerChange(partial);
            setCustomerData((prev) => ({ ...prev, ...partial }));
          }}
        />
      );
    };

    render(<StatefulWrapper />);

    const phoneInput = screen.getByTestId('phone-input');
    await user.type(phoneInput, '123456');

    await waitFor(() => {
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Anna Nowak'));

    expect(onCustomerChange).toHaveBeenCalledWith({
      name: 'Anna Nowak',
      phone: '123456789',
      email: 'anna@example.com',
    });
  });

  it('does not query supabase when fewer than 3 digits are typed in phone field', async () => {
    const user = userEvent.setup();

    render(
      <CustomerDataStep {...defaultProps} customerData={{ ...defaultCustomerData, phone: '' }} />,
    );

    const phoneInput = screen.getByTestId('phone-input');
    await user.type(phoneInput, '12');

    await new Promise((r) => setTimeout(r, 400));

    expect(mockFrom).not.toHaveBeenCalled();
  });

  // ---- Email validation ----

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<CustomerDataStep {...defaultProps} />);

    const emailInput = screen.getByLabelText('Email *');
    await user.type(emailInput, 'not-an-email');

    await waitFor(() => {
      expect(screen.getByText('Nieprawidłowy format adresu email')).toBeInTheDocument();
    });
  });

  it('shows error for common gmail domain typo', async () => {
    render(<CustomerDataStep {...defaultProps} />);

    const emailInput = screen.getByLabelText('Email *');
    fireEvent.change(emailInput, { target: { value: 'test@gmial.com' } });

    await waitFor(() => {
      expect(screen.getByText(/gmail\.com/)).toBeInTheDocument();
    });
  });

  it('strips mailto: prefix when email is pasted', async () => {
    const onCustomerChange = vi.fn();
    render(<CustomerDataStep {...defaultProps} onCustomerChange={onCustomerChange} />);

    const emailInput = screen.getByLabelText('Email *');

    // Use fireEvent.paste which triggers React's synthetic onPaste handler
    fireEvent.paste(emailInput, {
      clipboardData: {
        getData: (type: string) => (type === 'text' ? 'mailto:test@example.com' : ''),
      },
    });

    expect(onCustomerChange).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com' }),
    );
  });

  // ---- Inquiry content field ----

  it('renders "Treść zapytania" label for inquiry content field', () => {
    render(<CustomerDataStep {...defaultProps} />);
    expect(screen.getByText('Treść zapytania')).toBeInTheDocument();
  });

  it('calls onCustomerChange with inquiryContent when user types in inquiry textarea', async () => {
    const user = userEvent.setup();
    const onCustomerChange = vi.fn();
    render(<CustomerDataStep {...defaultProps} onCustomerChange={onCustomerChange} />);

    const textarea = screen.getByLabelText('Treść zapytania');
    await user.type(textarea, 'Hello');

    expect(onCustomerChange).toHaveBeenCalledWith(
      expect.objectContaining({ inquiryContent: expect.stringContaining('H') }),
    );
  });
});
