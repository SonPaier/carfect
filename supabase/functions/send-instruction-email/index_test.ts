import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import {
  buildInstructionEmailHtml,
  getSmtpConfig,
  sanitizeCustomerEmail,
} from "./helpers.ts";

// ============================================================================
// buildInstructionEmailHtml
// ============================================================================

Deno.test("buildInstructionEmailHtml renders CTA with provided URL", () => {
  const html = buildInstructionEmailHtml(
    "<p>Test body</p>",
    { name: "Test Studio", email: "test@studio.pl" },
    "https://teststudio.carfect.pl/instructions/abc-token-123",
  );

  assertStringIncludes(html, "https://teststudio.carfect.pl/instructions/abc-token-123");
  assertStringIncludes(html, "Otwórz instrukcję");
});

Deno.test("buildInstructionEmailHtml returns valid HTML document structure", () => {
  const html = buildInstructionEmailHtml(
    "<p>Content</p>",
    {
      name: "My Studio",
      phone: "+48 123 456 789",
      address: "ul. Testowa 1",
      website: "https://mystudio.pl",
      email: "contact@mystudio.pl",
      logo_url: "https://cdn.example.com/logo.png",
      contact_person: "Jan Kowalski",
    },
    "https://mystudio.carfect.pl/instructions/token-xyz",
  );

  // Must be a full HTML document
  assertEquals(html.trimStart().startsWith("<!DOCTYPE html>"), true);
  assertStringIncludes(html, "</html>");
  // Logo should render as <img>
  assertStringIncludes(html, "<img");
  // Contact person should appear in footer
  assertStringIncludes(html, "Jan Kowalski");
});

// ============================================================================
// sanitizeCustomerEmail
// ============================================================================

Deno.test("sanitizeCustomerEmail strips mailto: prefix and trims whitespace", () => {
  assertEquals(sanitizeCustomerEmail("mailto:user@example.com"), "user@example.com");
  assertEquals(sanitizeCustomerEmail("MAILTO:user@example.com"), "user@example.com");
  assertEquals(sanitizeCustomerEmail("  user@example.com  "), "user@example.com");
  assertEquals(sanitizeCustomerEmail("mailto: user@example.com "), "user@example.com");
});

Deno.test("sanitizeCustomerEmail returns null for empty or whitespace-only input", () => {
  assertEquals(sanitizeCustomerEmail(""), null);
  assertEquals(sanitizeCustomerEmail("   "), null);
  assertEquals(sanitizeCustomerEmail(null), null);
  assertEquals(sanitizeCustomerEmail(undefined), null);
  assertEquals(sanitizeCustomerEmail("mailto:"), null);
  assertEquals(sanitizeCustomerEmail("MAILTO:   "), null);
});

// ============================================================================
// getSmtpConfig
// ============================================================================

Deno.test("getSmtpConfig prefers INSTRUCTION_SMTP_HOST over SMTP_HOST", () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: "smtp.instrukcje.pl",
    SMTP_HOST: "smtp.offers.pl",
    INSTRUCTION_SMTP_USER: "instrukcje@carfect.pl",
    INSTRUCTION_SMTP_PASS: "secret",
  });

  assertEquals(config?.host, "smtp.instrukcje.pl");
});

Deno.test("getSmtpConfig falls back to SMTP_HOST when INSTRUCTION_SMTP_HOST is missing", () => {
  const config = getSmtpConfig({
    SMTP_HOST: "smtp.fallback.pl",
    INSTRUCTION_SMTP_USER: "instrukcje@carfect.pl",
    INSTRUCTION_SMTP_PASS: "secret",
  });

  assertEquals(config?.host, "smtp.fallback.pl");
});

Deno.test("getSmtpConfig returns null when INSTRUCTION_SMTP_USER is missing", () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: "smtp.instrukcje.pl",
    INSTRUCTION_SMTP_PASS: "secret",
  });

  assertEquals(config, null);
});

Deno.test("getSmtpConfig returns null when INSTRUCTION_SMTP_PASS is missing", () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_HOST: "smtp.instrukcje.pl",
    INSTRUCTION_SMTP_USER: "instrukcje@carfect.pl",
  });

  assertEquals(config, null);
});

Deno.test("getSmtpConfig defaults port to 587 when SMTP port env vars are not provided", () => {
  const config = getSmtpConfig({
    INSTRUCTION_SMTP_USER: "instrukcje@carfect.pl",
    INSTRUCTION_SMTP_PASS: "secret",
  });

  assertEquals(config?.port, 587);
});
