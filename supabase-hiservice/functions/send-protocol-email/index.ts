import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { protocolId, recipientEmail, subject, message, instanceId, publicUrl } = await req.json();

    if (!protocolId || !recipientEmail || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch instance data
    const { data: instance, error: instanceError } = await supabaseClient
      .from('instances')
      .select('name, slug, email, phone, address, website, contact_person, logo_url')
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) throw new Error('Instance not found');

    const logoHtml = instance.logo_url
      ? `<div style="text-align:center;padding:30px 0 20px;"><img src="${instance.logo_url}" alt="${instance.name || ''}" style="max-height:60px;max-width:200px;" /></div>`
      : `<div style="text-align:center;padding:30px 0 20px;"><h1 style="font-family:'Inter',Arial,sans-serif;font-size:22px;font-weight:700;color:#111;margin:0;">${instance.name || ''}</h1></div>`;

    const footerParts: string[] = [];
    if (instance.phone) footerParts.push(`<span style="margin:0 8px;"><a href="tel:${instance.phone}" style="color:#555;text-decoration:none;">${instance.phone}</a></span>`);
    if (instance.address) footerParts.push(`<span style="margin:0 8px;">${instance.address}</span>`);
    if (instance.website) footerParts.push(`<span style="margin:0 8px;"><a href="${instance.website}" style="color:#555;text-decoration:underline;">${instance.website}</a></span>`);
    if (instance.email) footerParts.push(`<span style="margin:0 8px;">${instance.email}</span>`);

    const messageHtml = message.replace(/\n/g, '<br>');

    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:'Inter',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:20px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td>${logoHtml}</td></tr>
<tr><td>
  <div style="background:#ffffff;border-radius:12px;padding:36px 32px;margin:0 12px;">
    <div style="font-size:15px;line-height:1.7;color:#333;">
      <p style="margin:0 0 8px;">${messageHtml}</p>
    </div>
    ${publicUrl ? `
    <div style="text-align:center;margin:28px 0 12px;">
      <a href="${publicUrl}" style="display:inline-block;background-color:#111;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;font-family:'Inter',Arial,sans-serif;">Zobacz protokół</a>
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:16px;">Lub skopiuj link: <a href="${publicUrl}" style="color:#666;">${publicUrl}</a></p>
    ` : ''}
  </div>
</td></tr>
<tr><td style="padding:24px 12px 8px;text-align:center;">
  <p style="margin:0 0 6px;font-size:14px;color:#555;font-weight:600;">${instance.name || ''}</p>
  ${instance.contact_person ? `<p style="margin:0 0 10px;font-size:13px;color:#777;">${instance.contact_person}</p>` : ''}
  <div style="font-size:12px;color:#888;line-height:1.8;">${footerParts.join('<br>')}</div>
</td></tr>
<tr><td style="padding:20px 12px 30px;text-align:center;border-top:1px solid #e0e0e0;">
  <p style="margin:0;font-size:11px;color:#bbb;font-family:'Inter',Arial,sans-serif;">
    Wygenerowano przy użyciu systemu <a href="https://hiservice.pl" style="color:#999;text-decoration:underline;">Hi Service</a>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) throw new Error('SMTP not configured');

    const client = new SMTPClient({
      connection: { hostname: smtpHost, port: smtpPort, tls: true, auth: { username: smtpUser, password: smtpPass } },
    });

    const replyTo = instance.email || smtpUser;
    const fromName = instance.name || 'Protokoły';

    await client.send({
      from: `${fromName} <${smtpUser}>`,
      to: recipientEmail,
      replyTo,
      subject,
      html: htmlContent,
    });
    await client.close();

    // Update protocol status to 'sent'
    await supabaseClient
      .from('protocols')
      .update({ status: 'sent', customer_email: recipientEmail })
      .eq('id', protocolId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[send-protocol-email]', error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
