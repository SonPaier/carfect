import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { fetchTemplate, saveTemplate, DEFAULT_SMS_TEMPLATE } from '../services/reminderService';

const DEFAULT_EMAIL_BODY = 'Szanowny Kliencie,\n\nPrzypominamy o zbliżającym się terminie wizyty serwisowej pojazdu {pojazd}.\n\nZapraszamy do kontaktu: {telefon_firmy}';

export function useReminderTemplate(instanceId: string | null, shortId: string | undefined) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [repeatCount, setRepeatCount] = useState(1);
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [smsTemplate, setSmsTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Computed items from count × interval
  const items = useMemo(
    () => Array.from({ length: repeatCount }, (_, i) => ({
      months: intervalMonths * (i + 1),
      service_type: 'serwis',
    })),
    [repeatCount, intervalMonths],
  );

  const schedulePreview = useMemo(
    () => items.map((it) => it.months).join(', ') + ' mies.',
    [items],
  );

  // Load template on mount
  useEffect(() => {
    if (!instanceId || !shortId) return;

    if (shortId === 'new') {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const row = await fetchTemplate(instanceId!, shortId!);
        if (cancelled) return;

        setTemplateId(row.id);
        setName(row.name);
        setSmsTemplate(row.sms_template || DEFAULT_SMS_TEMPLATE);
        setEmailSubject(row.email_subject || 'Przypomnienie o wizycie');
        setEmailBody(row.email_body || DEFAULT_EMAIL_BODY);

        // Reverse-engineer repeatCount and intervalMonths from items
        if (row.items.length > 0) {
          const firstMonth = row.items[0].months;
          const isEvenlySpaced = row.items.every(
            (item, idx) => item.months === firstMonth * (idx + 1)
          );

          if (isEvenlySpaced) {
            setIntervalMonths(firstMonth);
            setRepeatCount(row.items.length);
          } else {
            // Fallback: use length and first item's months
            setRepeatCount(row.items.length);
            setIntervalMonths(firstMonth);
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          console.error('Error loading template:', error);
          toast.error(t('reminderTemplates.fetchError'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [instanceId, shortId, t]);

  async function save(onSaved?: (id: string) => void): Promise<void> {
    if (!instanceId) return;

    if (!name.trim()) {
      toast.error(t('reminderTemplates.nameRequired'));
      return;
    }

    // Email: subject and body must both be filled or both empty
    const hasSubject = emailSubject.trim().length > 0;
    const hasBody = emailBody.trim().length > 0;
    if (hasSubject !== hasBody) {
      toast.error(t('reminderTemplates.emailBothRequired'));
      return;
    }

    setSaving(true);
    try {
      const id = await saveTemplate(instanceId, {
        id: templateId || undefined,
        name: name.trim(),
        smsTemplate,
        emailSubject,
        emailBody,
        items,
      });

      toast.success(t('reminderTemplates.saved'));
      onSaved?.(id);
    } catch (error: unknown) {
      console.error('Error saving template:', error);
      toast.error(t('reminderTemplates.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,
    saving,
    templateId,
    name, setName,
    repeatCount, setRepeatCount,
    intervalMonths, setIntervalMonths,
    smsTemplate, setSmsTemplate,
    emailSubject, setEmailSubject,
    emailBody, setEmailBody,
    items,
    schedulePreview,
    save,
  };
}
