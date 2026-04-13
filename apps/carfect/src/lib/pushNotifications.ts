import { supabase } from '@/integrations/supabase/client';
import { POLISH_MONTH_NAMES_SHORT } from '@/lib/polishDateUtils';

interface PushNotificationParams {
  instanceId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a push notification to all subscribers of the given instance.
 * Silently catches errors - push notifications are non-blocking.
 */
export async function sendPushNotification({
  instanceId,
  title,
  body,
  url = '/admin',
  tag,
}: PushNotificationParams): Promise<void> {
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: {
        instanceId,
        title,
        body,
        url,
        tag,
      },
    });
  } catch (error) {
    console.error('[Push] Failed to send notification:', error);
  }
}

/**
 * Formats a date for push notification body.
 */
export function formatDateForPush(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayNames = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
  const dayName = dayNames[d.getDay()];
  const dayNum = d.getDate();
  const monthName = POLISH_MONTH_NAMES_SHORT[d.getMonth()];
  
  return `${dayName} ${dayNum} ${monthName}`;
}
