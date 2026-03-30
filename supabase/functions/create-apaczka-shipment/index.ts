import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { captureException } from '../_shared/sentry.ts';
import { getApaczkaCredentials, apaczkaFetch } from '../_shared/apaczka/client.ts';
import { mapOrderToApaczkaRequest, validateShippingData } from '../_shared/apaczka/mappers.ts';
import type {
  ApaczkaOrderSendResponse,
  OrderPackage,
  SenderAddress,
} from '../_shared/apaczka/types.ts';

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

    // 1. Fetch order with instance
    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .select('*, instances(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.error('Order fetch error:', orderErr);
      return jsonResponse({ error: 'Zamówienie nie znalezione' }, 404);
    }

    // 2. Guard: only process shipping orders
    const packages = (order.packages || []) as OrderPackage[];
    const hasShippingPackages = packages.some((p) => p.shippingMethod === 'shipping');
    if (!hasShippingPackages) {
      return jsonResponse({ error: 'Zamówienie nie zawiera paczek do wysyłki' }, 400);
    }

    // 3. Idempotency: don't re-create if already has apaczka_order_id
    if (order.apaczka_order_id) {
      return jsonResponse(
        {
          error: 'Przesyłka już została utworzona',
          apaczka_order_id: order.apaczka_order_id,
        },
        409,
      );
    }

    // 4. Fetch customer
    const { data: customer, error: custErr } = await supabase
      .from('sales_customers')
      .select('*')
      .eq('id', order.customer_id)
      .single();

    if (custErr || !customer) {
      console.error('Customer fetch error:', custErr);
      return jsonResponse({ error: 'Klient nie znaleziony' }, 404);
    }

    // 5. Get sender address from instance
    const instance = order.instances as Record<string, unknown>;
    const senderAddress = (instance?.apaczka_sender_address as SenderAddress) || null;

    // 6. Validate
    const validation = validateShippingData({
      customer,
      packages,
      order,
      senderAddress,
    });
    if (!validation.valid) {
      return jsonResponse({ error: 'Walidacja nie powiodła się', details: validation.errors }, 422);
    }

    // 7. Build credentials — per-instance
    const credentials = getApaczkaCredentials(instance);
    const apaczkaServices =
      (instance?.apaczka_services as Array<{ name: string; serviceId: number }>) || [];

    // 8. Create a separate Apaczka shipment for each shipping package
    const shippingPackages = packages.filter((p) => p.shippingMethod === 'shipping');
    const updatedPackages = [...packages];
    const shipmentResults: Array<{
      packageId: string;
      apaczka_order_id: string;
      waybill_number: string;
      tracking_url: string;
    }> = [];

    for (const pkg of shippingPackages) {
      // Resolve serviceId for this package
      let serviceId: number | null = null;
      if (pkg.courierServiceId && typeof pkg.courierServiceId === 'number') {
        serviceId = pkg.courierServiceId;
      }
      if (!serviceId) {
        const courierName = pkg.courier || '';
        if (apaczkaServices.length > 0 && courierName) {
          const matched = apaczkaServices.find(
            (s) => s.name.toLowerCase() === courierName.toLowerCase(),
          );
          serviceId = matched?.serviceId || null;
        }
      }
      if (!serviceId) {
        serviceId = (instance?.apaczka_service_id as number) || null;
      }
      if (!serviceId) {
        return jsonResponse(
          {
            error: `Paczka ${pkg.id}: brak konfiguracji serwisu kurierskiego — dodaj serwisy w Ustawieniach → Apaczka`,
          },
          422,
        );
      }

      const apaczkaOrder = mapOrderToApaczkaRequest({
        order,
        customer,
        senderAddress: senderAddress!,
        pkg,
        serviceId,
      });

      console.log(`[Apaczka] Creating shipment for package ${pkg.id}, service_id: ${serviceId}`);
      console.log('[Apaczka] shipment_value (grosze):', apaczkaOrder.shipment_value);
      console.log('[Apaczka] cod:', apaczkaOrder.cod ? JSON.stringify(apaczkaOrder.cod) : 'none');

      const result = await apaczkaFetch<ApaczkaOrderSendResponse>(credentials, 'order_send', {
        order: apaczkaOrder,
      });

      const apaczkaOrderData = result.response?.order;
      if (!apaczkaOrderData) {
        throw new Error(`Paczka ${pkg.id}: Apaczka zwróciła odpowiedź bez danych zamówienia`);
      }

      console.log(
        `[Apaczka] Package ${pkg.id} created: ${apaczkaOrderData.id}, waybill: ${apaczkaOrderData.waybill_number}`,
      );

      shipmentResults.push({
        packageId: pkg.id,
        apaczka_order_id: String(apaczkaOrderData.id),
        waybill_number: apaczkaOrderData.waybill_number,
        tracking_url: apaczkaOrderData.tracking_url,
      });

      // Store tracking per package in the JSONB array
      const pkgIdx = updatedPackages.findIndex((p) => p.id === pkg.id);
      if (pkgIdx >= 0) {
        updatedPackages[pkgIdx] = {
          ...updatedPackages[pkgIdx],
          apaczka_order_id: String(apaczkaOrderData.id),
          tracking_number: apaczkaOrderData.waybill_number,
        };
      }
    }

    // 9. Save all tracking info back to DB
    const firstResult = shipmentResults[0];
    const { error: updateErr } = await supabase
      .from('sales_orders')
      .update({
        apaczka_order_id: firstResult.apaczka_order_id,
        tracking_number: shipmentResults.map((r) => r.waybill_number).join(', '),
        apaczka_tracking_url: firstResult.tracking_url,
        packages: updatedPackages,
        status: 'wysłany',
        shipped_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      console.error('DB update failed after Apaczka success:', updateErr);
      await captureException(new Error('DB update failed after Apaczka order_send'), {
        transaction: 'create-apaczka-shipment',
        extra: { orderId, shipmentResults },
      });
      return jsonResponse(
        {
          error:
            'Przesyłki utworzone w Apaczka, ale nie udało się zaktualizować zamówienia w bazie',
          shipments: shipmentResults,
        },
        500,
      );
    }

    // 10. Success
    return jsonResponse(
      {
        success: true,
        apaczka_order_id: firstResult.apaczka_order_id,
        waybill_number: firstResult.waybill_number,
        tracking_url: firstResult.tracking_url,
        shipments: shipmentResults,
      },
      200,
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in create-apaczka-shipment:', err.message);
    await captureException(err, {
      transaction: 'create-apaczka-shipment',
      request: req,
    });

    // If it's an Apaczka API error, include details
    const apaczkaResponse = (err as any).apaczkaResponse;
    if (apaczkaResponse) {
      return jsonResponse(
        {
          error: err.message,
          apaczka_errors: apaczkaResponse.errors || null,
        },
        502,
      );
    }

    return jsonResponse({ error: err.message }, 500);
  }
});
