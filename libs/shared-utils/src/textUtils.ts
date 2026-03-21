import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import DOMPurify from 'dompurify';

/**
 * Normalizes a search query by removing all whitespace characters.
 * Used for space-agnostic searching of phone numbers, offer numbers, etc.
 *
 * @param query - The search query string
 * @returns Query with all whitespace removed
 *
 * @example
 * normalizeSearchQuery("511 042 123") // returns "511042123"
 * normalizeSearchQuery("+48 733 854 184") // returns "+48733854184"
 */
export const normalizeSearchQuery = (query: string): string => {
  if (!query) return '';
  return query.replace(/\s/g, '');
};

/**
 * Capitalizes the first letter of each word in a string.
 */
export const autoCapitalizeWords = (text: string): string =>
  text.replace(/(?:^|\s)\S/g, (ch) => ch.toUpperCase());

/**
 * Formats a viewed_at date with relative formatting (today, yesterday, or full date).
 * Returns format: "HH:mm, dziś" / "HH:mm, wczoraj" / "HH:mm, d MMMM"
 */
export const formatViewedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const time = format(date, 'HH:mm', { locale: pl });

  if (date >= today) {
    return `${time}, dziś`;
  } else if (date >= yesterday) {
    return `${time}, wczoraj`;
  } else {
    return `${time}, ${format(date, 'd MMMM', { locale: pl })}`;
  }
};

/** Escape HTML special characters to prevent XSS in text content. */
const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Parses simple markdown-style lists into HTML.
 * Lines starting with "- " or "* " are converted to <ul><li> elements.
 * Other lines become <p> elements.
 * Output is sanitized with DOMPurify to prevent XSS.
 */
export const parseMarkdownLists = (text: string): string => {
  if (!text) return '';

  const lines = text.split('\n');
  let result = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^[-*]\s+/.test(trimmed);

    if (isBullet) {
      if (!inList) {
        result += '<ul class="list-disc pl-5 my-1">';
        inList = true;
      }
      result += `<li class="my-0">${escapeHtml(trimmed.replace(/^[-*]\s+/, ''))}</li>`;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      if (trimmed) {
        result += `<p class="my-1">${escapeHtml(trimmed)}</p>`;
      }
    }
  }

  if (inList) result += '</ul>';
  return DOMPurify.sanitize(result);
};
