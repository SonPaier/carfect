import { supabase } from '@/integrations/supabase/client';

export const DEFAULT_SMS_TEMPLATE =
  'Zapraszamy na wizytę — pojazd {pojazd}. Kontakt: {telefon_firmy}';

interface ReminderTemplateData {
  id?: string;
  name: string;
  smsTemplate: string;
  emailSubject: string;
  emailBody: string;
  items: { months: number; service_type: string }[];
}

interface ReminderTemplateRow {
  id: string;
  name: string;
  sms_template: string | null;
  email_subject: string | null;
  email_body: string | null;
  items: { months: number; service_type: string }[];
  instance_id: string;
}

interface TemplateListItem {
  id: string;
  name: string;
  items: { months: number; service_type: string }[];
  activeCustomersCount: number;
}

export async function fetchTemplate(
  instanceId: string,
  shortId: string,
): Promise<ReminderTemplateRow> {
  const { data, error } = await supabase
    .from('reminder_templates')
    .select('id, name, sms_template, email_subject, email_body, items, instance_id')
    .eq('instance_id', instanceId);

  if (error) throw error;

  const match = (data || []).find((row: { id: string }) => row.id.startsWith(shortId));
  if (!match) throw new Error('template_not_found');

  return {
    ...match,
    items: Array.isArray(match.items)
      ? (match.items as { months: number; service_type: string }[])
      : [],
  } as ReminderTemplateRow;
}

export async function saveTemplate(
  instanceId: string,
  data: ReminderTemplateData,
): Promise<string> {
  if (data.id) {
    // UPDATE
    const { error } = await supabase
      .from('reminder_templates')
      .update({
        name: data.name,
        sms_template: data.smsTemplate || null,
        email_subject: data.emailSubject || null,
        email_body: data.emailBody || null,
        items: data.items,
      })
      .eq('id', data.id);

    if (error) throw error;
    return data.id;
  }

  // INSERT
  const { data: inserted, error } = await supabase
    .from('reminder_templates')
    .insert({
      instance_id: instanceId,
      name: data.name,
      sms_template: data.smsTemplate || null,
      email_subject: data.emailSubject || null,
      email_body: data.emailBody || null,
      items: data.items,
    })
    .select('id')
    .single();

  if (error) throw error;
  return inserted.id;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { count } = await supabase
    .from('customer_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('reminder_template_id', templateId)
    .eq('status', 'scheduled');

  if (count && count > 0) {
    throw new Error('template_in_use');
  }

  const { error } = await supabase
    .from('reminder_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
}

export async function fetchTemplateList(instanceId: string): Promise<TemplateListItem[]> {
  const { data: templatesData, error: templatesError } = await supabase
    .from('reminder_templates')
    .select('id, name, items')
    .eq('instance_id', instanceId)
    .order('name');

  if (templatesError) throw templatesError;

  const { data: countsData, error: countsError } = await supabase
    .from('customer_reminders')
    .select('reminder_template_id, customer_phone')
    .eq('instance_id', instanceId)
    .eq('status', 'scheduled')
    .gte('scheduled_date', new Date().toISOString().split('T')[0]);

  if (countsError) throw countsError;

  const countsByTemplate: Record<string, Set<string>> = {};
  (countsData || []).forEach(
    (row: { reminder_template_id: string; customer_phone: string }) => {
      if (!countsByTemplate[row.reminder_template_id]) {
        countsByTemplate[row.reminder_template_id] = new Set();
      }
      countsByTemplate[row.reminder_template_id].add(row.customer_phone);
    },
  );

  return (templatesData || []).map((row: { id: string; name: string; items: unknown }) => ({
    id: row.id,
    name: row.name,
    items: Array.isArray(row.items)
      ? (row.items as { months: number; service_type: string }[])
      : [],
    activeCustomersCount: countsByTemplate[row.id]?.size || 0,
  }));
}
