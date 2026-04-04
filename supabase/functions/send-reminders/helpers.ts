/**
 * Extracted helpers from send-reminders/index.ts for testability.
 * These functions contain the business logic; index.ts imports and uses them.
 */

import { normalizePhoneOrFallback } from "../_shared/phoneUtils.ts";

// ========================
// TYPES
// ========================

export interface Reservation {
  id: string;
  customer_phone: string;
  customer_name: string;
  reservation_date: string;
  start_time: string;
  instance_id: string;
  service_id: string;
  confirmation_code: string;
  reminder_1day_sent: boolean | null;
  reminder_1hour_sent: boolean | null;
  reminder_1day_last_attempt_at: string | null;
  reminder_1hour_last_attempt_at: string | null;
  reminder_failure_count: number;
  reminder_permanent_failure: boolean;
  reminder_failure_reason: string | null;
}

export interface InstanceData {
  id: string;
  name: string;
  short_name: string | null;
  slug: string;
  phone: string | null;
  reservation_phone: string | null;
  timezone: string | null;
  sms_sender_name: string | null;
}

export interface SmsMessageSetting {
  message_type: string;
  enabled: boolean;
  send_at_time: string | null;
}

export interface SmsResult {
  success: boolean;
  errorReason?: string;
}

// Backoff time in minutes - prevents retry spam
export const BACKOFF_MINUTES = 15;

// Max failures before marking as permanent
export const MAX_FAILURE_COUNT = 3;

// Demo instance - never send real SMS
export const DEMO_INSTANCE_IDS = ['b3c29bfe-f393-4e1a-a837-68dd721df420'];

// ========================
// SUPABASE CLIENT TYPE
// ========================

/** Minimal interface for the Supabase client methods we use */
export interface SupabaseClient {
  from(table: string): SupabaseQueryBuilder;
  rpc(fn: string, params: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
}

interface SupabaseQueryBuilder {
  select(columns: string, options?: { count?: string; head?: boolean }): SupabaseQueryBuilder;
  insert(data: Record<string, unknown>): SupabaseQueryBuilder;
  update(data: Record<string, unknown>): SupabaseQueryBuilder;
  eq(column: string, value: unknown): SupabaseQueryBuilder;
  is(column: string, value: unknown): SupabaseQueryBuilder;
  or(filter: string): SupabaseQueryBuilder;
  in(column: string, values: unknown[]): SupabaseQueryBuilder;
  gte(column: string, value: unknown): SupabaseQueryBuilder;
  lte(column: string, value: unknown): SupabaseQueryBuilder;
  single(): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: unknown; count?: number }>;
  then(resolve: (value: { data: unknown; error: unknown; count?: number }) => void): void;
}

// ========================
// HELPER FUNCTIONS
// ========================

export const shouldIncludeEditLink = async (
  supabase: SupabaseClient,
  instanceId: string,
  phone: string
): Promise<boolean> => {
  const { data: feature } = await supabase
    .from('instance_features')
    .select('enabled, parameters')
    .eq('instance_id', instanceId)
    .eq('feature_key', 'sms_edit_link')
    .maybeSingle() as { data: { enabled: boolean; parameters: { phones?: string[] } | null } | null };

  if (!feature || !feature.enabled) {
    return false;
  }

  const params = feature.parameters;
  if (!params || !params.phones || params.phones.length === 0) {
    return true;
  }

  const normalizedPhone = normalizePhoneOrFallback(phone, "PL");

  return params.phones.some(p => {
    const normalizedAllowed = normalizePhoneOrFallback(p, "PL");
    return normalizedPhone === normalizedAllowed;
  });
};

