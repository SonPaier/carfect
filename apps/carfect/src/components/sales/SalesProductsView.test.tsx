import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesProductsView from './SalesProductsView';

// ---- Supabase mock ----
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
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ---- useAuth mock ----
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    roles: [{ role: 'sales', instance_id: 'inst-1', hall_id: null }],
    user: null,
    session: null,
    username: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    hasRole: vi.fn(),
    hasInstanceRole: vi.fn(),
  }),
}));

// ---- Child component mocks ----
vi.mock('./AddSalesProductDrawer', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="product-drawer">ProductDrawer</div> : null,
}));

vi.mock('@/components/admin/CategoryManagementDialog', () => ({
  CategoryManagementDialog: () => null,
}));

// ---- Sample data ----
const mockProducts = [
  {
    id: 'prod-1',
    short_name: 'Folia czarna',
    full_name: 'Folia ochronna czarna 1524mm',
    description: 'Opis folii',
    price_net: '250.00',
    price_unit: 'm2',
    category_id: 'cat-1',
    has_variants: false,
    exclude_from_discount: false,
  },
  {
    id: 'prod-2',
    short_name: 'Pasta do polerowania',
    full_name: 'Pasta do polerowania premium',
    description: null,
    price_net: '89.99',
    price_unit: 'szt',
    category_id: null,
    has_variants: false,
    exclude_from_discount: false,
  },
];

const mockCategories = [
  { id: 'cat-1', name: 'Folie' },
  { id: 'cat-2', name: 'Chemia' },
];

// Build more than 10 products to trigger pagination
const manyProducts = Array.from({ length: 12 }, (_, i) => ({
  id: `prod-many-${i}`,
  short_name: `Produkt ${String(i + 1).padStart(2, '0')}`,
  full_name: `Pełna nazwa produktu ${i + 1}`,
  description: null,
  price_net: String((i + 1) * 10),
  price_unit: 'szt',
  category_id: null,
  has_variants: false,
  exclude_from_discount: false,
}));

// ---- Helpers ----
const setupMockFrom = (products: unknown[] = mockProducts, categories: unknown[] = mockCategories) => {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'sales_products') return createChainMock(products);
    if (table === 'unified_categories') return createChainMock(categories);
    return createChainMock([]);
  });
};

// ---- Tests ----
describe('SalesProductsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMockFrom();
  });

  it('renders product list table with headers', async () => {
    render(<SalesProductsView />);
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Nazwa')).toBeInTheDocument();
    expect(screen.getByText('Nazwa pełna')).toBeInTheDocument();
    expect(screen.getByText('Kategoria')).toBeInTheDocument();
    expect(screen.getByText('Cena netto')).toBeInTheDocument();
  });

  it('displays product name, price and category', async () => {
    render(<SalesProductsView />);
    await waitFor(() => {
      expect(screen.getByText('Folia czarna')).toBeInTheDocument();
    });
    expect(screen.getByText('Folia ochronna czarna 1524mm')).toBeInTheDocument();
    expect(screen.getByText('Folie')).toBeInTheDocument();
    // 250.00 formatted as Polish locale
    expect(screen.getByText(/250,00\s*zł/)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<SalesProductsView />);
    expect(screen.getByPlaceholderText('Szukaj po nazwie...')).toBeInTheDocument();
  });

  it('renders "Dodaj produkt" button', () => {
    render(<SalesProductsView />);
    expect(screen.getByRole('button', { name: /Dodaj produkt/i })).toBeInTheDocument();
  });

  it('shows empty state when no products', async () => {
    setupMockFrom([]);
    render(<SalesProductsView />);
    await waitFor(() => {
      expect(screen.getByText('Brak produktów')).toBeInTheDocument();
    });
    expect(screen.getByText('Dodaj pierwszy produkt do katalogu')).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    render(<SalesProductsView />);
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });

  it('renders pagination controls when more than 10 products', async () => {
    setupMockFrom(manyProducts);
    render(<SalesProductsView />);
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Następna/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Poprzednia/i })).toBeInTheDocument();
  });

  it('dropdown menu contains delete option for a product', async () => {
    const user = userEvent.setup();
    render(<SalesProductsView />);
    await waitFor(() => {
      expect(screen.getByText('Folia czarna')).toBeInTheDocument();
    });
    // MoreHorizontal buttons have no visible text label
    const moreButtons = screen.getAllByRole('button', { name: '' });
    await user.click(moreButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Usuń')).toBeInTheDocument();
    });
  });
});
