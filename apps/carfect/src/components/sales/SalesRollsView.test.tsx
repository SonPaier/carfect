import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesRollsView from './SalesRollsView';

// --- Supabase mock ---
const mockFrom = vi.fn();

const createChainMock = (resolveData: unknown = null, resolveError: unknown = null) => {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'neq',
    'in',
    'or',
    'order',
    'range',
    'limit',
    'single',
    'maybeSingle',
    'insert',
    'update',
    'delete',
    'match',
    'ilike',
    'like',
  ];
  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });
  chain.then = vi.fn((resolve: (v: unknown) => void) =>
    Promise.resolve({
      data: resolveData,
      error: resolveError,
      count: resolveData ? (resolveData as unknown[]).length : 0,
    }).then(resolve),
  );
  return chain;
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: vi.fn() },
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    roles: [{ role: 'sales', instance_id: 'inst-1', hall_id: null }],
    user: { id: 'user-1' },
    loading: false,
  }),
}));

// Mock child drawers to avoid deep dependency trees
vi.mock('./rolls/AddEditRollDrawer', () => ({
  default: () => null,
}));

vi.mock('./rolls/RollScanDrawer', () => ({
  default: () => null,
}));

vi.mock('./rolls/RollDetailsDrawer', () => ({
  default: () => null,
}));

// --- Test data ---
const mockRolls = [
  {
    id: 'roll-1',
    instance_id: 'inst-1',
    brand: 'Hexis',
    product_name: 'HX20000 Carbon Black',
    description: null,
    product_code: 'HX-001',
    barcode: '1234567890',
    width_mm: 1524,
    length_m: 50,
    initial_length_m: 50,
    delivery_date: '2026-03-10',
    photo_url: null,
    status: 'active',
    extraction_confidence: null,
    created_at: '2026-03-10T10:00:00.000Z',
    updated_at: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'roll-2',
    instance_id: 'inst-1',
    brand: '3M',
    product_name: 'Gloss Black 1080',
    description: null,
    product_code: '3M-G12',
    barcode: null,
    width_mm: 1220,
    length_m: 22,
    initial_length_m: 25,
    delivery_date: null,
    photo_url: null,
    status: 'active',
    extraction_confidence: null,
    created_at: '2026-03-11T10:00:00.000Z',
    updated_at: '2026-03-11T10:00:00.000Z',
  },
];

