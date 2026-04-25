import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';
import {
  buildInstructionEmailHtml,
  escapeHtml,
  getSmtpConfig,
  makeLinksClickable,
  safeUrl,
  sanitizeCustomerEmail,
} from './helpers.ts';

// ============================================================================
// buildInstructionEmailHtml
// ============================================================================

Deno.test('buildInstructionEmailHtml renders CTA with provided URL', () => {
  const html = buildInstructionEmailHtml(
    '<p>Test body</p>',
    { name: 'Test Studio', email: 'test@studio.pl' },
    'https://teststudio.carfect.pl/instructions/abc-token-123',
  );

  assertStringIncludes(html, 'https://teststudio.carfect.pl/instructions/abc-token-123');
  assertStringIncludes(html, 'Otwórz instrukcję');
});

Deno.test('buildInstructionEmailHtml returns valid HTML document structure', () => {
  const html = buildInstructionEmailHtml(
    '<p>Content</p>',
    {
      name: 'My Studio',
      phone: '+48 123 456 789',
      address: 'ul. Testowa 1',
      website: 'https://mystudio.pl',
      email: 'contact@mystudio.pl',
      logo_url: 'https://cdn.example.com/logo.png',
      contact_person: 'Jan Kowalski',
    },
    'https://mystudio.carfect.pl/instructions/token-xyz',
  );

  // Must be a full HTML document
  assertEquals(html.trimStart().startsWith('<!DOCTYPE html>'), true);
  assertStringIncludes(html, '</html>');
  // Logo should render as <img>
  assertStringIncludes(html, '<img');
  // Contact person should appear in footer
  assertStringIncludes(html, 'Jan Kowalski');
});

// ============================================================================
// sanitizeCustomerEmail
// ============================================================================

Deno.test('sanitizeCustomerEmail strips mailto: prefix and trims whitespace', () => {
  assertEquals(sanitizeCustomerEmail('mailto:user@example.com'), 'user@example.com');
  assertEquals(sanitizeCustomerEmail('MAILTO:user@example.com'), 'user@example.com');
  assertEquals(sanitizeCustomerEmail('  user@example.com  '), 'user@example.com');
  assertEquals(sanitizeCustomerEmail('mailto: user@example.com '), 'user@example.com');
});

Deno.test('sanitizeCustomerEmail returns null for empty or whitespace-only input', () => {
  assertEquals(sanitizeCustomerEmail(''), null);
  assertEquals(sanitizeCustomerEmail('   '), null);
  assertEquals(sanitizeCustomerEmail(null), null);
  assertEquals(sanitizeCustomerEmail(undefined), null);
  assertEquals(sanitizeCustomerEmail('mailto:'), null);
  assertEquals(sanitizeCustomerEmail('MAILTO:   '), null);
});

// ============================================================================
// getSmtpConfig
// ============================================================================

Deno.test('getSmtpConfig prefers INSTRUCTION_SMTP_HOST over SMTP_HOST', () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: 'smtp.instrukcje.pl',
    SMTP_HOST: 'smtp.offers.pl',
    INSTRUCTION_SMTP_USER: 'instrukcje@carfect.pl',
    INSTRUCTION_SMTP_PASS: 'secret',
  });

  assertEquals(config?.host, 'smtp.instrukcje.pl');
});

Deno.test('getSmtpConfig falls back to SMTP_HOST when INSTRUCTION_SMTP_HOST is missing', () => {
  const config = getSmtpConfig({
    SMTP_HOST: 'smtp.fallback.pl',
    INSTRUCTION_SMTP_USER: 'instrukcje@carfect.pl',
    INSTRUCTION_SMTP_PASS: 'secret',
  });

  assertEquals(config?.host, 'smtp.fallback.pl');
});

Deno.test('getSmtpConfig returns null when INSTRUCTION_SMTP_USER is missing', () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: 'smtp.instrukcje.pl',
    INSTRUCTION_SMTP_PASS: 'secret',
  });

  assertEquals(config, null);
});

Deno.test('getSmtpConfig returns null when INSTRUCTION_SMTP_PASS is missing', () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: 'smtp.instrukcje.pl',
    INSTRUCTION_SMTP_USER: 'instrukcje@carfect.pl',
  });

  assertEquals(config, null);
});

Deno.test('getSmtpConfig defaults port to 587 when SMTP port env vars are not provided', () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_USER: 'instrukcje@carfect.pl',
    INSTRUCTION_SMTP_PASS: 'secret',
  });

  assertEquals(config?.port, 587);
});

// ============================================================================
// escapeHtml — XSS hardening for the email template
// ============================================================================

