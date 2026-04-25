import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import {
  buildInstructionEmailHtml,
  defaultInstructionTemplate,
  escapeHtml,
  getSmtpConfig,
  makeLinksClickable,
  sanitizeCustomerEmail,
  type InstanceInfo,
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstructionSendRow {
  id: string;
  public_token: string;
  customer_id: string | null;
  post_sale_instructions: {
    title: string;
    slug: string;
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
    // Authenticate the caller against Supabase first — without this, the
    // function is an open SMTP relay and an enumeration oracle for any
    // instruction in the DB. The token is validated by the user-context
    // client; the actual fetches still use the service role afterwards.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userResult, error: userError } = await userClient.auth.getUser();
    if (userError || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userResult.user.id;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { sendId, instructionId, customEmailBody, toEmail } = (await req.json()) as {
      sendId?: string;
      instructionId?: string;
      customEmailBody?: string;
      toEmail?: string;
    };

    if (!sendId && !instructionId) {
      return new Response(JSON.stringify({ error: 'sendId or instructionId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    type InstanceRow = InstanceInfo & { name: string; slug: string };
    let row: InstructionSendRow | null = null;
    let instructionPayload: { title: string; slug: string; content: unknown } | null = null;
    let instance: InstanceRow | null = null;

    if (sendId) {
      console.log('Fetching instruction send:', sendId);
      const { data: send, error: sendError } = await supabase
        .from('post_sale_instruction_sends')
        .select(
          `
        id, public_token, customer_id,
        post_sale_instructions ( title, slug, content ),
        reservations ( customer_name, customer_email, customer_phone ),
        instances ( id, name, slug, email, phone, address, website, contact_person, logo_url, social_facebook, social_instagram )
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
      row = send as InstructionSendRow;
      instructionPayload = row.post_sale_instructions;
      instance = row.instances;
    } else if (instructionId) {
      console.log('Fetching instruction direct:', instructionId);
      const { data: instr, error: instrError } = await supabase
        .from('post_sale_instructions')
        .select(
          `
        id, title, slug, content,
        instances ( id, name, slug, email, phone, address, website, contact_person, logo_url, social_facebook, social_instagram )
      `,
        )
        .eq('id', instructionId)
        .single();
      if (instrError || !instr) {
        console.error('Instruction fetch error:', instrError);
        return new Response(JSON.stringify({ error: 'Instruction not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const instrRow = instr as {
        title: string;
        slug: string;
        content: unknown;
        instances: InstanceRow | null;
      };
      instructionPayload = {
        title: instrRow.title,
        slug: instrRow.slug,
        content: instrRow.content,
      };
      instance = instrRow.instances;
    }

    // Verify the caller has admin/employee role on the resolved instance —
    // without this, an authenticated user from instance A could send mail on
    // behalf of instance B by guessing an instructionId from B.
    const targetInstanceId =
      (row?.instances as { id?: string } | null | undefined)?.id ??
      (instance as { id?: string } | null | undefined)?.id ??
      null;
    if (targetInstanceId) {
      const { data: hasRole } = await supabase.rpc('has_instance_role', {
        _user_id: callerId,
        _role: 'admin',
        _instance_id: targetInstanceId,
      });
      if (!hasRole) {
        const { data: empRole } = await supabase.rpc('has_instance_role', {
          _user_id: callerId,
          _role: 'employee',
          _instance_id: targetInstanceId,
        });
        if (!empRole) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Prefer the explicit toEmail from the request body. Fall back to the
    // joined reservation row when present (sendId path only).
    const rawEmail = toEmail ?? row?.reservations?.customer_email ?? null;
    const customerEmail = sanitizeCustomerEmail(rawEmail);

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No customer email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const instanceSlug = instance?.slug ?? 'app';
    const instanceName = instance?.name ?? '';
    const instructionSlug = instructionPayload?.slug ?? row?.public_token ?? '';

    const instructionUrl = `https://${instanceSlug}.carfect.pl/instrukcje/${instructionSlug}`;

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

    // Escape user-supplied body before injecting into the HTML template, then
    // re-link plain URLs. This prevents stored HTML/JS injection through the
    // customEmailBody field (the admin types it, but the input flows verbatim
    // into customer inboxes — never trust it raw).
    const plainBody = customEmailBody ?? defaultInstructionTemplate;
    const bodyHtml = plainBody
      .split('\n')
      .map((line) => {
        const escaped = escapeHtml(line);
        return escaped.trim() === ''
          ? '<br>'
          : `<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#333;">${makeLinksClickable(escaped)}</p>`;
      })
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
