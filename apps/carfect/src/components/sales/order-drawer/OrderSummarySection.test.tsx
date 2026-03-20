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

describe('OrderSummarySection', () => {
  it('renders individual product lines with quantity and price', () => {
    const products = [makeProduct({ name: 'Folia A', priceNet: 50, quantity: 3 })];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={150}
        discountAmount={0}
        customerDiscount={0}
        totalNet={150}
        totalGross={184.5}
      />,
    );

    expect(screen.getByText(/Folia A/)).toBeInTheDocument();
    expect(screen.getByText(/3 szt/)).toBeInTheDocument();
  });

  it('shows per-product discount when discountPercent is set', () => {
    const products = [makeProduct({ discountPercent: 10, priceNet: 100, quantity: 1 })];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={100}
        discountAmount={10}
        customerDiscount={0}
        totalNet={90}
        totalGross={110.7}
      />,
    );

    expect(screen.getByText(/Rabat 10%/)).toBeInTheDocument();
  });

  it('falls back to customerDiscount when discountPercent is undefined', () => {
    const products = [makeProduct({ discountPercent: undefined, priceNet: 200, quantity: 1 })];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={200}
        discountAmount={16}
        customerDiscount={8}
        totalNet={184}
        totalGross={226.32}
      />,
    );

    expect(screen.getByText(/Rabat 8%/)).toBeInTheDocument();
  });

  it('does not show discount line when product has excludeFromDiscount and no explicit discount', () => {
    const products = [makeProduct({ excludeFromDiscount: true, discountPercent: undefined })];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={10}
        totalNet={200}
        totalGross={246}
      />,
    );

    expect(screen.queryByText(/Rabat/)).not.toBeInTheDocument();
  });

  it('renders shipping cost as netto', () => {
    render(
      <OrderSummarySection
        products={[makeProduct()]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[24.6]}
        totalNet={220}
        totalGross={270.6}
      />,
    );

    expect(screen.getByText(/Wysyłka/)).toBeInTheDocument();
    // Does not show #1 for single shipment
    expect(screen.queryByText(/#1/)).not.toBeInTheDocument();
  });

  it('renders multiple shipping costs with numbered labels', () => {
    render(
      <OrderSummarySection
        products={[makeProduct()]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[24.6, 30.75]}
        totalNet={245}
        totalGross={301.35}
      />,
    );

    expect(screen.getByText(/Wysyłka #1/)).toBeInTheDocument();
    expect(screen.getByText(/Wysyłka #2/)).toBeInTheDocument();
  });

  it('renders totals section with netto, VAT, and brutto', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        totalNet={100}
        totalGross={123}
      />,
    );

    expect(screen.getByText('Razem netto')).toBeInTheDocument();
    expect(screen.getByText(/VAT \(23%\)/)).toBeInTheDocument();
    expect(screen.getByText('Razem brutto')).toBeInTheDocument();
  });

  it('uses rollAssignments for meter-based product quantity', () => {
    const products = [
      makeProduct({
        name: 'Folia m2',
        priceUnit: 'meter',
        quantity: 1,
        rollAssignments: [
          { rollId: 'r1', usageM2: 2.5, widthMm: 1524 },
          { rollId: 'r2', usageM2: 1.5, widthMm: 1524 },
        ],
      }),
    ];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={400}
        discountAmount={0}
        customerDiscount={0}
        totalNet={400}
        totalGross={492}
      />,
    );

    // Should show 4 m² (2.5 + 1.5) not 1
    expect(screen.getByText(/4 m²/)).toBeInTheDocument();
  });
});
