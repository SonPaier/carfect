/**
 * Matches a search query against multiple searchable fields.
 * Splits query into words and checks that every word appears in at least one field.
 */
export function matchesSearchQuery(
  query: string,
  fields: (string | null | undefined)[],
): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const searchable = fields.filter(Boolean).join(' ').toLowerCase();
  return words.every((word) => searchable.includes(word));
}
