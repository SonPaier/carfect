import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  calculateSmsOverage,
  calculateInvoiceAmounts,
  buildInvoicePositions,
  getNextBillingDate,
  getPrevBillingDate,
  getPeriodEndDate,
  formatPeriodLabel,
  SMS_OVERAGE_PRICE,
  PAYMENT_DUE_DAYS,
} from './helpers.ts';
import { ifirmaCreateInvoice } from '../_shared/ifirma.ts';
import type { IfirmaConfig } from '../_shared/ifirma.ts';

interface InstanceBillingData {
  id: string;
  billing_name: string | null;
  billing_nip: string | null;
  billing_street: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  sms_limit: number | null;
}

interface SubscriptionRow {
  id: string;
  instance_id: string;
  monthly_price: number | null;
  next_billing_date: string;
  billing_day: number | null;
  instances: InstanceBillingData | null;
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient>;

async function processInstance(
  supabase: SupabaseClient,
  sub: SubscriptionRow,
  today: string,
  ifirmaConfig: IfirmaConfig | null,
): Promise<{ instance_id: string; status: string; error?: string }> {
  // H1: Guard against NULL monthly_price
  if (sub.monthly_price == null || sub.monthly_price <= 0) {
    return { instance_id: sub.instance_id, status: 'skipped', error: 'monthly_price is null or 0' };
  }

  const billingDay = sub.billing_day ?? 1;

  // H3: Use explicit UTC dates via Date constructor (avoids timezone drift)
  const currentBillingDate = new Date(sub.next_billing_date + 'T00:00:00Z');
  const prevPeriodStart = getPrevBillingDate(currentBillingDate, billingDay);
  const prevPeriodEnd = currentBillingDate;

  // SMS count with explicit ISO timestamps
  const { count: smsCount } = await supabase
    .from('sms_logs')
    .select('*', { count: 'exact', head: true })
    .eq('instance_id', sub.instance_id)
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', prevPeriodEnd.toISOString());

  const smsOverage = calculateSmsOverage(
    smsCount ?? 0,
    sub.instances?.sms_limit ?? 100,
  );

  // Build invoice data — period end is day before next billing date
  const nextBillingDate = getNextBillingDate(currentBillingDate, billingDay);
  const periodEnd = getPeriodEndDate(nextBillingDate);
  const periodLabel = formatPeriodLabel(currentBillingDate, periodEnd);
  const positions = buildInvoicePositions(sub.monthly_price, smsOverage, SMS_OVERAGE_PRICE, periodLabel);
  const { net, gross } = calculateInvoiceAmounts(sub.monthly_price, smsOverage, SMS_OVERAGE_PRICE);

  const dueDateObj = new Date(today);
  dueDateObj.setDate(dueDateObj.getDate() + PAYMENT_DUE_DAYS);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  // C1: Atomic insert + date advance via RPC transaction
  const { data: invoiceId, error: rpcError } = await supabase.rpc('process_billing_for_instance', {
    p_subscription_id: sub.id,
    p_instance_id: sub.instance_id,
    p_billing_period_start: sub.next_billing_date,
    p_billing_period_end: periodEnd.toISOString().split('T')[0],
    p_amount_net: net,
    p_amount_gross: gross,
    p_positions: positions,
    p_invoice_issue_date: today,
    p_payment_due_date: dueDate,
    p_next_billing_date: nextBillingDate.toISOString().split('T')[0],
  });

  if (rpcError) throw rpcError;

  // C2: iFirma call AFTER DB transaction — decoupled
  // If iFirma fails, the DB record exists (without invoice_number) and can be retried
  if (ifirmaConfig) {
    try {
      const instance = sub.instances;
      const ifirmaResult = await ifirmaCreateInvoice(ifirmaConfig, {
        issue_date: today,
        sell_date: today,
        payment_to: dueDate,
        buyer_name: instance?.billing_name || 'Brak nazwy',
        buyer_tax_no: instance?.billing_nip || undefined,
        buyer_street: instance?.billing_street || undefined,
        buyer_post_code: instance?.billing_postal_code || undefined,
        buyer_city: instance?.billing_city || undefined,
        positions: positions.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unit_price_net: p.unit_price_net,
          vat_rate: p.vat_rate,
        })),
      });

      // Patch DB record with iFirma data
      await supabase
        .from('subscription_invoices')
        .update({
          invoice_number: ifirmaResult.invoice_number,
          external_invoice_id: ifirmaResult.external_invoice_id,
        })
        .eq('id', invoiceId);
    } catch (ifirmaErr) {
      // Log but don't fail — DB record exists, can be retried manually
      console.error(`iFirma failed for instance ${sub.instance_id}, invoice ${invoiceId}:`, ifirmaErr);
      return {
        instance_id: sub.instance_id,
        status: 'partial',
        error: `DB ok, iFirma failed: ${(ifirmaErr as Error).message}`,
      };
    }
  }

  return { instance_id: sub.instance_id, status: 'ok' };
}

Deno.serve(async (req) => {
  // Verify authorization
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    return new Response('CRON_SECRET not configured', { status: 500 });
  }
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // M6: Validate iFirma config
  const ifirmaUser = Deno.env.get('IFIRMA_API_USER');
  const ifirmaKey = Deno.env.get('IFIRMA_API_KEY');
  let ifirmaConfig: IfirmaConfig | null = null;
  if (ifirmaUser && ifirmaKey) {
    if (!/^[0-9A-Fa-f]+$/.test(ifirmaKey)) {
      console.error('IFIRMA_API_KEY is not valid hex — iFirma disabled for this run');
    } else {
      ifirmaConfig = { invoice_api_user: ifirmaUser, invoice_api_key: ifirmaKey };
    }
  }

  const today = new Date().toISOString().split('T')[0];

  // H2: Use claim_due_subscriptions RPC with FOR UPDATE SKIP LOCKED
  const { data: dueSubs, error: subError } = await supabase.rpc('claim_due_subscriptions', {
    p_today: today,
  });

  if (subError) {
    console.error('Error claiming subscriptions:', subError);
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 });
  }

  if (!dueSubs || dueSubs.length === 0) {
    return new Response(JSON.stringify({ processed: 0, results: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch instance billing data for all claimed subs
  const instanceIds = dueSubs.map((s: SubscriptionRow) => s.instance_id);
  const { data: instances } = await supabase
    .from('instances')
    .select('id, billing_name, billing_nip, billing_street, billing_postal_code, billing_city, sms_limit')
    .in('id', instanceIds);

  const instanceMap = new Map((instances ?? []).map((i: Record<string, unknown>) => [i.id, i]));

  // Enrich subs with instance data
  const enrichedSubs = dueSubs.map((sub: SubscriptionRow) => ({
    ...sub,
    instances: instanceMap.get(sub.instance_id) ?? null,
  }));

  // Process all instances in parallel
  const settled = await Promise.allSettled(
    enrichedSubs.map((sub: SubscriptionRow) =>
      processInstance(supabase, sub, today, ifirmaConfig),
    ),
  );

  const results = settled.map((result, i) => {
    if (result.status === 'fulfilled') return result.value;
    const instanceId = enrichedSubs[i]?.instance_id ?? 'unknown';
    console.error(`Billing failed for instance ${instanceId}:`, result.reason);
    return { instance_id: instanceId, status: 'error', error: String(result.reason) };
  });

  return new Response(
    JSON.stringify({ processed: results.length, results }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
