import { assertEquals } from 'jsr:@std/assert';
import { escapeHtml, sanitizeUrl, truncate, isValidUuid, formatDuration } from './validation.ts';

// ============================================================================
// VAL-001 – VAL-009: escapeHtml
// ============================================================================

Deno.test('VAL-001: escapeHtml - escapes ampersand', () => {
  assertEquals(escapeHtml('a & b'), 'a &amp; b');
});

Deno.test('VAL-002: escapeHtml - escapes less-than', () => {
  assertEquals(escapeHtml('a < b'), 'a &lt; b');
});

Deno.test('VAL-003: escapeHtml - escapes greater-than', () => {
  assertEquals(escapeHtml('a > b'), 'a &gt; b');
});

Deno.test('VAL-004: escapeHtml - escapes double quote', () => {
  assertEquals(escapeHtml(`say "hi"`), 'say &quot;hi&quot;');
});

Deno.test('VAL-005: escapeHtml - escapes single quote', () => {
  assertEquals(escapeHtml("it's"), 'it&#39;s');
});

Deno.test('VAL-006: escapeHtml - neutralises script injection', () => {
  const safe = escapeHtml('<script>alert(1)</script>');
  assertEquals(safe, '&lt;script&gt;alert(1)&lt;/script&gt;');
});

Deno.test('VAL-007: escapeHtml - normal text passes through unchanged', () => {
  assertEquals(escapeHtml('Hello world'), 'Hello world');
});

Deno.test('VAL-008: escapeHtml - empty string returns empty string', () => {
  assertEquals(escapeHtml(''), '');
});

Deno.test('VAL-009: escapeHtml - escapes all special characters at once', () => {
  assertEquals(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

// ============================================================================
// VAL-010 – VAL-017: sanitizeUrl
// ============================================================================

Deno.test('VAL-010: sanitizeUrl - accepts https URL', () => {
  assertEquals(sanitizeUrl('https://example.com'), 'https://example.com');
});

Deno.test('VAL-011: sanitizeUrl - accepts http URL', () => {
  assertEquals(sanitizeUrl('http://example.com'), 'http://example.com');
});

Deno.test('VAL-012: sanitizeUrl - rejects javascript protocol', () => {
  assertEquals(sanitizeUrl('javascript:alert(1)'), null);
});

Deno.test('VAL-013: sanitizeUrl - rejects data URI', () => {
  assertEquals(sanitizeUrl('data:text/html,<h1>XSS</h1>'), null);
});

Deno.test('VAL-014: sanitizeUrl - returns null for null input', () => {
  assertEquals(sanitizeUrl(null), null);
});

Deno.test('VAL-015: sanitizeUrl - returns null for empty string', () => {
  assertEquals(sanitizeUrl(''), null);
});

Deno.test('VAL-016: sanitizeUrl - returns null for invalid URL', () => {
  assertEquals(sanitizeUrl('not a url at all'), null);
});

Deno.test('VAL-017: sanitizeUrl - accepts https URL with path and query', () => {
  const url = 'https://example.com/path?q=1';
  assertEquals(sanitizeUrl(url), url);
});

// ============================================================================
// VAL-018 – VAL-023: truncate
// ============================================================================

Deno.test('VAL-018: truncate - truncates string to max length', () => {
  assertEquals(truncate('hello world', 5), 'hello');
});

Deno.test('VAL-019: truncate - returns empty string for null', () => {
  assertEquals(truncate(null, 100), '');
});

Deno.test('VAL-020: truncate - returns empty string for undefined', () => {
  assertEquals(truncate(undefined, 100), '');
});

Deno.test('VAL-021: truncate - returns empty string for empty string', () => {
  assertEquals(truncate('', 100), '');
});

Deno.test('VAL-022: truncate - preserves string shorter than max', () => {
  assertEquals(truncate('hi', 100), 'hi');
});

Deno.test('VAL-023: truncate - preserves string equal to max length', () => {
  assertEquals(truncate('hello', 5), 'hello');
});

// ============================================================================
// VAL-024 – VAL-029: isValidUuid
// ============================================================================

Deno.test('VAL-024: isValidUuid - accepts valid UUID v4', () => {
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true);
});

Deno.test('VAL-025: isValidUuid - accepts uppercase UUID', () => {
  assertEquals(isValidUuid('550E8400-E29B-41D4-A716-446655440000'), true);
});

Deno.test('VAL-026: isValidUuid - rejects plain text', () => {
  assertEquals(isValidUuid('not-a-uuid'), false);
});

Deno.test('VAL-027: isValidUuid - rejects empty string', () => {
  assertEquals(isValidUuid(''), false);
});

Deno.test('VAL-028: isValidUuid - rejects UUID with wrong segment length', () => {
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716-44665544000'), false);
});

Deno.test('VAL-029: isValidUuid - rejects UUID with extra characters', () => {
  assertEquals(isValidUuid('550e8400-e29b-41d4-a716-4466554400001'), false);
});

// ============================================================================
// VAL-030 – VAL-035: formatDuration
// ============================================================================

Deno.test("VAL-030: formatDuration - 12 months returns '1 rok'", () => {
  assertEquals(formatDuration(12), '1 rok');
});

Deno.test("VAL-031: formatDuration - 24 months returns '2 lata'", () => {
  assertEquals(formatDuration(24), '2 lata');
});

Deno.test("VAL-032: formatDuration - 36 months returns '3 lata'", () => {
  assertEquals(formatDuration(36), '3 lata');
});

Deno.test("VAL-033: formatDuration - 48 months returns '4 lata'", () => {
  assertEquals(formatDuration(48), '4 lata');
});

Deno.test("VAL-034: formatDuration - 60 months returns '5 lat'", () => {
  assertEquals(formatDuration(60), '5 lat');
});

Deno.test("VAL-035: formatDuration - 120 months returns '10 lat'", () => {
  assertEquals(formatDuration(120), '10 lat');
});
