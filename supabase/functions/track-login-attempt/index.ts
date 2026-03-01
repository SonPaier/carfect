import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FAILED_ATTEMPTS = 6;
const ATTEMPT_WINDOW_MINUTES = 30; // only count attempts in last 30 min

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, instance_id, success } = await req.json();

    if (!profile_id || !instance_id || typeof success !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Record the attempt
    await supabaseAdmin.from("login_attempts").insert({
      profile_id,
      instance_id,
      success,
    });

    if (success) {
      // On success: no further action needed (counter resets because we count consecutive failures)
      return new Response(
        JSON.stringify({ blocked: false, remaining_attempts: MAX_FAILED_ATTEMPTS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count consecutive failed attempts (since last success, within window)
    const windowStart = new Date(
      Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    // Get the timestamp of the last successful login
    const { data: lastSuccess } = await supabaseAdmin
      .from("login_attempts")
      .select("created_at")
      .eq("profile_id", profile_id)
      .eq("success", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Count failures after last success (or within window if no success)
    let query = supabaseAdmin
      .from("login_attempts")
      .select("id", { count: "exact" })
      .eq("profile_id", profile_id)
      .eq("success", false)
      .gte("created_at", windowStart);

    if (lastSuccess?.created_at) {
      query = query.gte("created_at", lastSuccess.created_at);
    }

    const { count: failedCount } = await query;
    const consecutiveFailures = failedCount || 0;
    const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - consecutiveFailures);

    // Block account if threshold reached
    if (consecutiveFailures >= MAX_FAILED_ATTEMPTS) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_blocked: true })
        .eq("id", profile_id);

      return new Response(
        JSON.stringify({
          blocked: true,
          remaining_attempts: 0,
          message: "Konto zostało zablokowane po zbyt wielu nieudanych próbach logowania.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return remaining attempts (only meaningful info from 3rd failure onward)
    return new Response(
      JSON.stringify({
        blocked: false,
        remaining_attempts: remaining,
        show_warning: consecutiveFailures >= 3,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[track-login-attempt] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
