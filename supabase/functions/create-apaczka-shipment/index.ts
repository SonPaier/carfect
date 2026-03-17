import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureException } from "../_shared/sentry.ts";
import { getApaczkaCredentials, apaczkaFetch } from "../_shared/apaczka/client.ts";
import {
  mapOrderToApaczkaRequest,
  validateShippingData,
} from "../_shared/apaczka/mappers.ts";
import type {
  ApaczkaOrderSendResponse,
  OrderPackage,
  SenderAddress,
} from "../_shared/apaczka/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return jsonResponse({ error: "orderId is required" }, 400);
    }

    // 1. Fetch order with instance
    const { data: order, error: orderErr } = await supabase
      .from("sales_orders")
      .select("*, instances(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      console.error("Order fetch error:", orderErr);
      return jsonResponse({ error: "Zamówienie nie znalezione" }, 404);
    }

    // 2. Guard: only process shipping orders
    const packages = (order.packages || []) as OrderPackage[];
    const hasShippingPackages = packages.some(
      (p) => p.shippingMethod === "shipping",
    );
    if (!hasShippingPackages) {
      return jsonResponse(
        { error: "Zamówienie nie zawiera paczek do wysyłki" },
        400,
      );
    }

    // 3. Idempotency: don't re-create if already has apaczka_order_id
    if (order.apaczka_order_id) {
      return jsonResponse(
        {
          error: "Przesyłka już została utworzona",
          apaczka_order_id: order.apaczka_order_id,
        },
        409,
      );
    }

    // 4. Fetch customer
    const { data: customer, error: custErr } = await supabase
      .from("sales_customers")
      .select("*")
      .eq("id", order.customer_id)
      .single();

    if (custErr || !customer) {
      console.error("Customer fetch error:", custErr);
      return jsonResponse({ error: "Klient nie znaleziony" }, 404);
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
      return jsonResponse(
        { error: "Walidacja nie powiodła się", details: validation.errors },
        422,
      );
    }

    // 7. Get service ID (from instance config or error)
    const serviceId = (instance?.apaczka_service_id as number) || null;
    if (!serviceId) {
      return jsonResponse(
        { error: "Brak konfiguracji serwisu kurierskiego (apaczka_service_id) na instancji" },
        422,
      );
    }

    // 8. Build Apaczka request — credentials are per-instance
    const credentials = getApaczkaCredentials(instance);
    const apaczkaOrder = mapOrderToApaczkaRequest({
      order,
      customer,
      senderAddress: senderAddress!,
      packages,
      serviceId,
    });

    // 9. Get valuation first to check cost
    console.log("Calling Apaczka order_valuation for order:", orderId);
    console.log("[Apaczka] service_id:", apaczkaOrder.service_id);
    console.log("[Apaczka] shipment_value (grosze):", apaczkaOrder.shipment_value);
    console.log("[Apaczka] shipment:", JSON.stringify(apaczkaOrder.shipment));
    console.log("[Apaczka] cod:", apaczkaOrder.cod ? JSON.stringify(apaczkaOrder.cod) : "none");
    try {
      const valuation = await apaczkaFetch<Record<string, unknown>>(
        credentials,
        "order_valuation",
        { order: apaczkaOrder },
      );
      console.log("[Apaczka] VALUATION:", JSON.stringify(valuation.response));
    } catch (valErr: unknown) {
      const ve = valErr instanceof Error ? valErr : new Error(String(valErr));
      console.log("[Apaczka] Valuation failed:", ve.message);
      if ((ve as any).apaczkaResponse) {
        console.log("[Apaczka] Valuation errors:", JSON.stringify((ve as any).apaczkaResponse));
      }
    }

    // 10. Call order_send
    const result = await apaczkaFetch<ApaczkaOrderSendResponse>(
      credentials,
      "order_send",
      { order: apaczkaOrder },
    );

    const apaczkaOrderData = result.response?.order;
    if (!apaczkaOrderData) {
      throw new Error("Apaczka zwróciła odpowiedź bez danych zamówienia");
    }

    console.log("Apaczka order created:", apaczkaOrderData.id, "waybill:", apaczkaOrderData.waybill_number);

    // 10. Save tracking info back to DB
    const { error: updateErr } = await supabase
      .from("sales_orders")
      .update({
        apaczka_order_id: String(apaczkaOrderData.id),
        tracking_number: apaczkaOrderData.waybill_number,
        apaczka_tracking_url: apaczkaOrderData.tracking_url,
        status: "wysłany",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      // Apaczka succeeded but DB update failed — log for manual reconciliation
      console.error("DB update failed after Apaczka success:", updateErr);
      await captureException(new Error("DB update failed after Apaczka order_send"), {
        transaction: "create-apaczka-shipment",
        extra: {
          orderId,
          apaczka_order_id: apaczkaOrderData.id,
          waybill_number: apaczkaOrderData.waybill_number,
        },
      });
      return jsonResponse(
        {
          error: "Przesyłka utworzona w Apaczka, ale nie udało się zaktualizować zamówienia w bazie",
          apaczka_order_id: apaczkaOrderData.id,
          waybill_number: apaczkaOrderData.waybill_number,
          tracking_url: apaczkaOrderData.tracking_url,
        },
        500,
      );
    }

    // 11. Success
    return jsonResponse(
      {
        success: true,
        apaczka_order_id: apaczkaOrderData.id,
        waybill_number: apaczkaOrderData.waybill_number,
        tracking_url: apaczkaOrderData.tracking_url,
      },
      200,
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error in create-apaczka-shipment:", err.message);
    await captureException(err, {
      transaction: "create-apaczka-shipment",
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
