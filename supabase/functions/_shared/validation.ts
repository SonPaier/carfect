// Validation & Sanitization helpers shared across edge functions.

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch {
    /* invalid URL */
  }
  return null;
}

export function truncate(s: string | undefined | null, max: number): string {
  if (!s) return '';
  return s.slice(0, max);
}

export function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export function formatDuration(months: number): string {
  const years = months / 12;
  if (years === 1) return '1 rok';
  if (years < 5) return `${years} lata`;
  return `${years} lat`;
}
