import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderSummarySection } from './OrderSummarySection';
import type { OrderProduct } from '../hooks/useOrderPackages';

vi.mock('@shared/ui', async () => {
  const actual = await vi.importActual('@shared/ui');
  return { ...actual, useIsMobile: () => false };
});

const makeProduct = (overrides: Partial<OrderProduct> = {}): OrderProduct => ({
  instanceKey: 'key-1',
  productId: 'prod-1',
  name: 'Folia PPF',
  priceNet: 100,
  priceUnit: 'piece',
  quantity: 2,
  vehicle: '',
  ...overrides,
});

describe('OrderSummarySection — netto payer', () => {
  it('hides VAT row and shows "Do zapłaty (netto)" when isNetPayer is true', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        totalNet={100}
        totalGross={100}
        isNetPayer={true}
      />,
    );

    expect(screen.queryByText(/VAT/)).not.toBeInTheDocument();
    expect(screen.queryByText('Razem brutto')).not.toBeInTheDocument();
    expect(screen.getByText('Do zapłaty (netto)')).toBeInTheDocument();
    expect(screen.getByText('Razem netto')).toBeInTheDocument();
  });

  it('shows VAT and brutto when isNetPayer is false', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        totalNet={100}
        totalGross={123}
        isNetPayer={false}
      />,
    );

    expect(screen.getByText(/VAT \(23%\)/)).toBeInTheDocument();
    expect(screen.getByText('Razem brutto')).toBeInTheDocument();
    expect(screen.queryByText('Do zapłaty (netto)')).not.toBeInTheDocument();
  });

  it('defaults to brutto when isNetPayer is not provided', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 200, quantity: 1 })]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={0}
        totalNet={200}
        totalGross={246}
      />,
    );

    expect(screen.getByText(/VAT \(23%\)/)).toBeInTheDocument();
    expect(screen.getByText('Razem brutto')).toBeInTheDocument();
  });

  it('still shows shipping netto for netto payer', () => {
    render(
      <OrderSummarySection
        products={[makeProduct()]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[24.6]}
        totalNet={220}
        totalGross={220}
        isNetPayer={true}
      />,
    );

    expect(screen.getByText(/Wysyłka/)).toBeInTheDocument();
    expect(screen.getByText('Do zapłaty (netto)')).toBeInTheDocument();
  });
});
