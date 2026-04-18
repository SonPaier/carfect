import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  filterOrdersBySearch,
  mapOrderToResponse,
  paginateOrders,
  type UltrafitOrdersRequest,
  type OrderRow,
  type OrderItemRow,
} from './helpers.ts';

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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Step 1: Verify JWT — use service role client with getUser(token) to validate
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    // Service role client used to verify the JWT (recommended pattern)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await serviceClient.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Step 2: Parse request body
    let body: UltrafitOrdersRequest;
    try {
      body = await req.json() as UltrafitOrdersRequest;
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const page = body.page ?? 1;
    const pageSize = body.pageSize ?? 25;
    const search = body.search ?? '';

    // Step 3: Find integration_link for this user's instance where provider='ultrafit'
    // We check user_roles to find the instance the user belongs to, then look up the link
    const { data: userRoles } = await serviceClient
      .from('user_roles')
      .select('instance_id')
      .eq('user_id', user.id);

    const instanceIds = (userRoles ?? []).map((r: { instance_id: string }) => r.instance_id);

    // Also check profiles for instance_id fallback
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('instance_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.instance_id && !instanceIds.includes(profile.instance_id)) {
      instanceIds.push(profile.instance_id);
    }

    if (instanceIds.length === 0) {
      return jsonResponse({ error: 'Forbidden: no instance access' }, 403);
    }

    const { data: integrationLink } = await serviceClient
      .from('integration_links')
      .select('id, external_customer_id, instance_id')
      .in('instance_id', instanceIds)
      .eq('provider', 'ultrafit')
      .maybeSingle();

    if (!integrationLink) {
      return jsonResponse({ error: 'Forbidden: no ultrafit integration' }, 403);
    }

    const externalCustomerId = integrationLink.external_customer_id as string;

    // Step 4: Query sales_orders WHERE customer_id = external_customer_id, with items
    const { data: ordersRaw, error: ordersError } = await serviceClient
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        customer_id,
        created_at,
        shipped_at,
        status,
        total_net,
        currency,
        tracking_number,
        tracking_url,
        delivery_type,
        sales_order_items (
          id,
          order_id,
          name,
          quantity,
          price_net,
          unit,
          vehicle,
          product_type
        )
      `,
      )
      .eq('customer_id', externalCustomerId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching sales_orders:', ordersError);
      throw ordersError;
    }

    // Map raw DB rows to typed structures
    const orders = (ordersRaw ?? []).map((raw) => ({
      id: raw.id as string,
      order_number: raw.order_number as string,
      customer_id: raw.customer_id as string,
      created_at: raw.created_at as string,
      shipped_at: raw.shipped_at as string | null,
      status: raw.status as string,
      total_net: raw.total_net as number,
      currency: raw.currency as string,
      tracking_number: raw.tracking_number as string | null,
      tracking_url: raw.tracking_url as string | null,
      delivery_type: raw.delivery_type as string | null,
      items: ((raw.sales_order_items as OrderItemRow[]) ?? []),
    } satisfies OrderRow & { items: OrderItemRow[] }));

    // Step 5: Apply search filter
    const filtered = filterOrdersBySearch(orders, search);

    // Step 6: Paginate
    const { data: paginated, totalCount } = paginateOrders(filtered, page, pageSize);

    // Step 7: Map to response shape
    const responseOrders = paginated.map(mapOrderToResponse);

    return jsonResponse({ orders: responseOrders, totalCount }, 200);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in ultrafit-orders:', err.message);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
