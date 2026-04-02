import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductsSummaryStepV2 } from './ProductsSummaryStepV2';
import type { OfferState, OfferOption } from '@/hooks/useOffer';

// Mock the drawer so we can control what products get "picked"
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
          data-testid="picker-add-service-a"
          onClick={() => {
            onConfirm([
              { id: 'prod-a', name: 'Usługa A', short_name: null, description: 'Opis A', price: 200 },
            ]);
            onClose();
          }}
        >
          Add Usługa A
        </button>
        <button
          data-testid="picker-add-service-b"
          onClick={() => {
            onConfirm([
              { id: 'prod-b', name: 'Usługa B', short_name: null, description: null, price: 400 },
            ]);
            onClose();
          }}
        >
          Add Usługa B
        </button>
      </div>
    ) : null,
}));

// Mock ConditionsSection — not under test here
vi.mock('./summary/ConditionsSection', () => ({
  ConditionsSection: () => <div data-testid="conditions-section" />,
}));

// Mock formatPrice to return a predictable format
vi.mock('@/lib/offerUtils', () => ({
  formatPrice: (value: number) => `${value} zł`,
  getLowestPrice: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Build a minimal valid OfferState for tests
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
  });

  it('renders empty state with "Dodaj usluge" button for new offer', () => {
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    // Empty state message shown when no products selected
    expect(screen.getByText(/brak wybranych uslug/i)).toBeInTheDocument();
    // Add button is always visible
    expect(screen.getByRole('button', { name: /dodaj usluge/i })).toBeInTheDocument();
  });

  it('shows product in selected list after adding via picker', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    // Open picker
    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    expect(screen.getByTestId('picker-drawer')).toBeInTheDocument();

    // Confirm a product from the mock drawer
    await user.click(screen.getByTestId('picker-add-service-a'));

    // Drawer should be closed
    expect(screen.queryByTestId('picker-drawer')).not.toBeInTheDocument();

    // Product should appear in the selected section
    expect(screen.getByText('Usługa A')).toBeInTheDocument();
    // Empty state message should be gone
    expect(screen.queryByText(/brak wybranych uslug/i)).not.toBeInTheDocument();
  });

  it('toggle product to suggested — moves product to suggested section', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    // Add a product first
    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    await user.click(screen.getByTestId('picker-add-service-a'));

    // Product should be in selected list (not suggested)
    expect(screen.queryByText('opcjonalne')).not.toBeInTheDocument();

    // Click the toggle-suggested button (Gift icon, title "Oznacz jako sugerowane")
    const toggleBtn = screen.getByTitle('Oznacz jako sugerowane');
    await user.click(toggleBtn);

    // Product should now be in the suggested section
    await waitFor(() => {
      expect(screen.getByText('Sugerowane — opcjonalne dla klienta (1)')).toBeInTheDocument();
      expect(screen.getByText('opcjonalne')).toBeInTheDocument();
    });

    // Selected section should show 0 selected
    expect(screen.getByText(/Wybrane uslugi \(0\)/i)).toBeInTheDocument();
  });

  it('removes product from list when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    // Add a product
    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    await user.click(screen.getByTestId('picker-add-service-a'));

    expect(screen.getByText('Usługa A')).toBeInTheDocument();

    // Click the trash/remove button
    const removeBtn = screen.getByRole('button', { name: '' }).closest('[class*="destructive"]')
      ?? document.querySelector('button[class*="destructive"]');

    // Use the button that calls onRemove — it has a Trash2 icon, find by class pattern
    const allButtons = screen.getAllByRole('button');
    // The remove button is the last action button in the product row
    const trashButton = allButtons.find((btn) =>
      btn.className.includes('destructive'),
    );
    expect(trashButton).toBeDefined();
    await user.click(trashButton!);

    // Product should be gone
    await waitFor(() => {
      expect(screen.queryByText('Usługa A')).not.toBeInTheDocument();
    });

    // Empty state should be back
    expect(screen.getByText(/brak wybranych uslug/i)).toBeInTheDocument();
  });

  it('loads existing v2 offer products on mount from offer.options[0]', () => {
    const existingOption: OfferOption = {
      id: 'opt-existing',
      name: '',
      items: [
        {
          id: 'item-1',
          productId: 'prod-existing',
          customName: 'Istniejaca usługa',
          customDescription: 'Opis istniejący',
          quantity: 2,
          unitPrice: 300,
          unit: 'szt.',
          discountPercent: 0,
          isOptional: false,
          isCustom: false,
        },
      ],
      isSelected: true,
      sortOrder: 0,
    };

    const offerWithProducts = buildOffer({ options: [existingOption] });

    render(<ProductsSummaryStepV2 {...defaultProps} offer={offerWithProducts} />);

    // The existing product should be displayed
    expect(screen.getByText('Istniejaca usługa')).toBeInTheDocument();
    // Empty state should NOT be shown
    expect(screen.queryByText(/brak wybranych uslug/i)).not.toBeInTheDocument();
  });

  it('calls onUpdateOffer with correct OfferOption structure when products change', async () => {
    const onUpdateOffer = vi.fn();
    const user = userEvent.setup();

    render(
      <ProductsSummaryStepV2 {...defaultProps} onUpdateOffer={onUpdateOffer} />,
    );

    // Add a product via the picker
    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    await user.click(screen.getByTestId('picker-add-service-a'));

    // onUpdateOffer should have been called with a valid OfferOption structure
    await waitFor(() => {
      expect(onUpdateOffer).toHaveBeenCalled();
    });

    const lastCall = onUpdateOffer.mock.calls[onUpdateOffer.mock.calls.length - 1][0];
    expect(lastCall).toHaveProperty('options');
    expect(lastCall.options).toHaveLength(1);

    const option: OfferOption = lastCall.options[0];
    expect(option).toMatchObject({
      name: '',
      isSelected: true,
      sortOrder: 0,
    });
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

  it('selected products total is shown and excluded suggested products from sum', async () => {
    const user = userEvent.setup();
    render(<ProductsSummaryStepV2 {...defaultProps} />);

    // Add two products
    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    await user.click(screen.getByTestId('picker-add-service-a')); // price 200

    await user.click(screen.getByRole('button', { name: /dodaj usluge/i }));
    await user.click(screen.getByTestId('picker-add-service-b')); // price 400

    // Both selected — total net should be 600 (200+400)
    await waitFor(() => {
      expect(screen.getByText('Suma netto:')).toBeInTheDocument();
      // formatPrice is mocked to return "600 zł"
      expect(screen.getByText('600 zł')).toBeInTheDocument();
    });

    // Now toggle Usługa A to suggested
    const toggleButtons = screen.getAllByTitle('Oznacz jako sugerowane');
    await user.click(toggleButtons[0]);

    // Total should only include Usługa B (400 zł)
    await waitFor(() => {
      expect(screen.getByText('400 zł')).toBeInTheDocument();
    });
  });
});
