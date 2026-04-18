import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerReminder {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  channel: string | null;
  status: string;
  reminder_template_id: string;
  reminder_templates: { name: string } | null;
}

const DEFAULT_PAGE_SIZE = 25;

export function useRemindersList(instanceId: string | null) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<CustomerReminder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'sent'>('scheduled');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchReminders = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_reminders')
        .select('*, reminder_templates(name)')
        .eq('instance_id', instanceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setReminders((data || []) as CustomerReminder[]);
    } catch (error: unknown) {
      console.error('Error fetching reminders:', error);
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [instanceId, t]);

  useEffect(() => {
    if (instanceId) fetchReminders();
  }, [instanceId, fetchReminders]);

  const filtered = useMemo(() => {
    let result = reminders;

    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          (r.reminder_templates?.name && r.reminder_templates.name.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [reminders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

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

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase.from('customer_reminders').delete().eq('id', id);
      if (error) throw error;
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success(t('reminders.reminderDeleted'));
    } catch (error: unknown) {
      console.error('Error deleting reminder:', error);
      toast.error(t('errors.generic'));
    }
  };

  return {
    loading,
    search, setSearch,
    statusFilter, setStatusFilter,
    page, totalPages, paginated, filtered,
    handlePageChange, handlePageSizeChange,
    tableRef,
    deleteReminder,
  };
}
