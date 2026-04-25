// Pure helper functions for send-instruction-email edge function.
// No serve() here — importable from test files.

export interface InstanceInfo {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contact_person?: string;
  logo_url?: string;
  social_facebook?: string;
  social_instagram?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export const defaultInstructionTemplate = `Dzień dobry,

udostępniamy instrukcję pielęgnacji wykonanej usługi. Prosimy o zapoznanie się z nią — pomoże zachować efekt na dłużej.

W razie pytań jesteśmy do dyspozycji.`;

/**
 * Builds a branded HTML email for the instruction link.
 * Mirrors buildEmailHtml from send-offer-email/index.ts,
 * with CTA label changed to "Otwórz instrukcję".
 */
export function buildInstructionEmailHtml(
  body: string,
  instance: InstanceInfo,
  instructionUrl: string,
): string {
  const logoHtml = instance.logo_url
    ? `<div style="text-align:center;padding:30px 0 20px;">
        <img src="${instance.logo_url}" alt="${instance.name || ""}" style="max-height:60px;max-width:200px;" />
      </div>`
    : `<div style="text-align:center;padding:30px 0 20px;">
        <h1 style="font-family:'Inter',Arial,sans-serif;font-size:22px;font-weight:700;color:#111;margin:0;">${instance.name || ""}</h1>
      </div>`;

  const footerParts: string[] = [];
  if (instance.phone) {
    footerParts.push(
      `<span style="margin:0 8px;"><a href="tel:${instance.phone}" style="color:#555;text-decoration:none;">${instance.phone}</a></span>`,
    );
  }
  if (instance.address) {
    footerParts.push(`<span style="margin:0 8px;">${instance.address}</span>`);
  }
  if (instance.website) {
    footerParts.push(
      `<span style="margin:0 8px;"><a href="${instance.website}" style="color:#555;text-decoration:underline;">${instance.website}</a></span>`,
    );
  }
  if (instance.email) {
    footerParts.push(`<span style="margin:0 8px;">${instance.email}</span>`);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Inter',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td>
  ${logoHtml}
</td></tr>
<tr><td>
  <div style="background:#ffffff;border-radius:12px;padding:36px 32px;margin:0 12px;">
    <div style="font-size:15px;line-height:1.7;color:#333;">
      ${body}
    </div>
    <div style="text-align:center;margin:28px 0 12px;">
      <a href="${instructionUrl}" style="display:inline-block;background-color:#111;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:'Inter',Arial,sans-serif;">Otwórz instrukcję</a>
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:16px;">
      Lub skopiuj link: <a href="${instructionUrl}" style="color:#666;">${instructionUrl}</a>
    </p>
  </div>
</td></tr>
<tr><td style="padding:24px 12px 8px;text-align:center;">
  <p style="margin:0 0 6px;font-size:14px;color:#555;font-weight:600;">${instance.name || ""}</p>
  ${instance.contact_person ? `<p style="margin:0 0 10px;font-size:13px;color:#777;">${instance.contact_person}</p>` : ""}
  <div style="font-size:12px;color:#888;line-height:1.8;">
    ${footerParts.join("<br>")}
  </div>
</td></tr>
<tr><td style="padding:20px 12px 30px;text-align:center;border-top:1px solid #e0e0e0;margin-top:16px;">
  <p style="margin:0;font-size:11px;color:#bbb;font-family:'Inter',Arial,sans-serif;">
    Wygenerowano przy użyciu systemu dla myjni i studio detailingu <a href="https://carfect.pl" style="color:#999;text-decoration:underline;">carfect.pl</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Strips mailto: prefix and trims whitespace from a raw email string.
 * Returns null if the result is empty.
 */
export function sanitizeCustomerEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^mailto:/i, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Reads SMTP configuration from an env-like record.
 * - host: INSTRUCTION_SMTP_HOST fallback SMTP_HOST
 * - port: INSTRUCTION_SMTP_PORT fallback SMTP_PORT, default 587
 * - user: INSTRUCTION_SMTP_USER (REQUIRED, no fallback)
 * - pass: INSTRUCTION_SMTP_PASS (REQUIRED, no fallback)
 *
 * Returns null if user or pass is missing.
 */
export function getSmtpConfig(env: Record<string, string | undefined>): SmtpConfig | null {
  const host = env["INSTRUCTION_SMTP_HOST"] ?? env["SMTP_HOST"];
  const portRaw = env["INSTRUCTION_SMTP_PORT"] ?? env["SMTP_PORT"];
  const port = portRaw ? parseInt(portRaw, 10) : 587;
  const user = env["INSTRUCTION_SMTP_USER"];
  const pass = env["INSTRUCTION_SMTP_PASS"];

  if (!user || !pass) return null;

  return { host: host ?? "", port, user, pass };
}
