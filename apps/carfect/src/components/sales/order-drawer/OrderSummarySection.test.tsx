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

  it('renders shipping cost as brutto', () => {
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
    expect(screen.getByText(/Wysyłka \(brutto\)/)).toBeInTheDocument();
    // Does not show #1 for single shipment
    expect(screen.queryByText(/#1/)).not.toBeInTheDocument();
  });

  it('renders multiple shipping costs as combined total with count', () => {
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
    expect(screen.getByText('55,35 zł')).toBeInTheDocument();
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

  it('shows "Do zapłaty" with totalGross for net payer instead of brutto section', () => {
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

    expect(screen.getByText('Do zapłaty')).toBeInTheDocument();
    expect(screen.queryByText('Razem brutto')).not.toBeInTheDocument();
    expect(screen.queryByText(/VAT/)).not.toBeInTheDocument();
  });

  it('netto payer "Do zapłaty" shows totalGross (productsNet + shippingBrutto)', () => {
    // productsNet=100, shippingBrutto=24.6, totalGross=124.6
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[24.6]}
        totalNet={120}
        totalGross={124.6}
        isNetPayer={true}
      />,
    );

    expect(screen.getByText('Do zapłaty')).toBeInTheDocument();
    expect(screen.getByText('124,60 zł')).toBeInTheDocument();
  });

  it('shows VAT and brutto for gross payer', () => {
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
    expect(screen.queryByText('Do zapłaty')).not.toBeInTheDocument();
  });

  it('displays shipping cost as brutto value (not divided by VAT)', () => {
    const shippingBrutto = 24.6;
    render(
      <OrderSummarySection
        products={[makeProduct()]}
        subtotalNet={200}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[shippingBrutto]}
        totalNet={220}
        totalGross={270.6}
      />,
    );

    // Should show the brutto value directly (24,60), not netto (20,00)
    expect(screen.getByText('24,60 zł')).toBeInTheDocument();
  });

  it('shows "Bezpłatne" for free payment method', () => {
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
  });

  it('uses requiredMb converted to m² for meter product without roll assignments', () => {
    // Product: 1524mm width, 5 mb required → 5 * 1.524 = 7.62 m²
    // Price: 40 zł/m² × 7.62 = 304.80 zł
    const products = [
      makeProduct({
        name: 'XP Crystal - 1524mm x 15m',
        priceUnit: 'meter',
        priceNet: 40,
        quantity: 1,
        requiredMb: 5,
      }),
    ];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={304.8}
        discountAmount={0}
        customerDiscount={0}
        totalNet={304.8}
        totalGross={374.9}
      />,
    );

    // Should show 7.62 m² (from 5mb × 1.524m width), not 1
    expect(screen.getByText(/7.62 m²/)).toBeInTheDocument();
  });

  it('"Razem netto" shows same productsNet value for both netto and brutto payer', () => {
    // Regression: switching payer type changed "Razem netto" because shipping netto
    // was included for brutto payer but not for netto payer
    const products = [makeProduct({ priceNet: 100, quantity: 1 })];
    const shippingBrutto = 44.08;
    const shippingNet = shippingBrutto / 1.23; // ~35.84
    const productsNet = 100;
    const totalNet = productsNet + shippingNet;

    const { unmount } = render(
      <OrderSummarySection
        products={products}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[shippingBrutto]}
        totalNet={totalNet}
        totalGross={totalNet * 1.23}
        isNetPayer={false}
      />,
    );
    const bruttoNettoText = screen.getByText('Razem netto').nextSibling?.textContent;

    unmount();

    render(
      <OrderSummarySection
        products={products}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[shippingBrutto]}
        totalNet={totalNet}
        totalGross={productsNet + shippingBrutto}
        isNetPayer={true}
      />,
    );
    const nettoNettoText = screen.getByText('Razem netto').nextSibling?.textContent;

    expect(bruttoNettoText).toBe(nettoNettoText);
    expect(bruttoNettoText).toBe('100,00 zł');
  });

  it('shows shipping as separate line for brutto payer (not inline in products)', () => {
    render(
      <OrderSummarySection
        products={[makeProduct({ priceNet: 100, quantity: 1 })]}
        subtotalNet={100}
        discountAmount={0}
        customerDiscount={0}
        shippingCosts={[24.6]}
        totalNet={120}
        totalGross={147.6}
        isNetPayer={false}
      />,
    );

    expect(screen.getByText(/Wysyłka \(brutto\)/)).toBeInTheDocument();
    expect(screen.getByText('24,60 zł')).toBeInTheDocument();
  });

  it('formats floating-point quantity without artifacts', () => {
    // Regression: 2.2800000000000002 displayed instead of 2.28
    const products = [
      makeProduct({
        name: 'Folia - 760mm x 30m',
        priceUnit: 'meter',
        priceNet: 229,
        quantity: 1,
        requiredMb: 3,
      }),
    ];
    render(
      <OrderSummarySection
        products={products}
        subtotalNet={522.12}
        discountAmount={0}
        customerDiscount={0}
        totalNet={522.12}
        totalGross={642.21}
      />,
    );

    // 3 mb × 0.76m = 2.28 m², NOT 2.2800000000000002
    expect(screen.getByText(/2\.28 m²/)).toBeInTheDocument();
    expect(screen.queryByText(/2\.28000/)).not.toBeInTheDocument();
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
