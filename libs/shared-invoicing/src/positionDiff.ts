import type { InvoicePosition } from './invoicing.types';

export type DiffStatus = 'added' | 'removed' | 'unchanged';

/**
 * Compares the current Fakturownia invoice positions against incoming positions
 * (e.g. mapped from an updated sales order). Returns a merged list of positions
 * with a per-row diff status, suitable for rendering in InvoiceForm with
 * highlighting.
 *
 * Matching strategy:
 *   1. external_id (most reliable; both sides came from Fakturownia)
 *   2. fallback: name + unit_price_gross (rounded to 2 decimals)
 *
 * Order of `merged`:
 *   - all invoicePositions in their original order, with `unchanged` status
 *     (or `added` if matched but only present in incoming — shouldn't happen but safe)
 *   - then incoming positions that didn't match any invoice row → `added`
 *   - then invoice positions that have no match in incoming → `removed`
 *
 * Removed rows keep their data and are intended to be sent with `_destroy: 1`
 * when the user accepts the diff. UI should render them strikethrough +
 * read-only.
 */
export function positionDiff(
  invoicePositions: InvoicePosition[],
  incomingPositions: InvoicePosition[],
): { merged: InvoicePosition[]; statuses: DiffStatus[] } {
  const round = (n: number) => Math.round(Number(n) * 100) / 100;
  const idKey = (p: InvoicePosition) => (p.external_id ? `id:${p.external_id}` : null);
  const nameKey = (p: InvoicePosition) => `nx:${p.name}|${round(p.unit_price_gross)}`;

  // Index incoming by both keys so invoice rows can match on either.
  const incomingById = new Map<string, InvoicePosition[]>();
  const incomingByName = new Map<string, InvoicePosition[]>();
  for (const p of incomingPositions) {
    const ik = idKey(p);
    if (ik) {
      const arr = incomingById.get(ik) ?? [];
      arr.push(p);
      incomingById.set(ik, arr);
    }
    const nk = nameKey(p);
    const arr = incomingByName.get(nk) ?? [];
    arr.push(p);
    incomingByName.set(nk, arr);
  }

  const merged: InvoicePosition[] = [];
  const statuses: DiffStatus[] = [];
  const usedIncoming = new Set<InvoicePosition>();

  for (const inv of invoicePositions) {
    const ik = idKey(inv);
    let match: InvoicePosition | undefined;
    if (ik) match = incomingById.get(ik)?.find((c) => !usedIncoming.has(c));
    if (!match) match = incomingByName.get(nameKey(inv))?.find((c) => !usedIncoming.has(c));
    if (match) {
      usedIncoming.add(match);
      merged.push({ ...inv, ...match, external_id: inv.external_id });
      statuses.push('unchanged');
    } else {
      merged.push(inv);
      statuses.push('removed');
    }
  }

  for (const inc of incomingPositions) {
    if (usedIncoming.has(inc)) continue;
    merged.push(inc);
    statuses.push('added');
  }

  return { merged, statuses };
}
