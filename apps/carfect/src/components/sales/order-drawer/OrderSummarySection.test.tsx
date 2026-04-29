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

describe('OrderSummarySection (Fakturownia-style summary)', () => {
  it('renders product name and quantity with unit in parens', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ name: 'Folia A', priceNet: 50, quantity: 3 })]}
        subtotalNet={150}
        discountAmount={0}
        customerDiscount={0}
        totalNet={150}
        totalGross={184.5}
      />,
    );

    expect(screen.getByText(/Folia A/)).toBeInTheDocument();
    // "3,00 (szt.)" — quantity formatted Polish-locale with unit in parens
    expect(screen.getByText(/3,00 \(szt\.\)/)).toBeInTheDocument();
  });

  it('renders Rabat column with per-product discountPercent', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ discountPercent: 10, priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={10}
        customerDiscount={0}
        totalNet={90}
        totalGross={110.7}
      />,
    );

    expect(screen.getByText('10,00%')).toBeInTheDocument();
  });

  it('falls back to customerDiscount when discountPercent is undefined', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ discountPercent: undefined, priceNet: 200, quantity: 1 })]}
        subtotalNet={200}
        discountAmount={16}
        customerDiscount={8}
        totalNet={184}
        totalGross={226.32}
      />,
    );

    expect(screen.getByText('8,00%')).toBeInTheDocument();
  });

  it('omits Rabat column entirely when no row has a discount', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ excludeFromDiscount: true, discountPercent: undefined })]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={10}
        totalNet={200}
        totalGross={246}
      />,
    );

    expect(screen.queryByRole('columnheader', { name: 'Rabat' })).not.toBeInTheDocument();
  });

  it('renders shipping line as extra row with brutto value', () => {
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
  });

  it('renders multiple shipping costs as combined "Wysyłka (×N)" row', () => {
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

    expect(screen.getByText(/Wysyłka \(×2\)/)).toBeInTheDocument();
  });

  it('renders summary totals with Wartość netto, Wartość VAT, Wartość brutto', () => {
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

    expect(screen.getAllByText('Wartość netto').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wartość VAT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Wartość brutto').length).toBeGreaterThan(0);
  });

  it('renders "Do zapłaty" with amount in words', () => {
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

    expect(screen.getByText('Do zapłaty')).toBeInTheDocument();
    expect(screen.getByText(/Słownie:/)).toBeInTheDocument();
  });

  it('shows free-payment label instead of amount when paymentMethod=free', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        totalNet={100}
        totalGross={123}
        paymentMethod="free"
      />,
    );

    expect(screen.getByText('Bezpłatne')).toBeInTheDocument();
    expect(screen.queryByText(/Słownie:/)).not.toBeInTheDocument();
  });

  it('uses requiredMb converted to m² for meter product without roll assignments', () => {
    // 1524mm width × 5mb = 7.62 m²
    render(
      <OrderSummarySection
        products={[
          makeProduct({
            name: 'XP Crystal - 1524mm x 15m',
            priceUnit: 'meter',
            priceNet: 40,
            quantity: 1,
            requiredMb: 5,
          }),
        ]}
        subtotalNet={304.8}
        discountAmount={0}
        customerDiscount={0}
        totalNet={304.8}
        totalGross={374.9}
      />,
    );

    expect(screen.getByText(/7,62 \(m²\)/)).toBeInTheDocument();
  });

  it('formats floating-point quantity without artifacts (regression: 2.28000000...)', () => {
    // 760mm × 3mb = 2.28 m² (was rendering 2.2800000000000002 before fix)
    render(
      <OrderSummarySection
        products={[
          makeProduct({
            name: 'Folia - 760mm x 30m',
            priceUnit: 'meter',
            priceNet: 229,
            quantity: 1,
            requiredMb: 3,
          }),
        ]}
        subtotalNet={522.12}
        discountAmount={0}
        customerDiscount={0}
        totalNet={522.12}
        totalGross={642.21}
      />,
    );

    expect(screen.getByText(/2,28 \(m²\)/)).toBeInTheDocument();
    expect(screen.queryByText(/2,28000/)).not.toBeInTheDocument();
  });

  it('uses rollAssignments sum (m²) for meter-based product quantity', () => {
    render(
      <OrderSummarySection
        products={[
          makeProduct({
            name: 'Folia m2',
            priceUnit: 'meter',
            quantity: 1,
            rollAssignments: [
              { rollId: 'r1', usageM2: 2.5, widthMm: 1524 },
              { rollId: 'r2', usageM2: 1.5, widthMm: 1524 },
            ],
          }),
        ]}
        subtotalNet={400}
        discountAmount={0}
        customerDiscount={0}
        totalNet={400}
        totalGross={492}
      />,
    );

    expect(screen.getByText(/4,00 \(m²\)/)).toBeInTheDocument();
  });

  describe('uber costs', () => {
    it('renders Uber line when a single uber cost is present', () => {
      render(
        <OrderSummarySection
          products={[makeProduct({ priceNet: 100, quantity: 1 })]}
          subtotalNet={100}
          discountAmount={0}
          customerDiscount={0}
          uberCosts={[36.9]}
          totalNet={130}
          totalGross={159.9}
        />,
      );

      expect(screen.getByText(/^Uber/)).toBeInTheDocument();
    });

    it('renders Uber (×N) with aggregated brutto for multiple uber costs', () => {
      render(
        <OrderSummarySection
          products={[makeProduct()]}
          subtotalNet={200}
          discountAmount={0}
          customerDiscount={0}
          uberCosts={[20, 30]}
          totalNet={240.65}
          totalGross={296}
        />,
      );

      expect(screen.getByText(/Uber \(×2\)/)).toBeInTheDocument();
    });

    it('does not render Uber line when uberCosts is empty', () => {
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

      expect(screen.queryByText(/^Uber/)).not.toBeInTheDocument();
    });

    it('shows both Wysyłka and Uber rows together', () => {
      render(
        <OrderSummarySection
          products={[makeProduct()]}
          subtotalNet={200}
          discountAmount={0}
          customerDiscount={0}
          shippingCosts={[24.6]}
          uberCosts={[36.9]}
          totalNet={250}
          totalGross={307.5}
        />,
      );

      expect(screen.getByText(/^Wysyłka/)).toBeInTheDocument();
      expect(screen.getByText(/^Uber/)).toBeInTheDocument();
    });
  });
});
