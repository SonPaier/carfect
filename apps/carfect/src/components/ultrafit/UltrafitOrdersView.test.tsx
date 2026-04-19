import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import UltrafitOrdersView from './UltrafitOrdersView';
import type { UltrafitOrder } from '@/types/ultrafit';

// Mock useIsMobile from @shared/ui — default desktop
vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'integrations.orders.title': 'Moje zamówienia Ultrafit',
        'integrations.orders.search': 'Szukaj po produkcie lub samochodzie...',
        'integrations.orders.empty': 'Brak zamówień',
        'integrations.orders.emptyDescription': 'Nie masz jeszcze żadnych zamówień Ultrafit.',
        'integrations.orders.orderNumber': 'Nr zamówienia',
        'integrations.orders.orderDate': 'Data zamówienia',
        'integrations.orders.shippedDate': 'Data wysyłki',
        'integrations.orders.delivery': 'Dostawa',
        'integrations.orders.trackingNumber': 'List przewozowy',
        'integrations.orders.totalNet': 'Kwota netto',
        'integrations.orders.status': 'Status',
        'integrations.orders.statusNew': 'Nowy',
        'integrations.orders.statusShipped': 'Wysłany',
        'integrations.orders.statusCancelled': 'Anulowany',
        'integrations.orders.showProducts': 'Pokaż produkty',
        'integrations.orders.hideProducts': 'Ukryj produkty',
        'common.loading': 'Ładowanie...',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'pl' },
  }),
}));

// Mock hooks
const mockUseUltrafitOrders = vi.fn();
const mockUseUltrafitOrderRolls = vi.fn();

vi.mock('@/hooks/useUltrafitOrders', () => ({
  useUltrafitOrders: (...args: unknown[]) => mockUseUltrafitOrders(...args),
}));

vi.mock('@/hooks/useUltrafitOrderRolls', () => ({
  useUltrafitOrderRolls: (...args: unknown[]) => mockUseUltrafitOrderRolls(...args),
}));

const mockOrder: UltrafitOrder = {
  id: 'order-1',
  orderNumber: 'UF-001/04/2026',
  createdAt: '2026-04-01T10:00:00Z',
  shippedAt: null,
  status: 'new',
  totalNet: 1500,
  currency: 'PLN',
  trackingNumber: null,
  trackingUrl: null,
  deliveryType: 'wysyłka',
  items: [
    {
      name: 'Folia PPF Premium',
      quantity: 2,
      priceNet: 750,
      unit: 'szt.',
      vehicle: 'BMW X5 2023',
      productType: null,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseUltrafitOrderRolls.mockReturnValue({ data: null, isLoading: false });
});

describe('UltrafitOrdersView', () => {
  it('renders the title', () => {
    mockUseUltrafitOrders.mockReturnValue({
      data: { orders: [], totalCount: 0 },
      isLoading: false,
    });

    render(<UltrafitOrdersView instanceId="instance-1" />);

    expect(screen.getByText('Moje zamówienia Ultrafit')).toBeInTheDocument();
  });

  it('shows empty state when no orders are returned', () => {
    mockUseUltrafitOrders.mockReturnValue({
      data: { orders: [], totalCount: 0 },
      isLoading: false,
    });

    render(<UltrafitOrdersView instanceId="instance-1" />);

    expect(screen.getByText('Brak zamówień')).toBeInTheDocument();
    expect(screen.getByText('Nie masz jeszcze żadnych zamówień Ultrafit.')).toBeInTheDocument();
  });

  it('renders order rows on desktop (table)', () => {
    mockUseUltrafitOrders.mockReturnValue({
      data: { orders: [mockOrder], totalCount: 1 },
      isLoading: false,
    });

    render(<UltrafitOrdersView instanceId="instance-1" />);

    // Order number appears in the table row
    expect(screen.getByText('UF-001/04/2026')).toBeInTheDocument();

    // Table headers
    expect(screen.getByText('Nr zamówienia')).toBeInTheDocument();
    expect(screen.getByText('Data zamówienia')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();

    // Status badge
    expect(screen.getByText('Nowy')).toBeInTheDocument();
  });

  it('renders search input', () => {
    mockUseUltrafitOrders.mockReturnValue({
      data: { orders: [], totalCount: 0 },
      isLoading: false,
    });

    render(<UltrafitOrdersView instanceId="instance-1" />);

    const searchInput = screen.getByPlaceholderText('Szukaj po produkcie lub samochodzie...');
    expect(searchInput).toBeInTheDocument();
  });
});
