import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';
import { captureException } from '../_shared/sentry.ts';
import {
  getDateTimeInTimezone,
  getTomorrowInTimezone,
  buildReminder1DaySms,
  buildReminderTodaySms,
  isInHourlyWindow,
  HOURLY_WINDOWS,
} from '../_shared/reminderUtils.ts';
import {
  type Reservation,
  type InstanceData,
  type SmsMessageSetting,
  BACKOFF_MINUTES,
  MAX_FAILURE_COUNT,
  shouldIncludeEditLink,
  claimReservation,
  sendSms,
  buildInstanceSettingsMap,
  isReminderEnabledForInstance,
} from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// v01.28.00 - Extracted helpers for testability

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const smsapiToken = Deno.env.get('SMSAPI_TOKEN');

    if (!smsapiToken) {
      console.log('SMSAPI_TOKEN not configured, skipping reminders');
      return new Response(JSON.stringify({ success: true, message: 'SMS not configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Parse request body for type and window parameters
    let reminderType: '1day' | '1hour' | undefined;
    let windowNumber: number | undefined;

    try {
      const body = await req.json();
      reminderType = body?.type as '1day' | '1hour' | undefined;
      windowNumber = body?.window as number | undefined;
    } catch {
      // No body or invalid JSON - process all types (backwards compatibility)
    }

    if (windowNumber !== undefined && !HOURLY_WINDOWS[windowNumber]) {
      console.warn(
        `Unknown window number: ${windowNumber}. Valid windows: ${Object.keys(HOURLY_WINDOWS).join(', ')}`,
      );
    }

    const now = new Date();
    console.log('=== SEND-REMINDERS START ===');
    console.log('UTC now:', now.toISOString());
    console.log(`Parameters: type=${reminderType || 'all'}, window=${windowNumber ?? 'none'}`);

    const warsawTime = getDateTimeInTimezone(now, 'Europe/Warsaw');
    console.log(
      `Warsaw time: ${warsawTime.dateStr} ${String(warsawTime.hours).padStart(2, '0')}:${String(warsawTime.minutes).padStart(2, '0')}`,
    );

    // EARLY EXIT: Quick check if there are any candidates at all
    const todayUtc = now.toISOString().split('T')[0];
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const maxDate = twoDaysFromNow.toISOString().split('T')[0];

    const { count: candidateCount } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('reservation_date', todayUtc)
      .lte('reservation_date', maxDate)
      .or('reminder_1day_sent.is.null,reminder_1hour_sent.is.null')
      .or('reminder_permanent_failure.is.null,reminder_permanent_failure.eq.false');

    if (candidateCount === 0) {
      console.log('=== EARLY EXIT: No candidates ===');
      return new Response(
        JSON.stringify({ success: true, message: 'No candidates, early exit', sentCount: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      );
    }
    console.log(`Found ${candidateCount} potential candidates`);

    // Get all SMS settings for instances
    const { data: smsSettings, error: smsSettingsError } = await supabase
      .from('sms_message_settings')
      .select('instance_id, message_type, enabled, send_at_time')
      .in('message_type', ['reminder_1day', 'reminder_1hour']);

    if (smsSettingsError) {
      console.error('Error fetching SMS settings:', smsSettingsError);
    }

    const instanceSettings = buildInstanceSettingsMap(smsSettings);

    const instanceCache: Record<string, InstanceData> = {};

    const getInstanceInfo = async (instanceId: string): Promise<InstanceData> => {
      if (instanceCache[instanceId]) {
        return instanceCache[instanceId];
      }

      const { data: instanceData } = await supabase
        .from('instances')
        .select('id, name, short_name, slug, phone, reservation_phone, timezone, sms_sender_name')
        .eq('id', instanceId)
        .single();

      const info: InstanceData = {
        id: instanceId,
        name: instanceData?.short_name || instanceData?.name || 'Myjnia',
        short_name: instanceData?.short_name || null,
        slug: instanceData?.slug || '',
        phone: instanceData?.phone || null,
        reservation_phone: instanceData?.reservation_phone || instanceData?.phone || null,
        timezone: instanceData?.timezone || 'Europe/Warsaw',
        sms_sender_name: instanceData?.sms_sender_name || null,
      };
      instanceCache[instanceId] = info;
      return info;
    };

    let sentCount = 0;
    let skippedClaimed = 0;
    let skippedWindow = 0;
    const results: { type: string; reservationId: string; success: boolean; skipped?: string }[] =
      [];

    // ========================
    // PROCESS 1-DAY REMINDERS
    // ========================
    if (!reminderType || reminderType === '1day') {
      const { data: candidateDayReminders, error: fetchDayError } = await supabase
        .from('reservations')
        .select(
          'id, customer_phone, customer_name, reservation_date, start_time, instance_id, service_id, confirmation_code, reminder_1day_last_attempt_at, reminder_failure_count, reminder_permanent_failure, reminder_failure_reason',
        )
        .eq('status', 'confirmed')
        .is('reminder_1day_sent', null)
        .gte('reservation_date', todayUtc)
        .lte('reservation_date', maxDate)
        .or('reminder_permanent_failure.is.null,reminder_permanent_failure.eq.false');

      if (fetchDayError) {
        console.error('Error fetching day reminders:', fetchDayError);
      }

      console.log(`Processing ${(candidateDayReminders || []).length} candidate 1-day reminders`);

      for (const reservation of (candidateDayReminders || []) as Reservation[]) {
        if (!isReminderEnabledForInstance(instanceSettings, reservation.instance_id, '1day')) {
          continue;
        }

        const instanceInfo = await getInstanceInfo(reservation.instance_id);
        const timezone = instanceInfo.timezone || 'Europe/Warsaw';

        const tomorrowLocal = getTomorrowInTimezone(now, timezone);

        if (reservation.reservation_date !== tomorrowLocal) {
          continue;
        }

        console.log(`[1-day] MATCH! res=${reservation.id} (${reservation.confirmation_code})`);

        const claimed = await claimReservation(supabase, reservation.id, BACKOFF_MINUTES, '1day');
        if (!claimed) {
          skippedClaimed++;
          results.push({
            type: '1day',
            reservationId: reservation.id,
            success: false,
            skipped: 'claimed_or_backoff',
          });
          continue;
        }

        const formattedTime = reservation.start_time.slice(0, 5);

        const includeEditLink = await shouldIncludeEditLink(
          supabase,
          reservation.instance_id,
          reservation.customer_phone,
        );
        const editUrl = includeEditLink
          ? `https://${instanceInfo.slug}.carfect.pl/res?code=${reservation.confirmation_code}`
          : null;

        const message = buildReminder1DaySms({
          instanceName: instanceInfo.name,
          time: formattedTime,
          editUrl,
        });

        const { success, errorReason } = await sendSms(
          reservation.customer_phone,
          message,
          smsapiToken,
          supabase,
          reservation.instance_id,
          reservation.id,
          'reminder_1day',
          instanceInfo.sms_sender_name,
        );

        if (success) {
          await supabase
            .from('reservations')
            .update({
              reminder_1day_sent: true,
              reminder_failure_count: 0,
              reminder_failure_reason: null,
            })
            .eq('id', reservation.id);
          sentCount++;
        } else {
          const newFailureCount = (reservation.reminder_failure_count || 0) + 1;
          const isPermanentFailure = newFailureCount >= MAX_FAILURE_COUNT;

          await supabase
            .from('reservations')
            .update({
              reminder_failure_count: newFailureCount,
              reminder_permanent_failure: isPermanentFailure,
              reminder_failure_reason: errorReason || 'unknown_error',
            })
            .eq('id', reservation.id);
        }

        results.push({ type: '1day', reservationId: reservation.id, success });
      }
    }

    // ========================
    // PROCESS "TODAY" REMINDERS (window-based, replaces 1-hour)
    // ========================
    if (!reminderType || reminderType === '1hour') {
      const { data: candidateHourReminders, error: fetchHourError } = await supabase
        .from('reservations')
        .select(
          'id, customer_phone, customer_name, reservation_date, start_time, instance_id, service_id, confirmation_code, reminder_1hour_last_attempt_at, reminder_failure_count, reminder_permanent_failure, reminder_failure_reason',
        )
        .eq('status', 'confirmed')
        .is('reminder_1hour_sent', null)
        .gte('reservation_date', todayUtc)
        .lte('reservation_date', maxDate)
        .or('reminder_permanent_failure.is.null,reminder_permanent_failure.eq.false');

      if (fetchHourError) {
        console.error('Error fetching today reminders:', fetchHourError);
      }

      console.log(
        `Processing ${(candidateHourReminders || []).length} candidate today reminders (window=${windowNumber || 'all'})`,
      );

      for (const reservation of (candidateHourReminders || []) as Reservation[]) {
        if (!isReminderEnabledForInstance(instanceSettings, reservation.instance_id, '1hour')) {
          continue;
        }

        const instanceInfo = await getInstanceInfo(reservation.instance_id);
        const timezone = instanceInfo.timezone || 'Europe/Warsaw';

        const nowLocal = getDateTimeInTimezone(now, timezone);

        // Must be today
        if (reservation.reservation_date !== nowLocal.dateStr) {
          continue;
        }

        // If window specified, check if reservation is in that window
        if (windowNumber !== undefined) {
          if (!isInHourlyWindow(reservation.start_time, windowNumber)) {
            skippedWindow++;
            continue;
          }
        } else {
          // Legacy mode (no window specified): use 55-65 minute logic
          const [startHour, startMinute] = reservation.start_time.split(':').map(Number);
          const startTotalMinutes = startHour * 60 + startMinute;
          const nowTotalMinutes = nowLocal.hours * 60 + nowLocal.minutes;
          const minutesUntilStart = startTotalMinutes - nowTotalMinutes;

          if (minutesUntilStart < 55 || minutesUntilStart > 65) {
            continue;
          }
        }

        console.log(
          `[today] MATCH! res=${reservation.id}, start=${reservation.start_time}, window=${windowNumber || 'legacy'}`,
        );

        const claimed = await claimReservation(supabase, reservation.id, BACKOFF_MINUTES, '1hour');
        if (!claimed) {
          skippedClaimed++;
          results.push({
            type: '1hour',
            reservationId: reservation.id,
            success: false,
            skipped: 'claimed_or_backoff',
          });
          continue;
        }

        const formattedTime = reservation.start_time.slice(0, 5);

        // Use new "Today" SMS template
        const message = buildReminderTodaySms({
          instanceName: instanceInfo.name,
          time: formattedTime,
          phone: instanceInfo.reservation_phone,
        });

        const { success, errorReason } = await sendSms(
          reservation.customer_phone,
          message,
          smsapiToken,
          supabase,
          reservation.instance_id,
          reservation.id,
          'reminder_1hour',
          instanceInfo.sms_sender_name,
        );

        if (success) {
          await supabase
            .from('reservations')
            .update({
              reminder_1hour_sent: true,
              reminder_failure_count: 0,
              reminder_failure_reason: null,
            })
            .eq('id', reservation.id);
          sentCount++;
        } else {
          const newFailureCount = (reservation.reminder_failure_count || 0) + 1;
          const isPermanentFailure = newFailureCount >= MAX_FAILURE_COUNT;

          await supabase
            .from('reservations')
            .update({
              reminder_failure_count: newFailureCount,
              reminder_permanent_failure: isPermanentFailure,
              reminder_failure_reason: errorReason || 'unknown_error',
            })
            .eq('id', reservation.id);
        }

        results.push({ type: '1hour', reservationId: reservation.id, success });
      }
    }

    console.log(`=== SEND-REMINDERS COMPLETE ===`);
    console.log(
      `Summary: sent=${sentCount}, skippedClaimed=${skippedClaimed}, skippedWindow=${skippedWindow}`,
    );

    return new Response(
      JSON.stringify({ success: true, sentCount, skippedClaimed, skippedWindow, results }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    );
  } catch (error: unknown) {
    console.error('Error in send-reminders:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    await captureException(err, {
      transaction: 'send-reminders',
      request: req,
      tags: { function: 'send-reminders' },
    });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
