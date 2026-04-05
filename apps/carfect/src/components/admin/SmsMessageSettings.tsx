import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SmsUsageCard } from './SmsUsageCard';

interface SmsLogEntry {
  phone: string;
  message: string;
  created_at: string;
  message_type: string;
  status: string;
}

interface SmsMessageSettingsProps {
  instanceId: string | null;
  instanceName?: string;
}

type SmsMessageType =
  | 'verification_code'
  | 'reservation_confirmed'
  | 'reservation_pending'
  | 'reservation_confirmed_by_admin'
  | 'reservation_edited'
  | 'reminder_1day'
  | 'reminder_1hour'
  | 'vehicle_ready';

interface MessageSetting {
  type: SmsMessageType;
  enabled: boolean;
  sendAtTime?: string | null;
}

const SMS_MESSAGE_TYPES: SmsMessageType[] = [
  'verification_code',
  'reservation_confirmed',
  'reservation_pending',
  'reservation_confirmed_by_admin',
  'reservation_edited',
  'reminder_1day',
  'reminder_1hour',
  'vehicle_ready',
];

const HIDDEN_SMS_TYPES: SmsMessageType[] = [
  'verification_code',
  'reservation_pending',
  'reservation_confirmed_by_admin',
  'reservation_edited',
];

const MONTH_NAMES_PL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  verification_code: 'Kod',
  reservation_confirmed: 'Potw.',
  reservation_pending: 'Oczek.',
  reservation_confirmed_by_admin: 'Potw. admin',
  reservation_edited: 'Zmiana',
  reminder_1day: 'Przyp. 1d',
  reminder_1hour: 'Przyp. dziś',
  vehicle_ready: 'Gotowy',
  confirmation: 'Potw.',
  pending_confirmation: 'Oczek.',
  manual: 'Ręczny',
  customer_reminder: 'Oferta',
  payment_blik: 'BLIK',
  payment_bank_transfer: 'Przelew',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  sent: { label: 'Wysłany', className: 'text-green-700 bg-green-50' },
  failed: { label: 'Błąd', className: 'text-red-700 bg-red-50' },
  simulated: { label: 'Demo', className: 'text-blue-700 bg-blue-50' },
};

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00Z`;
  const endMonth = month === 11 ? 0 : month + 1;
  const endYear = month === 11 ? year + 1 : year;
  const end = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01T00:00:00Z`;
  return { start, end };
}

