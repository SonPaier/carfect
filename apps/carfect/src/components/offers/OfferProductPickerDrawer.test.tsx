import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockSupabaseQuery, resetSupabaseMocks } from '@/test/mocks/supabase';
import { OfferProductPickerDrawer } from './OfferProductPickerDrawer';

vi.mock('@/integrations/supabase/client', async () => {
  const { mockSupabase } = await import('@/test/mocks/supabase');
  return { supabase: mockSupabase };
});

// Sheet from @shared/ui needs to render its children inline for tests
vi.mock('@shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/ui')>();
  return {
    ...actual,
    Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div data-testid="sheet">{children}</div> : null,
    SheetContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="sheet-content">{children}</div>
    ),
    SheetHeader: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
      <div onClick={onClick}>{children}</div>
    ),
    SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const INSTANCE_ID = 'test-instance-id';

const mockCategories = [
  { id: 'cat-1', name: 'Mycie', sort_order: 1, prices_are_net: false },
  { id: 'cat-2', name: 'Detailing', sort_order: 2, prices_are_net: false },
];

const mockServices = [
  {
    id: 'svc-1',
    name: 'Mycie podstawowe',
    short_name: 'MP',
    description: 'Basic wash',
    category_id: 'cat-1',
    price_from: 50,
  },
  {
    id: 'svc-2',
    name: 'Mycie premium',
    short_name: null,
    description: null,
    category_id: 'cat-1',
    price_from: 100,
  },
  {
    id: 'svc-3',
    name: 'Korekta lakieru',
    short_name: 'KL',
    description: 'Paint correction',
    category_id: 'cat-2',
    price_from: 800,
  },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  instanceId: INSTANCE_ID,
  alreadyAddedProductIds: [],
  onConfirm: vi.fn(),
};

