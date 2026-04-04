import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductsSummaryStepV2 } from './ProductsSummaryStepV2';
import type { OfferState, OfferOption } from '@/hooks/useOffer';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock OfferProductPickerDrawer — controllable stub
vi.mock('./OfferProductPickerDrawer', () => ({
  OfferProductPickerDrawer: ({
    open,
    onConfirm,
    onClose,
  }: {
    open: boolean;
    onConfirm: (products: Array<{ id: string; name: string; short_name: string | null; description: string | null; price: number }>) => void;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="picker-drawer">
        <button
          data-testid="picker-add-with-id"
          onClick={() => {
            onConfirm([{ id: 'prod-a', name: 'Usługa A', short_name: null, description: 'Opis A', price: 200 }]);
            onClose();
          }}
        >
          Add Usługa A
        </button>
        <button
          data-testid="picker-add-without-id"
          onClick={() => {
            onConfirm([{ id: '', name: 'Custom Service', short_name: null, description: null, price: 150 }]);
            onClose();
          }}
        >
          Add Custom
        </button>
      </div>
    ) : null,
}));

// Mock ConditionsSection — not under test here
vi.mock('./summary/ConditionsSection', () => ({
  ConditionsSection: () => <div data-testid="conditions-section" />,
}));

// Mock ServiceFormDialog — controllable stub
let mockServiceFormDialogOnSaved: (() => void) | null = null;
vi.mock('@/components/admin/ServiceFormDialog', () => ({
  ServiceFormDialog: ({
    open,
    onSaved,
    service,
  }: {
    open: boolean;
    onSaved: () => void;
    service: { name: string } | null;
  }) => {
    mockServiceFormDialogOnSaved = onSaved;
    return open ? (
      <div data-testid="service-form-dialog">
        <span data-testid="dialog-service-name">{service?.name ?? ''}</span>
        <button data-testid="dialog-save-btn" onClick={onSaved}>
          Save
        </button>
      </div>
    ) : null;
  },
}));

// Build a minimal valid OfferState
function buildOffer(overrides: Partial<OfferState> = {}): OfferState {
  return {
    instanceId: 'test-instance-id',
    customerData: { name: '', email: '', phone: '' },
    vehicleData: {},
    selectedScopeIds: [],
    options: [],
    additions: [],
    vatRate: 23,
    hideUnitPrices: false,
    status: 'draft',
    offerFormat: 'v2',
    ...overrides,
  };
}

function buildOptionWithItems(items: OfferOption['items']): OfferOption {
  return {
    id: 'opt-1',
    name: '',
    items,
    isSelected: true,
    sortOrder: 0,
  };
}

const defaultProps = {
  instanceId: 'test-instance-id',
  offer: buildOffer(),
  showUnitPrices: true,
  isEditing: false,
  onUpdateOffer: vi.fn(),
  calculateTotalNet: vi.fn(() => 0),
  calculateTotalGross: vi.fn(() => 0),
  onShowPreview: vi.fn(),
};

describe('ProductsSummaryStepV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServiceFormDialogOnSaved = null;
    resetSupabaseMocks();
    mockSupabaseQuery('service_categories', { data: [], error: null });
    mockSupabaseQuery('unified_services', { data: null, error: null });
  });

  // --- 1. Renders product list from offer options ---

  it('renders all products from offer.options[0].items on mount', () => {
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Mycie Premium',
            quantity: 1,
            unitPrice: 300,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            customName: 'Detailing',
            quantity: 1,
            unitPrice: 800,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    expect(screen.getByText('Mycie Premium')).toBeInTheDocument();
    expect(screen.getByText('Detailing')).toBeInTheDocument();
  });

  it('does not show empty state when offer has products', () => {
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Usługa X',
            quantity: 1,
            unitPrice: 100,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    expect(screen.queryByText(/brak wybranych/i)).not.toBeInTheDocument();
  });

  // --- 2. "Opcja" toggle changes isSuggested state ---

  it('renders "Opcja" button for each product row', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    const opcjaBtn = screen.getByRole('button', { name: 'Opcja' });
    expect(opcjaBtn).toBeInTheDocument();
  });

  it('toggling "Opcja" button marks product as suggested (gold style)', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    const opcjaBtn = screen.getByRole('button', { name: 'Opcja' });

    // Before toggle: not suggested (muted style)
    expect(opcjaBtn.className).toMatch(/bg-muted/);

    await user.click(opcjaBtn);

    // After toggle: suggested (primary/gold style)
    await waitFor(() => {
      expect(opcjaBtn.className).toMatch(/bg-primary/);
    });
  });

  it('toggling "Opcja" twice restores the product to non-suggested state', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    const opcjaBtn = screen.getByRole('button', { name: 'Opcja' });

    await user.click(opcjaBtn); // suggest
    await user.click(opcjaBtn); // un-suggest

    await waitFor(() => {
      expect(opcjaBtn.className).toMatch(/bg-muted/);
    });
  });

  it('toggling "Opcja" updates isOptional in onUpdateOffer call', async () => {
    const onUpdateOffer = vi.fn();
    const user = userEvent.setup();

    render(<ProductsSummaryStepV2 {...defaultProps} onUpdateOffer={onUpdateOffer} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    onUpdateOffer.mockClear();

    const opcjaBtn = screen.getByRole('button', { name: 'Opcja' });
    await user.click(opcjaBtn);

    await waitFor(() => {
      const lastCall = onUpdateOffer.mock.calls.at(-1)?.[0];
      expect(lastCall?.options?.[0]?.items?.[0]?.isOptional).toBe(true);
    });
  });

  // --- 3. Clicking product name with productId fetches service and opens dialog ---

  it('product name with productId renders as a clickable button', () => {
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-123',
            customName: 'Klikalna Usługa',
            quantity: 1,
            unitPrice: 500,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    // Should be rendered as a button element
    const nameBtn = screen.getByRole('button', { name: 'Klikalna Usługa' });
    expect(nameBtn).toBeInTheDocument();
  });

  it('clicking product name with productId fetches the service and opens ServiceFormDialog', async () => {
    const { mockSupabase } = await import('@/test/mocks/supabase');
    const mockServiceData = {
      id: 'prod-123',
      name: 'Klikalna Usługa',
      short_name: null,
      description: null,
      price_from: 500,
      price_small: null,
      price_medium: null,
      price_large: null,
      prices_are_net: true,
      duration_minutes: null,
      category_id: null,
      service_type: 'both',
    };

    // Override single() for unified_services to return our mock service
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'unified_services') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockServiceData, error: null }),
        };
      }
      // Default: return empty for other tables
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data: [], error: null }),
      };
    });

    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-123',
            customName: 'Klikalna Usługa',
            quantity: 1,
            unitPrice: 500,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    const nameBtn = screen.getByRole('button', { name: 'Klikalna Usługa' });
    await user.click(nameBtn);

    await waitFor(() => {
      expect(screen.getByTestId('service-form-dialog')).toBeInTheDocument();
    });
  });

  // --- 4. Product name without productId renders as plain text ---

  it('product name without productId renders as plain text, not a button', () => {
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-2',
            productId: '',
            customName: 'Custom bez ID',
            quantity: 1,
            unitPrice: 100,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: true,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    // Name text should exist
    expect(screen.getByText('Custom bez ID')).toBeInTheDocument();

    // Should NOT be a button (no role=button with that name)
    expect(screen.queryByRole('button', { name: 'Custom bez ID' })).not.toBeInTheDocument();
  });

  // --- 5. Price inline edit ---

  it('clicking the price displays an input for inline editing', async () => {
    const user = userEvent.setup();
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Usługa Edytowalna',
            quantity: 1,
            unitPrice: 250,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    // Price button should show the price
    const priceBtn = screen.getByRole('button', { name: /250/ });
    expect(priceBtn).toBeInTheDocument();

    // Click to enter edit mode
    await user.click(priceBtn);

    // Input should appear
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('250');
  });

  it('pressing Enter in price input commits the new price', async () => {
    const onUpdateOffer = vi.fn();
    const user = userEvent.setup();
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Usługa Edytowalna',
            quantity: 1,
            unitPrice: 250,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} onUpdateOffer={onUpdateOffer} />);

    const priceBtn = screen.getByRole('button', { name: /250/ });
    await user.click(priceBtn);

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '999');
    await user.keyboard('{Enter}');

    // Input should be gone, price button should show updated value
    await waitFor(() => {
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /999/ })).toBeInTheDocument();
    });
  });

  it('blurring price input commits the new price', async () => {
    const user = userEvent.setup();
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Usługa Blur',
            quantity: 1,
            unitPrice: 100,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    await user.click(screen.getByRole('button', { name: /100/ }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '450');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /450/ })).toBeInTheDocument();
    });
  });

  it('entering an invalid price restores original value', async () => {
    const user = userEvent.setup();
    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-1',
            customName: 'Usługa Walidacja',
            quantity: 1,
            unitPrice: 300,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    await user.click(screen.getByRole('button', { name: /300/ }));
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, 'abc');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      // Original price restored
      expect(screen.getByRole('button', { name: /300/ })).toBeInTheDocument();
    });
  });

  // --- 6. Remove product ---

  it('clicking the remove button removes the product from the list', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    expect(screen.getByText('Usługa A')).toBeInTheDocument();

    // Find the remove button by its destructive class
    const allButtons = screen.getAllByRole('button');
    const removeBtn = allButtons.find((btn) => btn.className.includes('destructive'));
    expect(removeBtn).toBeDefined();
    await user.click(removeBtn!);

    await waitFor(() => {
      expect(screen.queryByText('Usługa A')).not.toBeInTheDocument();
    });
  });

  it('removing the last product shows the empty state message', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    const allButtons = screen.getAllByRole('button');
    const removeBtn = allButtons.find((btn) => btn.className.includes('destructive'));
    await user.click(removeBtn!);

    await waitFor(() => {
      expect(screen.getByText(/brak wybranych/i)).toBeInTheDocument();
    });
  });

  // --- 7. Add product via picker ---

  it('shows empty state initially and "Dodaj usługę" button is visible', () => {
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    expect(screen.getByText(/brak wybranych/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dodaj usługę/i })).toBeInTheDocument();
  });

  it('clicking "Dodaj usługę" opens the picker drawer', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));

    expect(screen.getByTestId('picker-drawer')).toBeInTheDocument();
  });

  it('confirming a product from picker adds it to the list and closes the drawer', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    expect(screen.queryByTestId('picker-drawer')).not.toBeInTheDocument();
    expect(screen.getByText('Usługa A')).toBeInTheDocument();
  });

  it('calls onUpdateOffer with correct OfferOption structure after adding a product', async () => {
    const onUpdateOffer = vi.fn();
    const user = userEvent.setup();

    render(<ProductsSummaryStepV2 {...defaultProps} onUpdateOffer={onUpdateOffer} />);

    await user.click(screen.getByRole('button', { name: /dodaj usługę/i }));
    await user.click(screen.getByTestId('picker-add-with-id'));

    await waitFor(() => {
      const lastCall = onUpdateOffer.mock.calls.at(-1)?.[0];
      expect(lastCall).toHaveProperty('options');
      const option: OfferOption = lastCall.options[0];
      expect(option.items).toHaveLength(1);
      expect(option.items[0]).toMatchObject({
        productId: 'prod-a',
        customName: 'Usługa A',
        unitPrice: 200,
        quantity: 1,
        unit: 'szt.',
        discountPercent: 0,
        isOptional: false,
        isCustom: false,
      });
    });
  });

  // --- 8. Empty state message ---

  it('shows "Brak wybranych usług" empty state when no products are in the offer', () => {
    render(<ProductsSummaryStepV2 {...defaultProps} offer={buildOffer()} />);

    expect(screen.getByText(/brak wybranych usług/i)).toBeInTheDocument();
  });

  // --- 9. onServiceSaved callback fires after dialog save ---

  it('fires onServiceSaved callback when ServiceFormDialog save is confirmed', async () => {
    const { mockSupabase } = await import('@/test/mocks/supabase');
    const mockServiceData = {
      id: 'prod-123',
      name: 'Usługa Do Edycji',
      short_name: null,
      description: null,
      price_from: 300,
      price_small: null,
      price_medium: null,
      price_large: null,
      prices_are_net: true,
      duration_minutes: null,
      category_id: null,
      service_type: 'both',
    };

    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'unified_services') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockServiceData, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data: [], error: null }),
      };
    });

    const onServiceSaved = vi.fn();
    const user = userEvent.setup();

    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-123',
            customName: 'Usługa Do Edycji',
            quantity: 1,
            unitPrice: 300,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(
      <ProductsSummaryStepV2
        {...defaultProps}
        offer={offer}
        onServiceSaved={onServiceSaved}
      />,
    );

    // Click product name to open edit dialog
    const nameBtn = screen.getByRole('button', { name: 'Usługa Do Edycji' });
    await user.click(nameBtn);

    await waitFor(() => {
      expect(screen.getByTestId('service-form-dialog')).toBeInTheDocument();
    });

    // Click save inside the dialog
    await user.click(screen.getByTestId('dialog-save-btn'));

    expect(onServiceSaved).toHaveBeenCalledTimes(1);
  });

  it('closes ServiceFormDialog after save', async () => {
    const { mockSupabase } = await import('@/test/mocks/supabase');
    const mockServiceData = {
      id: 'prod-456',
      name: 'Usługa Zamykana',
      short_name: null,
      description: null,
      price_from: 400,
      price_small: null,
      price_medium: null,
      price_large: null,
      prices_are_net: true,
      duration_minutes: null,
      category_id: null,
      service_type: 'both',
    };

    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === 'unified_services') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockServiceData, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (v: { data: unknown; error: null }) => void) =>
          resolve({ data: [], error: null }),
      };
    });

    const user = userEvent.setup();

    const offer = buildOffer({
      options: [
        buildOptionWithItems([
          {
            id: 'item-1',
            productId: 'prod-456',
            customName: 'Usługa Zamykana',
            quantity: 1,
            unitPrice: 400,
            unit: 'szt.',
            discountPercent: 0,
            isOptional: false,
            isCustom: false,
          },
        ]),
      ],
    });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offer} />);

    await user.click(screen.getByRole('button', { name: 'Usługa Zamykana' }));

    await waitFor(() => {
      expect(screen.getByTestId('service-form-dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('dialog-save-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('service-form-dialog')).not.toBeInTheDocument();
    });
  });
});
