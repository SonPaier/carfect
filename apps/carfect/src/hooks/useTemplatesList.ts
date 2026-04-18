import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteTemplate } from '@/services/reminderService';

export interface ReminderTemplate {
  id: string;
  name: string;
  description: string | null;
  items: { months: number; service_type: string }[];
  sms_template: string | null;
  email_subject: string | null;
}

export interface TemplateWithCount extends ReminderTemplate {
  activeCustomersCount: number;
  servicesCount: number;
}

const DEFAULT_PAGE_SIZE = 25;

export function useTemplatesList(instanceId: string | null) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateWithCount[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const [templatesRes, countsRes, servicesRes] = await Promise.all([
        supabase
          .from('reminder_templates')
          .select('id, name, description, items, sms_template, email_subject')
          .eq('instance_id', instanceId)
          .order('name'),
        supabase
          .from('customer_reminders')
          .select('reminder_template_id, customer_phone')
          .eq('instance_id', instanceId)
          .eq('status', 'scheduled')
          .gte('scheduled_date', new Date().toISOString().split('T')[0]),
        supabase
          .from('service_reminder_templates')
          .select('reminder_template_id')
          .eq('instance_id', instanceId),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (countsRes.error) throw countsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      const countsByTemplate: Record<string, Set<string>> = {};
      (countsRes.data || []).forEach((row) => {
        if (!countsByTemplate[row.reminder_template_id]) {
          countsByTemplate[row.reminder_template_id] = new Set();
        }
        countsByTemplate[row.reminder_template_id].add(row.customer_phone);
      });

      const servicesByTemplate: Record<string, number> = {};
      (servicesRes.data || []).forEach((row: { reminder_template_id: string }) => {
        servicesByTemplate[row.reminder_template_id] = (servicesByTemplate[row.reminder_template_id] || 0) + 1;
      });

      setTemplates((templatesRes.data || []).map((tmpl) => ({
        ...tmpl,
        items: Array.isArray(tmpl.items)
          ? (tmpl.items as { months: number; service_type: string }[])
          : [],
        activeCustomersCount: countsByTemplate[tmpl.id]?.size || 0,
        servicesCount: servicesByTemplate[tmpl.id] || 0,
      })));
    } catch (error: unknown) {
      console.error('Error fetching templates:', error);
      toast.error(t('reminderTemplates.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [instanceId, t]);

  useEffect(() => {
    if (instanceId) fetchTemplates();
  }, [instanceId, fetchTemplates]);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((tmpl) => tmpl.name.toLowerCase().includes(q));
  }, [templates, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search]);

  const scrollToTop = useCallback(() => {
    tableRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    scrollToTop();
  }, [scrollToTop]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
    scrollToTop();
  }, [scrollToTop]);

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((tmpl) => tmpl.id !== templateId));
      toast.success(t('reminderTemplates.deleted'));
    } catch (error: unknown) {
      if ((error as Error).message === 'template_in_use') {
        toast.error(t('reminderTemplates.templateInUse'));
      } else {
        console.error('Error deleting template:', error);
        toast.error(t('reminderTemplates.deleteError'));
      }
    }
  };

  return {
    loading,
    search, setSearch,
    page, totalPages, paginated, filtered,
    handlePageChange, handlePageSizeChange,
    tableRef,
    handleDeleteTemplate,
    refetch: fetchTemplates,
  };
}
