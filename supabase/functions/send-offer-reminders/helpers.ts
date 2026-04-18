export function resolvePlaceholders(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReminderEmailHtml(params: {
  instanceName: string;
  instanceLogoUrl?: string | null;
  instancePhone?: string | null;
  body: string;
}): string {
  const { instanceName, instanceLogoUrl, instancePhone, body } = params;

  const safeInstanceName = escapeHtml(instanceName);
  const safeBody = escapeHtml(body);
  const safeInstancePhone = instancePhone ? escapeHtml(instancePhone) : null;

  const logoHtml = instanceLogoUrl
    ? `<div style="text-align:center;padding:30px 0 20px;">
        <img src="${instanceLogoUrl}" alt="${safeInstanceName}" style="max-height:60px;max-width:200px;" />
      </div>`
    : `<div style="text-align:center;padding:30px 0 20px;">
        <h1 style="font-family:'Inter',Arial,sans-serif;font-size:22px;font-weight:700;color:#111;margin:0;">${safeInstanceName}</h1>
      </div>`;

  const phoneHtml = safeInstancePhone
    ? `<span style="margin:0 8px;"><a href="tel:${safeInstancePhone}" style="color:#555;text-decoration:none;">${safeInstancePhone}</a></span>`
    : '';

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
    <div style="font-size:15px;line-height:1.7;color:#333;white-space:pre-line;">
      ${safeBody}
    </div>
  </div>
</td></tr>
<tr><td style="padding:24px 12px 8px;text-align:center;">
  <p style="margin:0 0 6px;font-size:14px;color:#555;font-weight:600;">${safeInstanceName}</p>
  ${phoneHtml ? `<div style="font-size:12px;color:#888;line-height:1.8;">${phoneHtml}</div>` : ''}
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