Deno.test('escapeHtml escapes &, <, >, " and \'', () => {
  assertEquals(
    escapeHtml(`<script>alert("xss" + 'pwn')</script> & friends`),
    '&lt;script&gt;alert(&quot;xss&quot; + &#39;pwn&#39;)&lt;/script&gt; &amp; friends',
  );
});

Deno.test('escapeHtml returns empty string for null/undefined/empty', () => {
  assertEquals(escapeHtml(null), '');
  assertEquals(escapeHtml(undefined), '');
  assertEquals(escapeHtml(''), '');
});

// ============================================================================
// safeUrl — strip dangerous protocols from href targets
// ============================================================================

Deno.test('safeUrl preserves http and https URLs', () => {
  assertEquals(safeUrl('https://example.com/x'), 'https://example.com/x');
  assertEquals(safeUrl('http://example.com'), 'http://example.com');
});

Deno.test('safeUrl drops javascript:, data:, mailto: and other protocols', () => {
  assertEquals(safeUrl('javascript:alert(1)'), '');
  assertEquals(safeUrl('data:text/html,<script>'), '');
  assertEquals(safeUrl('mailto:x@y.com'), '');
  assertEquals(safeUrl('ftp://x.example.com'), '');
});

Deno.test('safeUrl returns empty string for null / undefined / empty', () => {
  assertEquals(safeUrl(null), '');
  assertEquals(safeUrl(undefined), '');
  assertEquals(safeUrl(''), '');
});

// ============================================================================
// makeLinksClickable
// ============================================================================

Deno.test('makeLinksClickable wraps http(s) URLs in anchor tags', () => {
  const out = makeLinksClickable('Visit https://example.com today');
  assertStringIncludes(out, '<a href="https://example.com"');
  assertStringIncludes(out, '>https://example.com</a>');
});

Deno.test('makeLinksClickable leaves plain text untouched when no URLs', () => {
  assertEquals(makeLinksClickable('just words here'), 'just words here');
});

// ============================================================================
// buildInstructionEmailHtml — XSS escaping
// ============================================================================

Deno.test('buildInstructionEmailHtml escapes HTML in instance.name and contact_person', () => {
  const html = buildInstructionEmailHtml(
    '<p>Body</p>',
    {
      name: "<script>alert('x')</script>",
      contact_person: '<img onerror=alert(1)>',
      email: 'owner@studio.pl',
    },
    'https://studio.carfect.pl/instrukcje/x',
  );
  // Raw script tag must not appear in the output.
  assertEquals(html.includes("<script>alert('x')</script>"), false);
  assertStringIncludes(html, '&lt;script&gt;');
  assertEquals(html.includes('<img onerror=alert(1)>'), false);
  assertStringIncludes(html, '&lt;img onerror=alert(1)&gt;');
});

Deno.test('buildInstructionEmailHtml drops javascript: instance.website href', () => {
  const html = buildInstructionEmailHtml(
    '<p>Body</p>',
    { name: 'Studio', website: "javascript:alert('xss')" },
    'https://studio.carfect.pl/instrukcje/x',
  );
  assertEquals(html.includes('javascript:alert'), false);
});

// ============================================================================
// sanitizeCustomerEmail — header-injection hardening
// ============================================================================

Deno.test('sanitizeCustomerEmail accepts a single well-formed address', () => {
  assertEquals(sanitizeCustomerEmail('user@example.com'), 'user@example.com');
  assertEquals(sanitizeCustomerEmail('  user@example.com  '), 'user@example.com');
  assertEquals(sanitizeCustomerEmail('mailto:user@example.com'), 'user@example.com');
});

Deno.test('sanitizeCustomerEmail rejects multi-address and display-name forms', () => {
  assertEquals(sanitizeCustomerEmail('a@x.com, b@y.com'), null);
  assertEquals(sanitizeCustomerEmail('a@x.com; b@y.com'), null);
  assertEquals(sanitizeCustomerEmail('Real Name <real@x.com>'), null);
});

Deno.test('sanitizeCustomerEmail rejects CR/LF (header injection)', () => {
  assertEquals(sanitizeCustomerEmail('a@x.com\nBCC: spammer@y.com'), null);
  assertEquals(sanitizeCustomerEmail('a@x.com\r\nFrom: phisher@y.com'), null);
});

Deno.test('sanitizeCustomerEmail rejects values without a domain TLD', () => {
  assertEquals(sanitizeCustomerEmail('user@localhost'), null);
  assertEquals(sanitizeCustomerEmail('not-an-email'), null);
});
