import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Switch, Label, Input, Button, RadioGroup, RadioGroupItem } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useInstanceSettings, useUpdateInstanceSettings } from '@/hooks/useInstanceSettings';
import { useQueryClient } from '@tanstack/react-query';

interface ReservationConfirmSettingsProps {
  instanceId: string | null;
}

interface InstanceAppSettings {
  auto_confirm_reservations: boolean;
  customer_edit_cutoff_hours: number | null;
  pricing_mode?: string;
}

export const ReservationConfirmSettings = ({ instanceId }: ReservationConfirmSettingsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [customerEditCutoffHours, setCustomerEditCutoffHours] = useState(1);
  const [saving, setSaving] = useState(false);

  // Employee assignment settings
  const { data: instanceSettings, isLoading: isSettingsLoading } = useInstanceSettings(instanceId);
  const { updateSetting } = useUpdateInstanceSettings(instanceId);
  const [savingSettings, setSavingEmployeeSettings] = useState(false);

  // Pricing mode
  const [pricingMode, setPricingMode] = useState<'netto' | 'brutto'>('brutto');

  // Feature toggles
  const queryClient = useQueryClient();
  const [vinEnabled, setVinEnabled] = useState(false);
  const [protocolServicesEnabled, setProtocolServicesEnabled] = useState(false);

  useEffect(() => {
    if (!instanceId) return;
    supabase
      .from('instance_features')
      .select('feature_key, enabled')
      .eq('instance_id', instanceId)
      .in('feature_key', ['vehicle_vin', 'protocol_services'])
      .then(({ data }) => {
        for (const row of data || []) {
          if (row.feature_key === 'vehicle_vin') setVinEnabled(row.enabled);
          if (row.feature_key === 'protocol_services') setProtocolServicesEnabled(row.enabled);
        }
      });
  }, [instanceId]);

  const handleFeatureToggle = async (
    featureKey: string,
    enabled: boolean,
    setter: (v: boolean) => void,
  ) => {
    if (!instanceId) return;
    setter(enabled);
    await supabase.from('instance_features').upsert(
      {
        instance_id: instanceId,
        feature_key: featureKey,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'instance_id,feature_key' },
    );
    queryClient.invalidateQueries({ queryKey: ['instance_features'] });
  };

  // Push notification subscription
  const {
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    checkSubscription,
    isSupported: isPushSupported,
  } = usePushSubscription(instanceId);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!instanceId) return;
      setLoading(true);

      const { data } = await supabase
        .from('instances')
        .select('auto_confirm_reservations, customer_edit_cutoff_hours, pricing_mode')
        .eq('id', instanceId)
        .single();

      if (data) {
        const settings = data as unknown as InstanceAppSettings;
        setAutoConfirm(settings.auto_confirm_reservations !== false);
        setCustomerEditCutoffHours(settings.customer_edit_cutoff_hours ?? 1);
        setPricingMode((settings.pricing_mode as 'netto' | 'brutto') || 'brutto');
      }
      setLoading(false);
    };

    fetchSettings();
    checkSubscription();
  }, [instanceId, checkSubscription]);

  const handleToggleSetting = async (
    key: keyof import('@/hooks/useInstanceSettings').InstanceSettings,
    checked: boolean,
  ) => {
    setSavingEmployeeSettings(true);
    try {
      await updateSetting(key, checked);
      toast.success(t('reservationSettings.saved'));
    } catch (error) {
      toast.error(t('reservationSettings.saveError'));
    } finally {
      setSavingEmployeeSettings(false);
    }
  };

  const handleToggleAutoConfirm = async (checked: boolean) => {
    if (!instanceId) return;

    setSaving(true);
    setAutoConfirm(checked);

    const { error } = await supabase
      .from('instances')
      .update({ auto_confirm_reservations: checked })
      .eq('id', instanceId);

    if (error) {
      toast.error(t('reservationSettings.saveError'));
      setAutoConfirm(!checked);
    } else {
      toast.success(checked ? t('reservationSettings.autoConfirmOn') : t('reservationSettings.autoConfirmOff'));
    }

    setSaving(false);
  };

  const saveCutoffHours = async (value: number) => {
    if (!instanceId) return;

    setSaving(true);

    const { error } = await supabase
      .from('instances')
      .update({ customer_edit_cutoff_hours: value })
      .eq('id', instanceId);

    if (error) {
      toast.error(t('reservationSettings.saveError'));
    } else {
      toast.success(t('reservationSettings.saved'));
    }

    setSaving(false);
  };

  const handlePricingModeChange = async (mode: 'netto' | 'brutto') => {
    if (!instanceId) return;
    const prev = pricingMode;
    setPricingMode(mode);

    const { error } = await supabase
      .from('instances')
      .update({ pricing_mode: mode } as Record<string, unknown>)
      .eq('id', instanceId);

    if (error) {
      toast.error(t('reservationSettings.saveError'));
      setPricingMode(prev);
    } else {
      toast.success(mode === 'netto' ? t('reservationSettings.pricingNetto') : t('reservationSettings.pricingBrutto'));
      queryClient.invalidateQueries({ queryKey: ['instance_data'] });
    }
  };

  const handleEnablePush = async () => {
    const result = await subscribe();
    if (result.success) {
      toast.success(t('pushNotifications.enabled'));
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-24 md:pb-0">
      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label className="font-medium">{t('reservationSettings.pricingMode')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.pricingModeDesc')}
            </p>
          </div>
          <RadioGroup
            value={pricingMode}
            onValueChange={(v) => handlePricingModeChange(v as 'netto' | 'brutto')}
            className="flex gap-4 shrink-0"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="brutto" id="pricing-brutto" />
              <Label htmlFor="pricing-brutto">{t('reservationSettings.brutto')}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="netto" id="pricing-netto" />
              <Label htmlFor="pricing-netto">{t('reservationSettings.netto')}</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="auto-confirm" className="font-medium">
              {t('reservationSettings.autoConfirm')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {autoConfirm
                ? t('reservationSettings.autoConfirmOn')
                : t('reservationSettings.autoConfirmOff')}
            </p>
          </div>
          <Switch
            size="sm"
            id="auto-confirm"
            checked={autoConfirm}
            onCheckedChange={handleToggleAutoConfirm}
            disabled={saving}
          />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="cutoff-hours" className="font-medium">
              {t('reservationSettings.editCutoff')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.editCutoffDesc')}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Input
              id="cutoff-hours"
              type="number"
              min={0}
              max={48}
              value={customerEditCutoffHours}
              onChange={(e) => setCustomerEditCutoffHours(parseInt(e.target.value) || 0)}
              onBlur={(e) => saveCutoffHours(parseInt(e.target.value) || 0)}
              className="w-20"
              disabled={saving}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">{t('common.hours')}</span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="assign-stations" className="font-medium">
              {t('reservationSettings.assignStations')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.assignStationsDesc')}
            </p>
          </div>
          <Switch
            size="sm"
            id="assign-stations"
            checked={instanceSettings?.assign_employees_to_stations ?? false}
            onCheckedChange={(checked) =>
              handleToggleSetting('assign_employees_to_stations', checked)
            }
            disabled={savingSettings || isSettingsLoading}
          />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="assign-reservations" className="font-medium">
              {t('reservationSettings.assignReservations')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.assignReservationsDesc')}
            </p>
          </div>
          <Switch
            size="sm"
            id="assign-reservations"
            checked={instanceSettings?.assign_employees_to_reservations ?? false}
            onCheckedChange={(checked) =>
              handleToggleSetting('assign_employees_to_reservations', checked)
            }
            disabled={savingSettings || isSettingsLoading}
          />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="show-status" className="font-medium">
              {t('reservationSettings.progressStatuses')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.progressStatusesDesc')}
            </p>
            {instanceSettings?.show_reservation_status && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {t('reservations.statuses.confirmed')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  {t('reservations.statuses.inProgress')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  {t('reservations.statuses.completed')}
                </span>
              </div>
            )}
          </div>
          <Switch
            size="sm"
            id="show-status"
            checked={instanceSettings?.show_reservation_status ?? false}
            onCheckedChange={(checked) =>
              handleToggleSetting('show_reservation_status', checked)
            }
            disabled={savingSettings || isSettingsLoading}
          />
        </div>
      </div>

      {!isPushSupported ? (
        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-2">
          <p className="text-sm text-muted-foreground font-medium">
            {t('reservationSettings.pushNotSupported')}
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>iPhone:</strong> {t('reservationSettings.pushIphoneHint')}
            </p>
            <p>
              <strong>Android:</strong> {t('reservationSettings.pushAndroidHint')}
            </p>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {t('reservationSettings.pushChromeIosNote')}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-border/50 bg-white">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="font-medium">{t('reservationSettings.pushOnDevice')}</Label>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? t('reservationSettings.pushEnabled')
                  : t('reservationSettings.pushDisabled')}
              </p>
            </div>
            <Switch
              size="sm"
              checked={isSubscribed}
              onCheckedChange={(checked) => {
                if (checked && !isSubscribed) handleEnablePush();
              }}
              disabled={isPushLoading || isSubscribed}
            />
          </div>
        </div>
      )}

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{t('reservationSettings.vinField')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.vinFieldDesc')}
            </p>
          </div>
          <Switch
            size="sm"
            checked={vinEnabled}
            onCheckedChange={(v) => handleFeatureToggle('vehicle_vin', v, setVinEnabled)}
          />
        </div>
      </div>

      <div className="p-4 rounded-lg border border-border/50 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{t('reservationSettings.protocolServices')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('reservationSettings.protocolServicesDesc')}
            </p>
          </div>
          <Switch
            size="sm"
            checked={protocolServicesEnabled}
            onCheckedChange={(v) =>
              handleFeatureToggle('protocol_services', v, setProtocolServicesEnabled)
            }
          />
        </div>
      </div>
    </div>
  );
};
