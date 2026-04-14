import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SalesProductOption, SalesProductVariantOption } from '../SalesProductSelectionDrawer';

export interface RollMatch {
  rollId: string;
  rollCode: string;
  rollWidthMm: number;
  rollRemainingMb: number;
  /** The product variant that matches this roll */
  product: SalesProductOption;
  variant: SalesProductVariantOption;
  /** Selection key for the drawer (variant:id) */
  selectionKey: string;
}

/**
 * Searches active rolls by the last N characters of productCode or barcode,
 * then matches the found roll to a product variant by name + width.
 *
 * Only triggers when query is >= 4 chars and looks like a roll code (has digits).
 */
export function useRollQuickSearch(
  instanceId: string | null,
  query: string,
  products: SalesProductOption[],
) {
  const [match, setMatch] = useState<RollMatch | null>(null);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset when query is too short or has no digits — minimum 8 chars to match roll suffix
    const trimmed = query.trim().replace(/-/g, '');
    if (!instanceId || trimmed.length < 8 || !/\d/.test(trimmed)) {
      setMatch(null);
      setSearching(false);
      return;
    }

    // Debounce 300ms
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSearching(true);
      searchRoll(instanceId, trimmed, products, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) {
            setMatch(result);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setMatch(null);
            setSearching(false);
          }
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [instanceId, query, products]);

  return { match, searching };
}

async function searchRoll(
  instanceId: string,
  rawQuery: string,
  products: SalesProductOption[],
  signal: AbortSignal,
): Promise<RollMatch | null> {
  // User types without dashes (e.g. "UH448415"), but codes in DB have dashes ("UH44-8415").
  // Search with both: raw input and with a dash inserted in the middle.
  const query = rawQuery.replace(/-/g, '');
  const withDash = query.length === 8
    ? `${query.slice(0, 4)}-${query.slice(4)}`
    : query;

  // Search active rolls where productCode or barcode ends with query (with or without dash)
  const { data: rolls } = await supabase
    .from('sales_rolls')
    .select('id, product_name, product_code, barcode, width_mm, initial_remaining_mb')
    .eq('instance_id', instanceId)
    .eq('status', 'active')
    .or(
      [
        `product_code.ilike.%${query}`,
        `product_code.ilike.%${withDash}`,
        `barcode.ilike.%${query}`,
        `barcode.ilike.%${withDash}`,
      ].join(','),
    )
    .limit(5);

  if (signal.aborted || !rolls?.length) return null;

  // Also fetch usage to compute remaining
  const rollIds = rolls.map((r) => r.id);
  const { data: usages } = await supabase
    .from('sales_roll_usages')
    .select('roll_id, used_mb')
    .in('roll_id', rollIds);

  if (signal.aborted) return null;

  const usageByRoll = new Map<string, number>();
  for (const u of usages || []) {
    usageByRoll.set(u.roll_id, (usageByRoll.get(u.roll_id) || 0) + Number(u.used_mb));
  }

  // Try to match each found roll to a product variant
  for (const roll of rolls) {
    const widthMm = Number(roll.width_mm);
    const initialRemaining = Number(roll.initial_remaining_mb ?? 0);
    const usedMb = usageByRoll.get(roll.id) || 0;
    const remainingMb = Math.max(0, initialRemaining - usedMb);

    if (remainingMb <= 0) continue; // Skip depleted rolls

    const matched = matchRollToVariant(roll.product_name, widthMm, products);
    if (!matched) continue;

    return {
      rollId: roll.id,
      rollCode: roll.product_code || roll.barcode || roll.id.slice(0, 8),
      rollWidthMm: widthMm,
      rollRemainingMb: remainingMb,
      product: matched.product,
      variant: matched.variant,
      selectionKey: `variant:${matched.variant.id}`,
    };
  }

  return null;
}

/**
 * Matches a roll's product name + width to a product variant.
 * Uses the same fuzzy logic as RollSelectDrawer: strip width suffix, compare base names.
 */
function matchRollToVariant(
  rollProductName: string,
  rollWidthMm: number,
  products: SalesProductOption[],
): { product: SalesProductOption; variant: SalesProductVariantOption } | null {
  const rollBase = rollProductName
    .toLowerCase()
    .replace(/\s*-\s*\d+mm.*$/, '')
    .replace(/\s*\d+mm.*$/, '')
    .trim();

  for (const product of products) {
    if (!product.hasVariants || !product.variants?.length) continue;

    // Check if product base name matches roll base name
    const productBase = product.fullName
      .toLowerCase()
      .replace(/^ultrafit\s+/i, '')
      .replace(/\s*-\s*\d+mm.*$/, '')
      .trim();

    const matches =
      rollBase === productBase ||
      rollBase.includes(productBase) ||
      productBase.includes(rollBase);

    if (!matches) continue;

    // Find the variant with matching width
    const widthStr = `${rollWidthMm}mm`;
    const variant = product.variants.find((v) =>
      v.variantName.toLowerCase().includes(widthStr.toLowerCase()),
    );

    if (variant) return { product, variant };
  }

  return null;
}
