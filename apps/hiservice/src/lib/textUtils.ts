/**
 * Normalizes a search query by removing all whitespace characters.
 */
export const normalizeSearchQuery = (query: string): string => {
  if (!query) return '';
  return query.replace(/\s/g, '');
};

/**
 * Strips PostgREST special characters from user input before embedding
 * in .or() / .ilike() filter strings. Prevents query parsing errors.
 */
export const sanitizeForPostgrest = (value: string): string =>
  value.replace(/[%_(),.]/g, '');
