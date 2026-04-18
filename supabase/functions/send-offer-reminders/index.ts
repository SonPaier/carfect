import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { normalizePhoneOrFallback } from '../_shared/phoneUtils.ts';
import { resolvePlaceholders, buildReminderEmailHtml } from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Human-readable service type names for email
const SERVICE_TYPE_LABELS: Record<string, string> = {
  serwis: 'serwis',
  kontrola: 'bezpłatna kontrola',
  serwis_gwarancyjny: 'serwis gwarancyjny',
  odswiezenie_powloki: 'odświeżenie powłoki',
};

const SMS_TEMPLATES: Record<string, string> = {
  serwis:
    '{short_name}: Zapraszamy na serwis pojazdu {vehicle_plate}. Kontakt: {reservation_phone}',
  kontrola:
    '{short_name}: Zapraszamy na bezplatna kontrole pojazdu {vehicle_plate}. Kontakt: {reservation_phone}',
  serwis_gwarancyjny:
    '{short_name}: Zapraszamy na serwis gwarancyjny pojazdu {vehicle_plate}. Kontakt: {reservation_phone}',
  odswiezenie_powloki:
    '{short_name}: Zapraszamy na odswiezenie powloki pojazdu {vehicle_plate}. Kontakt: {reservation_phone}',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const smsApiToken = Deno.env.get('SMSAPI_TOKEN');

    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const smtpFrom = Deno.env.get('SMTP_FROM') || smtpUser;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const markFailed = (id: string) =>
      supabase.from('customer_reminders').update({ status: 'failed' }).eq('id', id);

    const markSent = async (reminderId: string, instanceId: string, logPhone: string, logMessage: string, messageType: string) => {
      await supabase
        .from('customer_reminders')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', reminderId);
      await supabase.from('sms_logs').insert({
        instance_id: instanceId,
        phone: logPhone,
        message: logMessage,
        status: 'sent',
        message_type: messageType,
      });
    };

    const today = new Date().toISOString().split('T')[0];

    // Fetch due reminders from customer_reminders table
    const { data: reminders, error: fetchError } = await supabase
      .from('customer_reminders')
      .select(
        '*, channel, customer_email, instances(short_name, reservation_phone, timezone, sms_sender_name, logo_url, name, phone, email), reminder_templates(email_subject, email_body)',
      )
      .lte('scheduled_date', today)
      .eq('status', 'scheduled');

    if (fetchError) {
      console.error('Error fetching reminders:', fetchError);
      throw fetchError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders to send');
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${reminders.length} reminders to send`);

    let sentCount = 0;

    // Create SMTP client once if there are email reminders to send
    const hasEmailReminders = reminders.some((r) => (r.channel ?? 'sms') === 'email');
    if (hasEmailReminders && !smtpFrom) {
      console.error('SMTP_FROM is not configured — email reminders will be skipped');
    }
    const smtpClient =
      hasEmailReminders && smtpHost && smtpUser && smtpPass && smtpFrom
        ? new SMTPClient({
            connection: {
              hostname: smtpHost,
              port: smtpPort,
              tls: true,
              auth: {
                username: smtpUser,
                password: smtpPass,
              },
            },
          })
        : null;

    try {
    for (const reminder of reminders) {
      try {
        const instance = reminder.instances;
        if (!instance) {
          console.error(`Instance not found for reminder ${reminder.id}`);
          continue;
        }

        const channel = reminder.channel ?? 'sms';

        if (channel === 'email') {
          // --- Email branch ---
          const reminderTemplate = reminder.reminder_templates;
          const customerEmail: string | null = reminder.customer_email;

          if (!customerEmail) {
            console.error(`No customer_email for email reminder ${reminder.id}`);
            await markFailed(reminder.id);
            continue;
          }

          const placeholderVars: Record<string, string> = {
            short_name: instance.short_name || instance.name || '',
            vehicle_plate: reminder.vehicle_plate || '',
            reservation_phone: (instance.reservation_phone || instance.phone || '').replace(/\s/g, ''),
            customer_name: reminder.customer_name || '',
            service_type: SERVICE_TYPE_LABELS[reminder.service_type] || reminder.service_type || '',
          };

          const rawSubject = reminderTemplate?.email_subject || `{short_name} — przypomnienie o {service_type} pojazdu {vehicle_plate}`;
          const rawBody = reminderTemplate?.email_body || 'Dzień dobry {customer_name},\n\nPrzypominamy o zbliżającym się terminie — {service_type} dla pojazdu {vehicle_plate}.\n\nZapraszamy do kontaktu w celu umówienia wizyty: {reservation_phone}\n\nPozdrawiamy,\n{short_name}';

          const subject = resolvePlaceholders(rawSubject, placeholderVars);
          const body = resolvePlaceholders(rawBody, placeholderVars);

          const emailHtml = buildReminderEmailHtml({
            instanceName: instance.name || instance.short_name || '',
            instanceLogoUrl: instance.logo_url,
            instancePhone: instance.phone || instance.reservation_phone,
            body,
          });

          if (!smtpClient) {
            console.error(`Missing SMTP config for email reminder ${reminder.id}`);
            await markFailed(reminder.id);
            continue;
          }

          const fromName = instance.name || instance.short_name || 'Carfect';

          await smtpClient.send({
            from: `${fromName} <${smtpFrom}>`,
            to: customerEmail.trim(),
            subject,
            html: emailHtml,
            ...(instance.email ? { replyTo: instance.email } : {}),
          });

          await markSent(reminder.id, reminder.instance_id, customerEmail, subject, 'customer_reminder_email');
          sentCount++;
          console.log(`Sent email reminder ${reminder.id} to ${customerEmail}`);
        } else {
          // --- SMS branch (default, backward compat) ---

          // Get SMS template based on service_type (hardcoded for now)
          const template = SMS_TEMPLATES[reminder.service_type] || SMS_TEMPLATES.serwis;

          // Build SMS message
          const message = resolvePlaceholders(template, {
            short_name: instance.short_name || '',
            vehicle_plate: reminder.vehicle_plate || '',
            reservation_phone: (instance.reservation_phone || '').replace(/\s/g, ''),
          });

          // Normalize phone number
          const normalizedPhone = normalizePhoneOrFallback(reminder.customer_phone, 'PL');
          console.log(`Normalized phone: ${reminder.customer_phone} -> ${normalizedPhone}`);

          // Validate phone number length
          const digitsOnly = normalizedPhone.replace(/\D/g, '');
          if (digitsOnly.length < 11 || digitsOnly.length > 15) {
            console.error(
              `Invalid phone for reminder ${reminder.id}: ${normalizedPhone} (${digitsOnly.length} digits)`,
            );
            await markFailed(reminder.id);
            continue;
          }

          // Demo instance - simulate SMS
          const DEMO_INSTANCE_IDS = ['b3c29bfe-f393-4e1a-a837-68dd721df420'];
          if (DEMO_INSTANCE_IDS.includes(reminder.instance_id)) {
            console.log(`[DEMO] Simulating SMS to ${normalizedPhone}: ${message}`);
          } else if (smsApiToken) {
            // Send SMS if token available
            const offerReminderParams: Record<string, string> = {
              to: normalizedPhone.replace('+', ''),
              message: message,
              format: 'json',
            };
            if (instance.sms_sender_name) {
              offerReminderParams.from = instance.sms_sender_name;
            }

            const smsResponse = await fetch('https://api.smsapi.pl/sms.do', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${smsApiToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams(offerReminderParams),
            });

            if (!smsResponse.ok) {
              console.error(`SMS API error for reminder ${reminder.id}`);
              await markFailed(reminder.id);
              continue;
            }
          } else {
            console.log(`[DEV] Would send SMS to ${normalizedPhone}: ${message}`);
          }

          await markSent(reminder.id, reminder.instance_id, normalizedPhone, message, 'customer_reminder');
          sentCount++;
          console.log(`Sent reminder ${reminder.id} to ${normalizedPhone}`);
        }
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        await markFailed(reminder.id);
      }
    }
    } finally {
      if (smtpClient) {
        await smtpClient.close();
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total: reminders.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-offer-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
