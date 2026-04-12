import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionSummary, SubscriptionStatus } from '@shared/billing';

interface SubscriptionWithPlan {
  monthly_price: number | null;
  station_limit: number | null;
  status: string;
  is_trial: boolean;
  trial_expires_at: string | null;
  next_billing_date: string | null;
  subscription_plans: { sms_limit: number } | null;
}

export function useSubscriptionSummary(instanceId: string | undefined) {
  const subQuery = useQuery({
    queryKey: ['instance_subscription', instanceId],
    queryFn: async () => {
      if (!instanceId) throw new Error('instanceId required');
      // instance_subscriptions exists in DB but HiService types not yet regenerated
      const { data, error } = await (supabase as unknown as { from: (t: string) => Record<string, (...args: unknown[]) => unknown> })
        .from('instance_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('instance_id', instanceId)
        .single() as unknown as { data: SubscriptionWithPlan | null; error: { code: string; message: string } | null };
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!instanceId,
    staleTime: 5 * 60 * 1000,
  });

  const subscription = subQuery.data;
  const plan = subscription?.subscription_plans;

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
      let query = (supabase as unknown as { from: (t: string) => Record<string, (...args: unknown[]) => unknown> })
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instanceId) as unknown as { gte: (c: string, v: string) => unknown; lt: (c: string, v: string) => unknown; then: (r: (v: unknown) => void) => Promise<unknown> };

      if (currentPeriodStart) query = query.gte('created_at', currentPeriodStart) as typeof query;
      if (currentPeriodEnd) query = query.lt('created_at', currentPeriodEnd) as typeof query;

      const result = await query as unknown as { count: number | null; error: { message: string } | null };
      if (result.error) throw result.error;
      return result.count ?? 0;
    },
    enabled: !!instanceId && !!currentPeriodStart && !!currentPeriodEnd,
  });

  const summary: SubscriptionSummary | null = useMemo(() => {
    if (!subscription) return null;

    return {
      monthlyPrice: subscription.monthly_price ?? 0,
      stationLimit: subscription.station_limit ?? 0,
      status: (subscription.status === 'active' ? 'active' : 'inactive') as SubscriptionStatus,
      isTrial: subscription.is_trial === true,
      trialExpiresAt: subscription.trial_expires_at ?? null,
      currentPeriodStart: currentPeriodStart ? currentPeriodStart.split('T')[0] : null,
      currentPeriodEnd: subscription.next_billing_date ?? null,
      nextBillingDate: subscription.next_billing_date ?? null,
      smsUsed: smsQuery.data ?? 0,
      smsLimit: plan?.sms_limit ?? 100,
    };
  }, [subscription, plan, smsQuery.data, currentPeriodStart]);

  return {
    summary,
    loading: subQuery.isLoading || smsQuery.isLoading,
  };
}