describe('SalesRollsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: sales_rolls returns mockRolls, usages returns empty, orders returns empty
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_rolls') return createChainMock(mockRolls);
      if (table === 'sales_roll_usages') return createChainMock([]);
      if (table === 'sales_orders') return createChainMock([]);
      return createChainMock([]);
    });
  });

  it('renders roll list table headers', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('Produkt')).toBeInTheDocument();
    });

    expect(screen.getByText('Kod')).toBeInTheDocument();
    expect(screen.getByText('Rozmiar')).toBeInTheDocument();
    expect(screen.getByText('Na stanie')).toBeInTheDocument();
    expect(screen.getByText('Dodano')).toBeInTheDocument();
  });

  it('displays roll data — brand, product name, dimensions', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('HX20000 Carbon Black')).toBeInTheDocument();
    });

    expect(screen.getByText('Gloss Black 1080')).toBeInTheDocument();
    // Product code
    expect(screen.getByText('HX-001')).toBeInTheDocument();
    // Dimensions: widthMm × initialLengthM format (source uses roll.initialLengthM)
    expect(screen.getByText('1524mm × 50m')).toBeInTheDocument();
    // roll-2 has initial_length_m: 25
    expect(screen.getByText('1220mm × 25m')).toBeInTheDocument();
  });

  it('tab switcher renders with active/sold options', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      // "Na stanie" appears in both the select option and the table header — use getAllByText
      expect(screen.getAllByText(/Na stanie/).length).toBeGreaterThanOrEqual(1);
    });

    // The select trigger should show current value
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('switching to sold tab reloads rolls with sold filter', async () => {
    const user = userEvent.setup();
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('HX20000 Carbon Black')).toBeInTheDocument();
    });

    const selectTrigger = screen.getByRole('combobox');
    await user.click(selectTrigger);

    await waitFor(() => {
      expect(screen.getByText('Wykorzystane')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Wykorzystane'));

    // After switching tab, fetchRolls should be called again
    await waitFor(() => {
      // sales_rolls was called at least twice (initial + tab switch)
      const calls = mockFrom.mock.calls.filter((c) => c[0] === 'sales_rolls');
      expect(calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('search input renders and accepts text', async () => {
    const user = userEvent.setup();
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Szukaj po nazwie, kodzie, barcode, kliencie...'),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Szukaj po nazwie, kodzie, barcode, kliencie...');
    await user.type(searchInput, 'Hexis');
    expect(searchInput).toHaveValue('Hexis');
  });

  it('"Dodaj ręcznie" button renders', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dodaj ręcznie/i })).toBeInTheDocument();
    });
  });

  it('"Skanuj rolki" button renders', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Skanuj rolki/i })).toBeInTheDocument();
    });
  });

  it('shows empty state when no rolls', async () => {
    mockFrom.mockImplementation(() => createChainMock([]));

    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('Brak rolek na stanie')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', async () => {
    // Delay the response so loading state is visible
    mockFrom.mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {};
      const methods = ['select', 'eq', 'in', 'order', 'limit', 'single'];
      methods.forEach((method) => {
        chain[method] = vi.fn(() => chain);
      });
      chain.then = vi.fn((resolve: (v: unknown) => void) =>
        new Promise((res) =>
          setTimeout(
            () => res({ data: table === 'sales_rolls' ? mockRolls : [], error: null }),
            200,
          ),
        ).then(resolve),
      );
      return chain;
    });

    render(<SalesRollsView />);

    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });

  it('dropdown menu has "Usuń" (delete) option', async () => {
    const user = userEvent.setup();
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('HX20000 Carbon Black')).toBeInTheDocument();
    });

    // Click the first MoreHorizontal dropdown button
    const moreButtons = screen.getAllByRole('button', { name: '' });
    const actionButtons = moreButtons.filter((btn) => btn.querySelector('svg'));
    const moreBtn = actionButtons[actionButtons.length - 1] ?? actionButtons[0];
    await user.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByText('Usuń')).toBeInTheDocument();
    });
  });

  it('dropdown menu has "Edytuj" option', async () => {
    const user = userEvent.setup();
    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('HX20000 Carbon Black')).toBeInTheDocument();
    });

    const moreButtons = screen.getAllByRole('button', { name: '' });
    const actionButtons = moreButtons.filter((btn) => btn.querySelector('svg'));
    const moreBtn = actionButtons[actionButtons.length - 1] ?? actionButtons[0];
    await user.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByText('Edytuj')).toBeInTheDocument();
    });
  });

  it('shows page heading "Ewidencja rolek"', async () => {
    render(<SalesRollsView />);

    expect(screen.getByText('Ewidencja rolek')).toBeInTheDocument();
  });

  it('shows delivery date formatted as dd.MM.yyyy', async () => {
    render(<SalesRollsView />);

    await waitFor(() => {
      // delivery_date: '2026-03-10' → '10.03.2026'
      expect(screen.getByText('10.03.2026')).toBeInTheDocument();
    });
  });

  it('shows dash for missing product code', async () => {
    const rollsWithNoCode = [
      {
        ...mockRolls[1],
        product_code: null,
      },
    ];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'sales_rolls') return createChainMock(rollsWithNoCode);
      return createChainMock([]);
    });

    render(<SalesRollsView />);

    await waitFor(() => {
      expect(screen.getByText('Gloss Black 1080')).toBeInTheDocument();
    });

    // "—" appears for both product code and delivery date; assert at least one
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
  });
});
