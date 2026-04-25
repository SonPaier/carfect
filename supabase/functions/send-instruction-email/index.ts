import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import {
  buildInstructionEmailHtml,
  defaultInstructionTemplate,
  getSmtpConfig,
  sanitizeCustomerEmail,
  type InstanceInfo,
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converts plain URLs in text to clickable anchor tags.
const makeLinksClickable = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(
    urlRegex,
    '<a href="$1" style="color:#555;text-decoration:underline;">$1</a>',
  );
};

interface InstructionSendRow {
  id: string;
  public_token: string;
  customer_id: string | null;
  post_sale_instructions: {
    title: string;
    content: unknown;
  } | null;
  reservations: {
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
  } | null;
  instances:
    | (InstanceInfo & {
        name: string;
        slug: string;
      })
    | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { sendId, customEmailBody, toEmail } = (await req.json()) as {
      sendId?: string;
      customEmailBody?: string;
      toEmail?: string;
    };

    if (!sendId) {
      return new Response(JSON.stringify({ error: 'sendId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching instruction send:', sendId);

    const { data: send, error: sendError } = await supabase
      .from('post_sale_instruction_sends')
      .select(
        `
        id, public_token, customer_id,
        post_sale_instructions ( title, content ),
        reservations ( customer_name, customer_email, customer_phone ),
        instances ( name, slug, email, phone, address, website, contact_person, logo_url, social_facebook, social_instagram )
      `,
      )
      .eq('id', sendId)
      .single();

    if (sendError || !send) {
      console.error('Send row fetch error:', sendError);
      return new Response(JSON.stringify({ error: 'Instruction send not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const row = send as InstructionSendRow;

    // Prefer the explicit toEmail from the request body (admin can override
    // the customer's stored address). Fall back to the joined reservation row.
    const rawEmail = toEmail ?? row.reservations?.customer_email ?? null;
    const customerEmail = sanitizeCustomerEmail(rawEmail);

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No customer email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instance = row.instances;
    const instanceSlug = instance?.slug ?? 'app';
    const instanceName = instance?.name ?? '';
    const publicToken = row.public_token;

    const instructionUrl = `https://${instanceSlug}.carfect.pl/instructions/${publicToken}`;

    console.log('Preparing email for:', customerEmail);

    // Get SMTP config — uses INSTRUCTION_SMTP_* env vars (with host/port fallback to SMTP_*)
    const smtpConfig = getSmtpConfig(Deno.env.toObject());
    if (!smtpConfig) {
      console.error('Missing SMTP configuration');
      return new Response(JSON.stringify({ error: 'SMTP not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build plain-text body from custom input or default template
    const plainBody = customEmailBody ?? defaultInstructionTemplate;

    // Convert to HTML paragraphs with clickable links
    const bodyHtml = makeLinksClickable(plainBody)
      .split('\n')
      .map((line) =>
        line.trim() === ''
          ? '<br>'
          : `<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#333;">${line}</p>`,
      )
      .join('\n');

    const instanceInfo: InstanceInfo = {
      name: instanceName,
      email: instance?.email ?? '',
      phone: instance?.phone ?? '',
      address: instance?.address ?? '',
      website: instance?.website ?? '',
      contact_person: instance?.contact_person ?? '',
      logo_url: instance?.logo_url ?? '',
      social_facebook: instance?.social_facebook ?? '',
      social_instagram: instance?.social_instagram ?? '',
    };

    const emailBody = buildInstructionEmailHtml(bodyHtml, instanceInfo, instructionUrl);

    console.log('Connecting to SMTP:', smtpConfig.host, smtpConfig.port);

    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: true,
        auth: {
          username: smtpConfig.user,
          password: smtpConfig.pass,
        },
      },
    });

    const replyTo = instance?.email ?? smtpConfig.user;
    const fromName = instanceName || 'Instrukcje';

    console.log('Sending email from:', fromName, smtpConfig.user, 'replyTo:', replyTo);

    await client.send({
      from: `${fromName} <${smtpConfig.user}>`,
      to: customerEmail,
      replyTo: replyTo,
      subject: `Instrukcja pielęgnacji — ${instanceName}`,
      html: emailBody,
    });

    await client.close();

    console.log('Instruction email sent successfully');

    // NOTE: Do NOT update sent_at — it is already set at INSERT time per spec section 8.

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-instruction-email:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
