import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApaczkaCredentials, apaczkaFetch } from '../_shared/apaczka/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface WaybillResponse {
  waybill: string; // base64-encoded PDF
  type: string; // "pdf"
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return jsonResponse({ error: 'orderId is required' }, 400);
    }

    // Fetch order with instance
    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .select('*, instances(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return jsonResponse({ error: 'Zamówienie nie znalezione' }, 404);
    }

    if (!order.apaczka_order_id) {
      return jsonResponse({ error: 'Zamówienie nie ma przesyłki Apaczka' }, 400);
    }

    const instance = order.instances as Record<string, unknown>;
    const credentials = getApaczkaCredentials(instance);

    // Fetch label PDF from Apaczka
    const result = await apaczkaFetch<WaybillResponse>(
      credentials,
      `waybill/${order.apaczka_order_id}`,
      [],
    );

    const waybillData = result.response;
    if (!waybillData?.waybill) {
      return jsonResponse({ error: 'Apaczka nie zwróciła etykiety' }, 502);
    }

    return jsonResponse(
      {
        success: true,
        pdf_base64: waybillData.waybill,
        filename: `etykieta-${order.apaczka_order_id}.pdf`,
      },
      200,
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in get-apaczka-label:', err.message);

    const apaczkaResponse = (err as any).apaczkaResponse;
    if (apaczkaResponse) {
      return jsonResponse(
        { error: err.message, apaczka_errors: apaczkaResponse.errors || null },
        502,
      );
    }

    return jsonResponse({ error: err.message }, 500);
  }
});
