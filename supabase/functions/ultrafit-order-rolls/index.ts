import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { mapRollUsageToResponse } from './helpers.ts';
import type { RollUsageRow, RollRow } from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface OrderRollsRequest {
  orderId: string;
}

interface RollUsageWithRoll {
  id: string;
  order_id: string;
  order_item_id: string;
  used_mb: number;
  sales_rolls: RollRow;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500);
    }

    // Extract user from JWT (gateway already verified the token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }
    const payload = JSON.parse(atob(payloadBase64));
    const userId = payload.sub as string;
    if (!userId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Create service role client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find integration_link for user's instance where provider='ultrafit'
    const { data: profile } = await supabase
      .from('profiles')
      .select('instance_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile?.instance_id) {
      return jsonResponse({ error: 'No instance found for user' }, 403);
    }

    const { data: integrationLink } = await supabase
      .from('integration_links')
      .select('id, external_customer_id')
      .eq('instance_id', profile.instance_id)
      .eq('provider', 'ultrafit')
      .maybeSingle();

    if (!integrationLink) {
      return jsonResponse({ error: 'No Ultrafit integration link found' }, 403);
    }

    const externalCustomerId = integrationLink.external_customer_id;

    // Parse request body
    const body = await req.json() as OrderRollsRequest;
    const { orderId } = body;

    if (!orderId) {
      return jsonResponse({ error: 'Missing required field: orderId' }, 400);
    }

    // IDOR check: verify orderId belongs to external_customer_id
    const { data: order } = await supabase
      .from('sales_orders')
      .select('id')
      .eq('id', orderId)
      .eq('customer_id', externalCustomerId)
      .maybeSingle();

    if (!order) {
      return jsonResponse({ error: 'Order not found or access denied' }, 403);
    }

    // Query sales_roll_usages JOIN sales_rolls WHERE order_id = orderId
    const { data: usages, error: usagesError } = await supabase
      .from('sales_roll_usages')
      .select('id, order_id, order_item_id, used_mb, sales_rolls(id, brand, product_name, width_mm, barcode)')
      .eq('order_id', orderId);

    if (usagesError) {
      console.error('Error fetching roll usages:', usagesError);
      return jsonResponse({ error: 'Failed to fetch roll usages' }, 500);
    }

    const rolls = (usages as unknown as RollUsageWithRoll[])
      .filter((u) => u.sales_rolls != null)
      .map((u) => {
        const usageRow: RollUsageRow = {
          id: u.id,
          order_id: u.order_id,
          order_item_id: u.order_item_id,
          used_mb: u.used_mb,
        };
        return mapRollUsageToResponse(usageRow, u.sales_rolls);
      });

    return jsonResponse({ rolls }, 200);
  } catch (error: unknown) {
    console.error('Error in ultrafit-order-rolls:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
});