export async function claimReservation(
  supabase: SupabaseClient,
  reservationId: string,
  backoffMinutes: number,
  type: '1hour' | '1day'
): Promise<boolean> {
  const backoffThreshold = new Date(Date.now() - backoffMinutes * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const rpcName = type === '1hour' ? 'claim_reminder_1hour' : 'claim_reminder_1day';
  const sentField = type === '1hour' ? 'reminder_1hour_sent' : 'reminder_1day_sent';
  const attemptField = type === '1hour' ? 'reminder_1hour_last_attempt_at' : 'reminder_1day_last_attempt_at';

  const { data, error } = await supabase.rpc(rpcName, {
    p_reservation_id: reservationId,
    p_now: nowIso,
    p_backoff_threshold: backoffThreshold
  });

  if (error) {
    console.log(`RPC ${rpcName} failed, trying direct update: ${error.message}`);
    const { data: directData, error: directError } = await supabase
      .from("reservations")
      .update({ [attemptField]: nowIso })
      .eq("id", reservationId)
      .is(sentField, null)
      .or(`${attemptField}.is.null,${attemptField}.lt.${backoffThreshold}`)
      .select("id")
      .maybeSingle() as { data: Record<string, unknown> | null; error: unknown };

    if (directError) {
      console.error(`Error claiming ${type} reminder for ${reservationId}:`, directError);
      return false;
    }
    return !!directData;
  }

  return data === true;
}

export async function sendSms(
  phone: string,
  message: string,
  token: string,
  supabase: SupabaseClient,
  instanceId: string,
  reservationId: string,
  messageType: 'reminder_1day' | 'reminder_1hour',
  senderName?: string | null,
): Promise<SmsResult> {
  try {
    const normalizedPhone = normalizePhoneOrFallback(phone, "PL");
    console.log(`Normalized phone: ${phone} -> ${normalizedPhone}`);

    // Demo instances: enforce SMS limit (max 100), simulate instead of real send
    if (DEMO_INSTANCE_IDS.includes(instanceId)) {
      const { data: canSend } = await supabase.rpc('check_sms_available', {
        _instance_id: instanceId,
      }) as { data: boolean | null };

      if (canSend === false) {
        console.warn(`[DEMO] SMS limit exceeded for demo instance ${instanceId}`);
        await supabase.from('sms_logs').insert({
          instance_id: instanceId,
          phone: normalizedPhone,
          message: message,
          message_type: messageType,
          reservation_id: reservationId,
          status: 'failed',
          error_message: 'Demo instance SMS limit exceeded',
        });
        return { success: false, errorReason: 'demo_sms_limit_exceeded' };
      }

      console.log(`[DEMO] Simulating SMS to ${normalizedPhone}: ${message}`);
      await supabase.from('sms_logs').insert({
        instance_id: instanceId,
        phone: normalizedPhone,
        message: message,
        message_type: messageType,
        reservation_id: reservationId,
        status: 'simulated',
        error_message: 'Demo instance - SMS not sent',
      });
      await supabase.rpc('increment_sms_usage', { _instance_id: instanceId });
      return { success: true };
    }

    const digitsOnly = normalizedPhone.replace(/\D/g, "");
    if (digitsOnly.length < 9 || digitsOnly.length > 15) {
      console.error(`Invalid phone number length: ${normalizedPhone} (${digitsOnly.length} digits)`);

      await supabase.from('sms_logs').insert({
        instance_id: instanceId,
        phone: normalizedPhone,
        message: message,
        message_type: messageType,
        reservation_id: reservationId,
        status: 'failed',
        error_message: `Invalid phone number length: ${digitsOnly.length} digits`,
      });

      return { success: false, errorReason: 'invalid_phone_length' };
    }

    const reminderSmsParams: Record<string, string> = {
      to: normalizedPhone.replace("+", ""),
      message: message,
      format: "json",
    };
    if (senderName) reminderSmsParams.from = senderName;

    const response = await fetch("https://api.smsapi.pl/sms.do", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(reminderSmsParams),
    });

    const result = await response.json();

    if (result.error) {
      console.error("SMSAPI error:", result);

      const errorCode = result.error?.toString() || 'api_error';

      await supabase.from('sms_logs').insert({
        instance_id: instanceId,
        phone: normalizedPhone,
        message: message,
        message_type: messageType,
        reservation_id: reservationId,
        status: 'failed',
        error_message: JSON.stringify(result.error),
        smsapi_response: result,
      });

      return { success: false, errorReason: errorCode };
    }

    const { error: logError } = await supabase.from('sms_logs').insert({
      instance_id: instanceId,
      phone: normalizedPhone,
      message: message,
      message_type: messageType,
      reservation_id: reservationId,
      status: 'sent',
      smsapi_response: result,
    }) as { error: unknown };

    if (logError) {
      console.error("Failed to insert sms_log:", logError);
    }

    return { success: true };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, errorReason: 'network_error' };
  }
}

// ========================
// INSTANCE SETTINGS HELPERS
// ========================

export function buildInstanceSettingsMap(
  smsSettings: Array<{ instance_id: string; message_type: string; enabled: boolean; send_at_time: string | null }> | null
): Map<string, { reminder1day: SmsMessageSetting | null; reminder1hour: SmsMessageSetting | null }> {
  const instanceSettings = new Map<string, { reminder1day: SmsMessageSetting | null; reminder1hour: SmsMessageSetting | null }>();

  for (const setting of (smsSettings || [])) {
    const instanceId = setting.instance_id;
    if (!instanceSettings.has(instanceId)) {
      instanceSettings.set(instanceId, { reminder1day: null, reminder1hour: null });
    }
    const instanceSetting = instanceSettings.get(instanceId)!;
    if (setting.message_type === "reminder_1day") {
      instanceSetting.reminder1day = setting as SmsMessageSetting;
    } else if (setting.message_type === "reminder_1hour") {
      instanceSetting.reminder1hour = setting as SmsMessageSetting;
    }
  }

  return instanceSettings;
}

export function isReminderEnabledForInstance(
  instanceSettings: Map<string, { reminder1day: SmsMessageSetting | null; reminder1hour: SmsMessageSetting | null }>,
  instanceId: string,
  type: '1day' | '1hour'
): boolean {
  const setting = instanceSettings.get(instanceId);
  const reminderSetting = type === '1day' ? setting?.reminder1day : setting?.reminder1hour;

  // If no setting exists, default to enabled
  if (!reminderSetting) return true;

  return reminderSetting.enabled !== false;
}
