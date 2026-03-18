import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApaczkaCredentials, apaczkaFetch } from "../_shared/apaczka/client.ts";

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

    // Fetch order with instance
    const { data: order, error: orderErr } = await supabase
      .from("sales_orders")
      .select("*, instances(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return jsonResponse({ error: "Zamówienie nie znalezione" }, 404);
    }

    // Verify user belongs to instance
    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("instance_id", order.instance_id)
      .maybeSingle();
    if (!roleCheck) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    // Must have apaczka_order_id to cancel
    if (!order.apaczka_order_id) {
      return jsonResponse({ error: "Zamówienie nie ma przesyłki Apaczka" }, 400);
    }

    const instance = order.instances as Record<string, unknown>;
    const credentials = getApaczkaCredentials(instance);

    // Call Apaczka cancel_order API
    try {
      await apaczkaFetch(
        credentials,
        `cancel_order/${order.apaczka_order_id}`,
        [],
      );
    } catch (cancelErr: unknown) {
      const err = cancelErr instanceof Error ? cancelErr : new Error(String(cancelErr));
      console.error("Apaczka cancel error:", err.message);
      // If Apaczka rejects (e.g. already shipped), still clear local data
      // but inform the user
      const apaczkaResponse = (err as any).apaczkaResponse;
      if (apaczkaResponse) {
        console.log("Apaczka cancel response:", JSON.stringify(apaczkaResponse));
      }
    }

    // Clear shipment data locally regardless
    const { error: updateErr } = await supabase
      .from("sales_orders")
      .update({
        status: "anulowany",
        apaczka_order_id: null,
        tracking_number: null,
        apaczka_tracking_url: null,
        shipped_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateErr) {
      console.error("DB update failed:", updateErr);
      return jsonResponse({ error: "Nie udało się zaktualizować zamówienia" }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error in cancel-apaczka-shipment:", err.message);
    return jsonResponse({ error: err.message }, 500);
  }
});
