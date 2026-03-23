import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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
let capturedOnSelect: ((customer: { id: string; name: string; phone: string }) => void) | null =
  null;
let capturedOnClear: (() => void) | null = null;

vi.mock('@/components/ui/client-search-autocomplete', () => ({
  default: ({
    value,
    onChange,
    onSelect,
    onClear,
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
  }) => {
    capturedOnChange = onChange;
    capturedOnSelect = onSelect ?? null;
    capturedOnClear = onClear ?? null;
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

// ---- Contexts required by CarSearchAutocomplete (mocked above but context still needed) ----
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
    mockFrom.mockImplementation(() => createChainMock([], null));
  });

  // ---- Test 1: Custom name input ----
  it('calls onCustomerChange with name when user types in name field', async () => {
    const onCustomerChange = vi.fn();
    render(<CustomerDataStep {...defaultProps} onCustomerChange={onCustomerChange} />);

    // The ClientSearchAutocomplete mock captures onChange
    expect(capturedOnChange).not.toBeNull();
    act(() => {
      capturedOnChange!('Jan Kowalski');
    });

    expect(onCustomerChange).toHaveBeenCalledWith({ name: 'Jan Kowalski' });
  });

  // ---- Test 2: Selecting customer from name autocomplete fills phone ----
  it('calls onCustomerChange with name and phone when customer is selected from name autocomplete', async () => {
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

  // ---- Test 3: Phone search shows dropdown ----
  it('shows phone dropdown with customer names after typing digits in phone field', async () => {
    const user = userEvent.setup();

    const mockCustomers = [
      { id: 'c1', name: 'Anna Nowak', phone: '123456789', email: 'anna@example.com' },
      { id: 'c2', name: 'Piotr Wiśniewski', phone: '123000000', email: null },
    ];
    mockFrom.mockImplementation(() => createChainMock(mockCustomers, null));

    // Use a stateful wrapper so that customerData.phone updates when onCustomerChange is called.
    // The component's phone-search useEffect watches customerData.phone, which is a controlled prop.
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

    // Type digits — PhoneMaskedInput strips non-digits and calls onChange with raw digits
    await user.type(phoneInput, '123456');

    await waitFor(() => {
      expect(screen.getByText('Anna Nowak')).toBeInTheDocument();
    });

    expect(screen.getByText('Piotr Wiśniewski')).toBeInTheDocument();
  });

  // ---- Test 4: Selecting from phone dropdown fills all fields ----
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

  // ---- Test 5: Clearing name clears all customer fields ----
  it('calls onCustomerChange with empty name and phone when name field is cleared (preserves email)', async () => {
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

  // ---- Test 6: Phone search ignores short input ----
  it('does not query supabase when fewer than 3 digits are typed in phone field', async () => {
    const user = userEvent.setup();

    render(
      <CustomerDataStep {...defaultProps} customerData={{ ...defaultCustomerData, phone: '' }} />,
    );

    const phoneInput = screen.getByTestId('phone-input');
    // Type only 2 digits
    await user.type(phoneInput, '12');

    // Wait to ensure no debounced query fires
    await new Promise((r) => setTimeout(r, 400));

    expect(mockFrom).not.toHaveBeenCalled();
  });
});
