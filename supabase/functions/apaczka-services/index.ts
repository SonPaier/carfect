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

interface ServiceStructureResponse {
  services: ServiceStructureItem[];
  options?: Record<string, unknown>;
  package_type?: Record<string, unknown>;
}

interface ServiceStructureItem {
  service_id: string;
  name: string;
  supplier: string;
  domestic: string;
  pickup_courier: string;
  door_to_door: string;
  door_to_point: string;
  point_to_point: string;
  point_to_door: string;
  delivery_time: string;
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

    const { instanceId } = await req.json();
    if (!instanceId) {
      return jsonResponse({ error: "instanceId is required" }, 400);
    }

    // Fetch instance to get Apaczka credentials
    const { data: instance, error: instErr } = await supabase
      .from("instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (instErr || !instance) {
      return jsonResponse({ error: "Instancja nie znaleziona" }, 404);
    }

    const credentials = getApaczkaCredentials(instance as Record<string, unknown>);

    // Fetch available services from Apaczka API
    // Request must be empty array per docs
    const result = await apaczkaFetch<ServiceStructureResponse>(
      credentials,
      "service_structure",
      [],
    );

    // Response is { services: [...], options: {...}, package_type: {...}, ... }
    const rawServices = result.response?.services || [];
    const services = rawServices.map((s: ServiceStructureItem) => ({
      id: Number(s.service_id),
      name: s.name,
      supplier: s.supplier,
      domestic: s.domestic === "1",
      deliveryTime: s.delivery_time,
    }));

    const packageTypes = result.response?.package_type || {};

    return jsonResponse({ success: true, services, packageTypes }, 200);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Error in apaczka-services:", err.message);

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
