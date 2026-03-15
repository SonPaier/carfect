/**
 * Shared offer utilities — extracted from duplicated code across the offers module.
 */

/**
 * Build public offer URL based on the current hostname.
 * Handles admin subdomain → public subdomain conversion.
 *
 * @example
 * // On armcar.admin.carfect.pl → https://armcar.carfect.pl/offers/{token}
 * // On armcar.carfect.pl → https://armcar.carfect.pl/offers/{token}
 * // On localhost → http://localhost:8080/offers/{token}
 */
export function getPublicOfferUrl(token: string): string {
  const hostname = window.location.hostname;

  if (hostname.endsWith('.admin.carfect.pl')) {
    const instanceSlug = hostname.replace('.admin.carfect.pl', '');
    return `https://${instanceSlug}.carfect.pl/offers/${token}`;
  }

  return `${window.location.origin}/offers/${token}`;
}

/**
 * Get the lowest available price for a product.
 * Price precedence: price_from → min(small, medium, large) → default_price → 0
 */
interface ProductPricing {
  price_from?: number | null;
  price_small?: number | null;
  price_medium?: number | null;
  price_large?: number | null;
  default_price?: number | null;
}

export function getLowestPrice(product: ProductPricing | null | undefined): number {
  if (!product) return 0;
  if (product.price_from != null) return product.price_from;

  const sizes = [product.price_small, product.price_medium, product.price_large].filter(
    (v): v is number => v != null,
  );
  if (sizes.length > 0) return Math.min(...sizes);

  return product.default_price ?? 0;
}

/**
 * Format price in PLN (Polish locale).
 * @param value — numeric price
 * @param rounded — if true, no decimal places (for compact display)
 */
const plnFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

const plnFormatterRounded = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(value: number, rounded = false): string {
  return rounded ? plnFormatterRounded.format(Math.round(value)) : plnFormatter.format(value);
}
