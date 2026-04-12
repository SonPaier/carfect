export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  // Date-only strings (YYYY-MM-DD) parse as UTC midnight — use UTC accessors
  // to avoid off-by-one errors in western-UTC timezones.
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}