describe('OfferProductPickerDrawer', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    vi.clearAllMocks();
    mockSupabaseQuery('unified_services', { data: mockServices, error: null });
    mockSupabaseQuery('unified_categories', { data: mockCategories, error: null });
  });

  it('shows loading state initially', () => {
    render(<OfferProductPickerDrawer {...defaultProps} />);
    // Loading spinner is shown while data is being fetched
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    // The content area renders without product items while loading
    expect(screen.queryAllByTestId('product-item')).toHaveLength(0);
  });

  it('renders products grouped by category when open', async () => {
    render(<OfferProductPickerDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Mycie')).toBeInTheDocument();
      expect(screen.getByText('Detailing')).toBeInTheDocument();
      expect(screen.getByText('MP')).toBeInTheDocument();
      expect(screen.getByText('Mycie premium')).toBeInTheDocument();
      expect(screen.getByText('KL')).toBeInTheDocument();
    });

    // All three services should appear as product rows
    expect(screen.getAllByTestId('product-item')).toHaveLength(3);
  });

  it('search filters products by name', async () => {
    const user = userEvent.setup();
    render(<OfferProductPickerDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    });

    await user.type(screen.getByPlaceholderText('Szukaj usługi...'), 'korekta');

    await waitFor(() => {
      // Only "Korekta lakieru" should remain
      expect(screen.getAllByTestId('product-item')).toHaveLength(1);
      expect(screen.getByText('KL')).toBeInTheDocument();
      // Mycie products should be filtered out
      expect(screen.queryByText('MP')).not.toBeInTheDocument();
    });
  });

  it('already-added products show as disabled and are not selectable', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <OfferProductPickerDrawer
        {...defaultProps}
        alreadyAddedProductIds={['svc-1']}
        onConfirm={onConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    });

    // The already-added product button should be disabled
    const productButtons = screen.getAllByTestId('product-item');
    const disabledButton = productButtons.find(
      (btn) => btn.getAttribute('data-product-id') === 'svc-1',
    );
    expect(disabledButton).toBeDisabled();

    // Clicking the disabled item should not make it selectable
    await user.click(screen.getAllByTestId('product-item')[1]); // svc-2
    const confirmBtn = screen.getByTestId('confirm-button');
    expect(confirmBtn).not.toBeDisabled();
    // Confirm shows 1 selected (svc-1 was already added, cannot be selected again)
    expect(confirmBtn).toHaveTextContent('Dodaj wybrane (1)');
  });

  it('confirm button calls onConfirm with selected products and closes drawer', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <OfferProductPickerDrawer
        {...defaultProps}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    });

    // Select two products
    const productButtons = screen.getAllByTestId('product-item');
    await user.click(productButtons[0]); // svc-1: Mycie podstawowe
    await user.click(productButtons[2]); // svc-3: Korekta lakieru

    const confirmBtn = screen.getByTestId('confirm-button');
    expect(confirmBtn).toHaveTextContent('Dodaj wybrane (2)');

    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledOnce();
    const confirmedProducts = onConfirm.mock.calls[0][0];
    expect(confirmedProducts).toHaveLength(2);
    expect(confirmedProducts[0]).toMatchObject({
      id: 'svc-1',
      name: 'Mycie podstawowe',
      short_name: 'MP',
      price: expect.closeTo(40.65, 0),
    });
    expect(confirmedProducts[1]).toMatchObject({
      id: 'svc-3',
      name: 'Korekta lakieru',
      price: expect.closeTo(650.41, 0),
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('confirm button is disabled when no products are selected', async () => {
    render(<OfferProductPickerDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    });

    expect(screen.getByTestId('confirm-button')).toBeDisabled();
  });

  it('shows empty state message when search has no matches', async () => {
    const user = userEvent.setup();
    render(<OfferProductPickerDrawer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getAllByTestId('product-item')).toHaveLength(3);
    });

    await user.type(screen.getByPlaceholderText('Szukaj usługi...'), 'xyznotexist');

    await waitFor(() => {
      expect(screen.queryAllByTestId('product-item')).toHaveLength(0);
      expect(screen.getByText('Nie znaleziono usług')).toBeInTheDocument();
    });
  });

  it('does not render content when drawer is closed', () => {
    render(<OfferProductPickerDrawer {...defaultProps} open={false} />);
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  describe('prices_are_net category handling', () => {
    it('preserves raw price as netto when category has prices_are_net=true (no double VAT division)', async () => {
      // When category prices_are_net=true, the price IS already netto.
      // It should NOT be divided by VAT again — price must equal the raw stored value.
      const netCategories = [
        { id: 'cat-net', name: 'Net Category', sort_order: 1, prices_are_net: true },
      ];
      const netServices = [
        {
          id: 'svc-net',
          name: 'Net Service',
          short_name: null,
          description: null,
          category_id: 'cat-net',
          price_from: 500,
          price_small: null,
          price_medium: null,
          price_large: null,
        },
      ];

      mockSupabaseQuery('unified_services', { data: netServices, error: null });
      mockSupabaseQuery('unified_categories', { data: netCategories, error: null });

      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <OfferProductPickerDrawer
          {...defaultProps}
          onConfirm={onConfirm}
        />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('product-item')).toHaveLength(1);
      });

      await user.click(screen.getAllByTestId('product-item')[0]);
      await user.click(screen.getByTestId('confirm-button'));

      const confirmed = onConfirm.mock.calls[0][0];
      // Price must be exactly 500 (the raw netto value), NOT bruttoToNetto(500) ≈ 406.50
      expect(confirmed[0].price).toBe(500);
    });

    it('converts brutto to netto when category has prices_are_net=false', async () => {
      // When prices_are_net=false, raw price is brutto and must be converted to netto
      const bruttoCategories = [
        { id: 'cat-brutto', name: 'Brutto Category', sort_order: 1, prices_are_net: false },
      ];
      const bruttoServices = [
        {
          id: 'svc-brutto',
          name: 'Brutto Service',
          short_name: null,
          description: null,
          category_id: 'cat-brutto',
          price_from: 123,
          price_small: null,
          price_medium: null,
          price_large: null,
        },
      ];

      mockSupabaseQuery('unified_services', { data: bruttoServices, error: null });
      mockSupabaseQuery('unified_categories', { data: bruttoCategories, error: null });

      const onConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <OfferProductPickerDrawer
          {...defaultProps}
          onConfirm={onConfirm}
        />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId('product-item')).toHaveLength(1);
      });

      await user.click(screen.getAllByTestId('product-item')[0]);
      await user.click(screen.getByTestId('confirm-button'));

      const confirmed = onConfirm.mock.calls[0][0];
      // 123 brutto / 1.23 = 100.00 netto
      expect(confirmed[0].price).toBeCloseTo(100, 1);
    });

    it('displays price as netto in list for prices_are_net=true category', async () => {
      // Price display should show raw value as netto — no conversion
      const netCategories = [
        { id: 'cat-net', name: 'Net Category', sort_order: 1, prices_are_net: true },
      ];
      const netServices = [
        {
          id: 'svc-net',
          name: 'Net Service',
          short_name: null,
          description: null,
          category_id: 'cat-net',
          price_from: 800,
          price_small: null,
          price_medium: null,
          price_large: null,
        },
      ];

      mockSupabaseQuery('unified_services', { data: netServices, error: null });
      mockSupabaseQuery('unified_categories', { data: netCategories, error: null });

      render(<OfferProductPickerDrawer {...defaultProps} />);

      await waitFor(() => {
        // formatServicePrice for net category shows raw price as netto: "800 zł netto"
        expect(screen.getByText('800 zł netto')).toBeInTheDocument();
      });
    });

    it('displays bruttoToNetto conversion in list for prices_are_net=false category', async () => {
      // For brutto category, display converts to netto: bruttoToNetto(123) ≈ 100.00
      const bruttoCategories = [
        { id: 'cat-brutto', name: 'Brutto Category', sort_order: 1, prices_are_net: false },
      ];
      const bruttoServices = [
        {
          id: 'svc-brutto',
          name: 'Brutto Service',
          short_name: null,
          description: null,
          category_id: 'cat-brutto',
          price_from: 123,
          price_small: null,
          price_medium: null,
          price_large: null,
        },
      ];

      mockSupabaseQuery('unified_services', { data: bruttoServices, error: null });
      mockSupabaseQuery('unified_categories', { data: bruttoCategories, error: null });

      render(<OfferProductPickerDrawer {...defaultProps} />);

      await waitFor(() => {
        // bruttoToNetto(123) = 100.00, displayed as "100 zł netto"
        expect(screen.getByText('100 zł netto')).toBeInTheDocument();
      });
    });
  });
});
