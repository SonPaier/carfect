import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInstancePlan } from './useInstancePlan';
import type { SubscriptionSummary, SubscriptionStatus } from '@shared/billing';

export function useSubscriptionSummary(instanceId: string | undefined) {
  const { subscription, smsLimit, monthlyPrice, loading: planLoading } = useInstancePlan(instanceId ?? null);

  // H3: Use explicit UTC timestamps for period boundaries
  const currentPeriodStart = useMemo(() => {
    if (!subscription?.next_billing_date) return null;
    const endDate = new Date(subscription.next_billing_date + 'T00:00:00Z');
    const startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - 1, endDate.getUTCDate()));
    return startDate.toISOString();
  }, [subscription?.next_billing_date]);

  const currentPeriodEnd = useMemo(() => {
    if (!subscription?.next_billing_date) return null;
    return new Date(subscription.next_billing_date + 'T00:00:00Z').toISOString();
  }, [subscription?.next_billing_date]);

  const smsQuery = useQuery({
    queryKey: ['sms_count', instanceId, currentPeriodStart, currentPeriodEnd],
    queryFn: async () => {
      if (!instanceId) throw new Error('instanceId required');
      let query = supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instanceId);

      if (currentPeriodStart) {
        query = query.gte('created_at', currentPeriodStart);
      }
      if (currentPeriodEnd) {
        query = query.lt('created_at', currentPeriodEnd);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!instanceId && !!currentPeriodStart && !!currentPeriodEnd,
  });

  const summary: SubscriptionSummary | null = useMemo(() => {
    if (!subscription) return null;

    return {
      monthlyPrice,
      stationLimit: subscription.station_limit,
      status: (subscription.status === 'active' ? 'active' : 'inactive') as SubscriptionStatus,
      isTrial: subscription.is_trial,
      trialExpiresAt: subscription.trial_expires_at,
      currentPeriodStart: currentPeriodStart ? currentPeriodStart.split('T')[0] : null,
      currentPeriodEnd: subscription.next_billing_date,
      nextBillingDate: subscription.next_billing_date,
      smsUsed: smsQuery.data ?? 0,
      smsLimit,
    };
  }, [subscription, monthlyPrice, smsLimit, smsQuery.data, currentPeriodStart]);

  return {
    summary,
    loading: planLoading || smsQuery.isLoading,
  };
}
