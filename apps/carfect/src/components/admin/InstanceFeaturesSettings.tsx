import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@shared/ui';
import { Label } from '@shared/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/ui';
import { Badge } from '@shared/ui';
import { Input } from '@shared/ui';
import {
  Building2,
  Car,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Link2,
  TrendingUp,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInstancePlan } from '@/hooks/useInstancePlan';

interface InstanceFeature {
  feature_key: string;
  enabled: boolean;
  parameters: Record<string, unknown> | null;
}

interface InstanceFeaturesSettingsProps {
  instanceId: string;
}

interface FeatureDefinition {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  isPaid: boolean;
  hasParameters?: boolean;
}

const AVAILABLE_FEATURES: FeatureDefinition[] = [
  { key: 'offers', icon: FileText, isPaid: true },
  { key: 'upsell', icon: TrendingUp, isPaid: false },
  { key: 'sms_edit_link', icon: Link2, isPaid: false, hasParameters: true },
  { key: 'hall_view', icon: Building2, isPaid: false },
  { key: 'vehicle_reception_protocol', icon: ClipboardCheck, isPaid: true },
  { key: 'followup', icon: TrendingUp, isPaid: true },
  { key: 'reminders', icon: FileText, isPaid: true },
  { key: 'trainings', icon: GraduationCap, isPaid: false },
  { key: 'sales_crm', icon: TrendingUp, isPaid: true },
  { key: 'vehicle_vin', icon: Car, isPaid: false },
];

export const InstanceFeaturesSettings = ({ instanceId }: InstanceFeaturesSettingsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState<InstanceFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [parameterInputs, setParameterInputs] = useState<Record<string, string>>({});

  // Get plan data to check which features are included
  const { includedFeatures, loading: planLoading } = useInstancePlan(instanceId);

  useEffect(() => {
    fetchFeatures();
    // fetchFeatures is defined in component body and not memoized — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('instance_features')
        .select('feature_key, enabled, parameters')
        .eq('instance_id', instanceId);

      if (error) throw error;

      const mappedFeatures: InstanceFeature[] = (data || []).map((f) => ({
        feature_key: f.feature_key,
        enabled: f.enabled,
        parameters: f.parameters as Record<string, unknown> | null,
      }));

      setFeatures(mappedFeatures);

      // Initialize parameter inputs from existing data
      const inputs: Record<string, string> = {};
      for (const f of mappedFeatures) {
        if (f.parameters && typeof f.parameters === 'object' && 'phones' in f.parameters) {
          inputs[f.feature_key] = (f.parameters.phones as string[]).join(', ');
        }
      }
      setParameterInputs(inputs);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, currentEnabled: boolean) => {
    setSaving(featureKey);
    try {
      const currentFeature = features.find((f) => f.feature_key === featureKey);
      const { error } = await supabase.from('instance_features').upsert(
        {
          instance_id: instanceId,
          feature_key: featureKey,
          enabled: !currentEnabled,
          parameters: currentFeature?.parameters || null,
        },
        {
          onConflict: 'instance_id,feature_key',
        },
      );

      if (error) throw error;

      setFeatures((prev) => {
        const existing = prev.find((f) => f.feature_key === featureKey);
        if (existing) {
          return prev.map((f) =>
            f.feature_key === featureKey ? { ...f, enabled: !currentEnabled } : f,
          );
        }
        return [...prev, { feature_key: featureKey, enabled: !currentEnabled, parameters: null }];
      });

      // Invalidate features cache
      queryClient.invalidateQueries({ queryKey: ['instance_features', instanceId] });

      toast.success(!currentEnabled ? t('instanceFeatures.toastEnabled') : t('instanceFeatures.toastDisabled'));
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error(t('instanceFeatures.toastToggleError'));
    } finally {
      setSaving(null);
    }
  };

  const saveParameters = async (featureKey: string) => {
    setSaving(featureKey);
    try {
      const inputValue = parameterInputs[featureKey] || '';
      const phones = inputValue
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const parameters = phones.length > 0 ? { phones } : null;

      const currentFeature = features.find((f) => f.feature_key === featureKey);
      const { error } = await supabase.from('instance_features').upsert(
        {
          instance_id: instanceId,
          feature_key: featureKey,
          enabled: currentFeature?.enabled ?? false,
          parameters,
        },
        {
          onConflict: 'instance_id,feature_key',
        },
      );

      if (error) throw error;

      setFeatures((prev) => {
        const existing = prev.find((f) => f.feature_key === featureKey);
        if (existing) {
          return prev.map((f) => (f.feature_key === featureKey ? { ...f, parameters } : f));
        }
        return [...prev, { feature_key: featureKey, enabled: false, parameters }];
      });

      // Invalidate features cache
      queryClient.invalidateQueries({ queryKey: ['instance_features', instanceId] });

      toast.success(t('instanceFeatures.toastParamsSaved'));
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast.error(t('instanceFeatures.toastParamsError'));
    } finally {
      setSaving(null);
    }
  };

  const isFeatureEnabled = (featureKey: string) => {
    return features.find((f) => f.feature_key === featureKey)?.enabled ?? false;
  };

  const getFeatureParameters = (featureKey: string) => {
    return features.find((f) => f.feature_key === featureKey)?.parameters || null;
  };

  const isFeatureFromPlan = (featureKey: string) => {
    return includedFeatures.includes(featureKey);
  };

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('instanceFeatures.cardTitle')}</CardTitle>
        <CardDescription>{t('instanceFeatures.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {AVAILABLE_FEATURES.map((feature) => {
          const Icon = feature.icon;
          const isFromPlan = isFeatureFromPlan(feature.key);
          const isEnabled = isFromPlan || isFeatureEnabled(feature.key);
          const isSaving = saving === feature.key;

          return (
            <div key={feature.key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="font-medium">{t(`instanceFeatures.${feature.key}.name`)}</Label>
                      {isFromPlan ? (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          {t('instanceFeatures.badgeInPlan')}
                        </Badge>
                      ) : feature.isPaid ? (
                        <Badge variant="secondary" className="text-xs">
                          {t('instanceFeatures.badgeAdditional')}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{t(`instanceFeatures.${feature.key}.description`)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Switch
                    size="sm"
                    checked={isEnabled}
                    onCheckedChange={() => toggleFeature(feature.key, isEnabled)}
                    disabled={isSaving || isFromPlan}
                  />
                </div>
              </div>

              {feature.hasParameters && isEnabled && (
                <div className="ml-14 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={parameterInputs[feature.key] || ''}
                      onChange={(e) =>
                        setParameterInputs((prev) => ({
                          ...prev,
                          [feature.key]: e.target.value,
                        }))
                      }
                      placeholder={t(`instanceFeatures.${feature.key}.parameterPlaceholder`)}
                      className="flex-1"
                      onBlur={() => saveParameters(feature.key)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t(`instanceFeatures.${feature.key}.parameterDescription`)}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
