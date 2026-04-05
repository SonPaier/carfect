import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Input, Label, Switch } from '@shared/ui';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface WorkingHoursSettingsProps {
  instanceId: string | null;
  onSave?: () => void;
}

interface DayHours {
  open: string;
  close: string;
}

type WorkingHours = Record<string, DayHours | null>;

const DAYS = [
  { key: 'monday', labelKey: 'workingHours.monday' },
  { key: 'tuesday', labelKey: 'workingHours.tuesday' },
  { key: 'wednesday', labelKey: 'workingHours.wednesday' },
  { key: 'thursday', labelKey: 'workingHours.thursday' },
  { key: 'friday', labelKey: 'workingHours.friday' },
  { key: 'saturday', labelKey: 'workingHours.saturday' },
  { key: 'sunday', labelKey: 'workingHours.sunday' },
];

const DEFAULT_HOURS: WorkingHours = {
  monday: { open: '09:00', close: '19:00' },
  tuesday: { open: '09:00', close: '19:00' },
  wednesday: { open: '09:00', close: '19:00' },
  thursday: { open: '09:00', close: '19:00' },
  friday: { open: '09:00', close: '19:00' },
  saturday: { open: '09:00', close: '14:00' },
  sunday: null,
};

const WorkingHoursSettings = ({ instanceId, onSave }: WorkingHoursSettingsProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS);

  const fetchWorkingHours = async () => {
    if (!instanceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(false);
    try {
      const { data, error } = await supabase
        .from('instances')
        .select('working_hours')
        .eq('id', instanceId)
        .maybeSingle();

      if (error) {
        setFetchError(true);
      } else if (data?.working_hours) {
        setWorkingHours(data.working_hours as unknown as WorkingHours);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const handleDayToggle = (dayKey: string, enabled: boolean) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayKey]: enabled ? { open: '09:00', close: '19:00' } : null,
    }));
  };

  const handleTimeChange = (dayKey: string, field: 'open' | 'close', value: string) => {
    if (!value) return;
    setWorkingHours((prev) => {
      const currentDay = prev[dayKey];
      if (!currentDay) return prev;
      return {
        ...prev,
        [dayKey]: { ...currentDay, [field]: value },
      };
    });
  };

  const handleSave = async () => {
    if (!instanceId) return;
    if (saving) return;

    for (const { key, labelKey } of DAYS) {
      const dayHours = workingHours[key];
      if (dayHours != null) {
        if (dayHours.open >= dayHours.close) {
          toast.error(`${t(labelKey)}: godzina otwarcia musi być wcześniejsza niż zamknięcia`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const { error } = await supabase.rpc('update_instance_working_hours', {
        _instance_id: instanceId,
        _working_hours: workingHours,
      });

      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['working_hours', instanceId] });
      toast.success(t('workingHours.saved'));
      onSave?.();
    } catch (error) {
      console.error('Error saving working hours:', error);
      toast.error(t('workingHours.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!instanceId) {
    return (
      <div className="text-center py-8 text-muted-foreground">{t('workingHours.noInstance')}</div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive">Nie udało się pobrać godzin pracy.</p>
        <Button variant="outline" size="sm" onClick={fetchWorkingHours}>
          Spróbuj ponownie
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('workingHours.title')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ustaw godziny otwarcia dla każdego dnia tygodnia. W takim zakresie godzin będzie dostępny kalendarz rezerwacji.
        </p>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, labelKey }) => {
          const dayHours = workingHours[key];
          const isOpen = dayHours != null;
          const switchId = `working-hours-switch-${key}`;

          return (
            <div
              key={key}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-white border border-border/50"
            >
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:w-36">
                <div className="flex items-center gap-3">
                  <Switch
                    id={switchId}
                    size="sm"
                    checked={isOpen}
                    onCheckedChange={(checked) => handleDayToggle(key, checked)}
                  />
                  <Label htmlFor={switchId} className="font-medium text-sm sm:text-base">
                    {t(labelKey)}
                  </Label>
                </div>
                {!isOpen && (
                  <span className="text-muted-foreground text-xs sm:hidden">
                    {t('workingHours.closed')}
                  </span>
                )}
              </div>

              {isOpen ? (
                <div className="flex items-center gap-2 flex-1 justify-end pl-10 sm:pl-0">
                  <Input
                    type="time"
                    value={dayHours.open}
                    onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                    className="w-24 text-sm"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={dayHours.close}
                    onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                    className="w-24 text-sm"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm hidden sm:inline">
                  {t('workingHours.closed')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={saving || loading} size="sm">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t('common.save')}
      </Button>
    </div>
  );
};

export default WorkingHoursSettings;