const SmsMessageSettings = ({ instanceId, instanceName }: SmsMessageSettingsProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<MessageSetting[]>([]);
  const [currentInstanceName, setCurrentInstanceName] = useState(instanceName || '');
  const [currentReservationPhone, setCurrentReservationPhone] = useState('');
  const [smsLimit, setSmsLimit] = useState(100);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [smsLogs, setSmsLogs] = useState<SmsLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (instanceId) {
      fetchSettings();
      fetchInstanceData();
    }
  }, [instanceId]);

  useEffect(() => {
    if (instanceId) {
      fetchSmsLogs();
    }
  }, [instanceId, selectedMonth]);

  const fetchInstanceData = async () => {
    if (!instanceId) return;

    const { data } = await supabase
      .from('instances')
      .select('name, short_name, phone, reservation_phone, sms_limit')
      .eq('id', instanceId)
      .single();

    if (data) {
      setCurrentInstanceName(data.short_name || data.name);
      setCurrentReservationPhone(data.reservation_phone || data.phone || '');
      setSmsLimit(data.sms_limit);
    }
  };

  const fetchSettings = async () => {
    if (!instanceId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sms_message_settings')
        .select('message_type, enabled, send_at_time')
        .eq('instance_id', instanceId);

      if (error) throw error;

      const existingSettings = new Map(
        data?.map((s) => [s.message_type, { enabled: s.enabled, sendAtTime: s.send_at_time }]) ||
          [],
      );

      const allSettings: MessageSetting[] = SMS_MESSAGE_TYPES.map((type) => ({
        type,
        enabled: existingSettings.has(type) ? existingSettings.get(type)!.enabled : true,
        sendAtTime: existingSettings.has(type)
          ? existingSettings.get(type)!.sendAtTime
          : type === 'reminder_1day'
            ? '19:00'
            : null,
      }));

      setSettings(allSettings);
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      setSettings(
        SMS_MESSAGE_TYPES.map((type) => ({
          type,
          enabled: true,
          sendAtTime: type === 'reminder_1day' ? '19:00' : null,
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type: SmsMessageType, enabled: boolean) => {
    setSettings((prev) => prev.map((s) => (s.type === type ? { ...s, enabled } : s)));
  };

  const handleSave = async () => {
    if (!instanceId) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('sms_message_settings').upsert(
        settings.map((s) => ({
          instance_id: instanceId,
          message_type: s.type,
          enabled: s.enabled,
          send_at_time: s.sendAtTime ?? null,
        })),
        { onConflict: 'instance_id,message_type' },
      );

      if (error) throw error;
      toast.success(t('settings.saved'));
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error(t('settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const fetchSmsLogs = async () => {
    if (!instanceId) return;

    setLoadingLogs(true);
    try {
      const { start, end } = getMonthRange(selectedMonth);

      const { data, error } = await supabase
        .from('sms_logs')
        .select('phone, message, created_at, message_type, status')
        .eq('instance_id', instanceId)
        .neq('status', 'failed')
        .gte('created_at', start)
        .lt('created_at', end)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setSmsLogs(data || []);
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      toast.error('Błąd pobierania historii SMS');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const now = new Date();
    const next = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    if (next <= new Date(now.getFullYear(), now.getMonth() + 1, 1)) {
      setSelectedMonth(next);
    }
  };

  const isCurrentMonth =
    selectedMonth.getFullYear() === new Date().getFullYear() &&
    selectedMonth.getMonth() === new Date().getMonth();

  const getMessageTypeLabel = (type: SmsMessageType): string => {
    return t(`sms.messageTypes.${type}.label`);
  };

  const getMessageTypeDescription = (type: SmsMessageType): string => {
    return t(`sms.messageTypes.${type}.description`);
  };

  const getExampleMessage = (type: SmsMessageType): string => {
    const template = t(`sms.messageTypes.${type}.exampleTemplate`);
    const phoneWithoutSpaces = (currentReservationPhone || '+48123456789').replace(/\s/g, '');
    return template
      .replace('{{instanceName}}', currentInstanceName || 'Nazwa myjni')
      .replace('{{reservationPhone}}', phoneWithoutSpaces);
  };

  const formatLogDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLogTypeLabel = (type: string): string => {
    return MESSAGE_TYPE_LABELS[type] || type;
  };

  const getLogStatus = (status: string) => {
    return STATUS_LABELS[status] || { label: status, className: 'text-gray-700 bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Month Picker */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-[140px] text-center">
          {MONTH_NAMES_PL[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* SMS Usage */}
      {instanceId && <SmsUsageCard smsCount={smsLogs.length} smsLimit={smsLimit} />}

      {/* SMS History Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Historia SMS ({smsLogs.length})</span>
          {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {smsLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {loadingLogs ? 'Ładowanie...' : 'Brak wiadomości SMS w tym miesiącu'}
          </p>
        ) : (
          <div className="max-h-[400px] overflow-auto border rounded-lg text-xs">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="h-8 px-2 text-xs">Data</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Telefon</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Typ</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Status</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Treść</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smsLogs.map((log, i) => {
                  const statusInfo = getLogStatus(log.status);
                  return (
                    <TableRow key={`${log.created_at}-${i}`}>
                      <TableCell className="p-2 whitespace-nowrap">
                        {formatLogDate(log.created_at)}
                      </TableCell>
                      <TableCell className="p-2 whitespace-nowrap font-mono">{log.phone}</TableCell>
                      <TableCell className="p-2 whitespace-nowrap">
                        {getLogTypeLabel(log.message_type)}
                      </TableCell>
                      <TableCell className="p-2 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="p-2 max-w-[200px] truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t('sms.messageSettings')}</h3>
          <p className="text-sm text-muted-foreground">{t('sms.messageSettingsDescription')}</p>
        </div>

        {settings
          .filter((setting) => !HIDDEN_SMS_TYPES.includes(setting.type))
          .map((setting) => (
            <div
              key={setting.type}
              className="space-y-2 py-3 border-b border-border/30 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium text-sm">{getMessageTypeLabel(setting.type)}</div>
                  <div className="text-xs text-muted-foreground">
                    {getMessageTypeDescription(setting.type)}
                  </div>
                </div>
                <Switch
                  size="sm"
                  checked={setting.enabled}
                  onCheckedChange={(checked) => handleToggle(setting.type, checked)}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {getExampleMessage(setting.type)}
              </p>
            </div>
          ))}
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving || loading || settings.length === 0}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {t('common.save')}
      </Button>
    </div>
  );
};

export default SmsMessageSettings;
