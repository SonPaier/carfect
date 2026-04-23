/**
 * Resolves the effective price for a product variant.
 *
 * Variants inherit the parent product's price by default.
 * A positive variant price overrides the parent price.
 * null, undefined, 0, or negative → inherit parent.
 */
export function resolveVariantPrice(
  variantPrice: number | null | undefined,
  parentPrice: number,
): number {
  if (variantPrice == null || variantPrice <= 0) {
    return parentPrice;
  }
  return variantPrice;
}
