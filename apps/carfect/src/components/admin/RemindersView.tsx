import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2, MoreHorizontal, Trash2, Users, Bell, Search, Pencil } from 'lucide-react';
import ReminderTemplateEditPage from '@/pages/ReminderTemplateEditPage';
import { Button, Badge, Input, cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  PaginationFooter,
} from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import { useIsMobile, EmptyState } from '@shared/ui';
import { Tabs, TabsContent } from '@shared/ui';
import { AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminTabsList';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPhoneDisplay } from '@shared/utils';
import { deleteTemplate } from '@/services/reminderService';

interface ReminderTemplate {
  id: string;
  name: string;
  description: string | null;
  items: { months: number; service_type: string }[];
  sms_template: string | null;
  email_subject: string | null;
}

interface TemplateWithCount extends ReminderTemplate {
  activeCustomersCount: number;
  servicesCount: number;
}

interface CustomerReminder {
  id: string;
  customer_name: string;
  customer_phone: string;
  scheduled_date: string;
  channel: string | null;
  status: string;
  reminder_template_id: string;
  reminder_templates: { name: string } | null;
}

interface RemindersViewProps {
  instanceId: string | null;
  onNavigateBack?: () => void;
}

const DEFAULT_PAGE_SIZE = 25;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

export default function RemindersView({ instanceId }: RemindersViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'reminders' | 'templates'>('reminders');
  const [editingShortId, setEditingShortId] = useState<string | null>(null);

  // Templates state
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateWithCount[]>([]);
  const [deleteTemplateDialog, setDeleteTemplateDialog] = useState<{
    open: boolean;
    template: ReminderTemplate | null;
  }>({ open: false, template: null });
  const [templatesSearch, setTemplatesSearch] = useState('');
  const [templatesPage, setTemplatesPage] = useState(1);
  const [templatesPageSize, setTemplatesPageSize] = useState(DEFAULT_PAGE_SIZE);
  const templatesTableRef = useRef<HTMLDivElement>(null);

  // Reminders state
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [reminders, setReminders] = useState<CustomerReminder[]>([]);
  const [deleteReminderDialog, setDeleteReminderDialog] = useState<{
    open: boolean;
    reminder: CustomerReminder | null;
  }>({ open: false, reminder: null });
  const [remindersSearch, setRemindersSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'sent' | 'failed'>('scheduled');
  const [remindersPage, setRemindersPage] = useState(1);
  const [remindersPageSize, setRemindersPageSize] = useState(DEFAULT_PAGE_SIZE);
  const remindersTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (instanceId) {
      fetchTemplates();
      fetchReminders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  const fetchTemplates = async () => {
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

      const templatesData = templatesRes.data;
      const countsData = countsRes.data;
      const servicesData = servicesRes.data;

      const countsByTemplate: Record<string, Set<string>> = {};
      (countsData || []).forEach((row) => {
        if (!countsByTemplate[row.reminder_template_id]) {
          countsByTemplate[row.reminder_template_id] = new Set();
        }
        countsByTemplate[row.reminder_template_id].add(row.customer_phone);
      });

      const servicesByTemplate: Record<string, number> = {};
      (servicesData || []).forEach((row: { reminder_template_id: string }) => {
        servicesByTemplate[row.reminder_template_id] = (servicesByTemplate[row.reminder_template_id] || 0) + 1;
      });

      const templatesWithCounts: TemplateWithCount[] = (templatesData || []).map((tmpl) => ({
        ...tmpl,
        items: Array.isArray(tmpl.items)
          ? (tmpl.items as { months: number; service_type: string }[])
          : [],
        activeCustomersCount: countsByTemplate[tmpl.id]?.size || 0,
        servicesCount: servicesByTemplate[tmpl.id] || 0,
      }));

      setTemplates(templatesWithCounts);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error(t('reminderTemplates.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    if (!instanceId) return;
    setRemindersLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_reminders')
        .select('*, reminder_templates(name)')
        .eq('instance_id', instanceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setReminders((data || []) as CustomerReminder[]);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error(t('errors.generic'));
    } finally {
      setRemindersLoading(false);
    }
  };

  // --- Template actions ---

  const handleDeleteTemplate = async () => {
    const template = deleteTemplateDialog.template;
    if (!template) return;

    try {
      await deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((tmpl) => tmpl.id !== template.id));
      toast.success(t('reminderTemplates.deleted'));
    } catch (error: unknown) {
      if ((error as Error).message === 'template_in_use') {
        toast.error(t('reminderTemplates.templateInUse'));
      } else {
        console.error('Error deleting template:', error);
        toast.error(t('reminderTemplates.deleteError'));
      }
    } finally {
      setDeleteTemplateDialog({ open: false, template: null });
    }
  };

  const handleTemplateClick = (template: ReminderTemplate) => {
    const shortId = template.id.substring(0, 8);
    setEditingShortId(shortId);
  };

  const handleAddNew = () => {
    setEditingShortId('new');
  };

  // --- Reminder actions ---

  const handleDeleteReminder = async () => {
    const reminder = deleteReminderDialog.reminder;
    if (!reminder) return;

    try {
      const { error } = await supabase.from('customer_reminders').delete().eq('id', reminder.id);
      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
      toast.success(t('reminders.reminderDeleted'));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error(t('errors.generic'));
    } finally {
      setDeleteReminderDialog({ open: false, reminder: null });
    }
  };

  // --- Filtered / paginated data ---

  const filteredReminders = useMemo(() => {
    let result = reminders;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search filter
    if (remindersSearch.trim()) {
      const q = remindersSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          (r.reminder_templates?.name && r.reminder_templates.name.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [reminders, remindersSearch, statusFilter]);

  const remindersTotalPages = Math.ceil(filteredReminders.length / remindersPageSize);
  const paginatedReminders = useMemo(() => {
    const start = (remindersPage - 1) * remindersPageSize;
    return filteredReminders.slice(start, start + remindersPageSize);
  }, [filteredReminders, remindersPage, remindersPageSize]);

  const filteredTemplates = useMemo(() => {
    if (!templatesSearch.trim()) return templates;
    const q = templatesSearch.toLowerCase();
    return templates.filter((tmpl) => tmpl.name.toLowerCase().includes(q));
  }, [templates, templatesSearch]);

  const templatesTotalPages = Math.ceil(filteredTemplates.length / templatesPageSize);
  const paginatedTemplates = useMemo(() => {
    const start = (templatesPage - 1) * templatesPageSize;
    return filteredTemplates.slice(start, start + templatesPageSize);
  }, [filteredTemplates, templatesPage, templatesPageSize]);

  // Reset pages on search change
  useEffect(() => { setRemindersPage(1); }, [remindersSearch, statusFilter]);
  useEffect(() => { setTemplatesPage(1); }, [templatesSearch]);

  // Scroll helpers
  const scrollRemindersTop = useCallback(() => {
    remindersTableRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const scrollTemplatesTop = useCallback(() => {
    templatesTableRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleRemindersPageChange = useCallback((page: number) => {
    setRemindersPage(page);
    scrollRemindersTop();
  }, [scrollRemindersTop]);

  const handleRemindersPageSizeChange = useCallback((size: number) => {
    setRemindersPageSize(size);
    setRemindersPage(1);
    scrollRemindersTop();
  }, [scrollRemindersTop]);

  const handleTemplatesPageChange = useCallback((page: number) => {
    setTemplatesPage(page);
    scrollTemplatesTop();
  }, [scrollTemplatesTop]);

  const handleTemplatesPageSizeChange = useCallback((size: number) => {
    setTemplatesPageSize(size);
    setTemplatesPage(1);
    scrollTemplatesTop();
  }, [scrollTemplatesTop]);

  // --- Status badge ---
  function renderStatusBadge(status: string) {
    if (status === 'scheduled') {
      return <Badge variant="outline">{t('reminders.statusScheduled')}</Badge>;
    }
    if (status === 'sent') {
      return <Badge variant="secondary">{t('reminders.statusSent')}</Badge>;
    }
    if (status === 'failed') {
      return <Badge variant="destructive">{t('reminders.statusFailed')}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  }

  function renderChannelBadge(channel: string | null) {
    return (
      <Badge variant="outline">{channel === 'email' ? 'Email' : 'SMS'}</Badge>
    );
  }

  // --- Inline edit page ---
  if (editingShortId) {
    return (
      <ReminderTemplateEditPage
        inlineShortId={editingShortId}
        onBack={() => {
          setEditingShortId(null);
          fetchTemplates();
        }}
      />
    );
  }

  // --- Reminders tab content ---

  const renderRemindersDesktopTable = () => (
    <div ref={remindersTableRef} className="rounded-lg border border-border/50 bg-white overflow-auto flex-1 min-h-0">
      <Table wrapperClassName="overflow-visible">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">{t('reminders.tableClient')}</TableHead>
            <TableHead className="w-[140px]">{t('reminders.tablePhone')}</TableHead>
            <TableHead>{t('reminders.tableTemplate')}</TableHead>
            <TableHead className="w-[120px]">{t('reminders.tableSendDate')}</TableHead>
            <TableHead className="w-[80px]">{t('reminders.tableChannel')}</TableHead>
            <TableHead className="w-[100px]">{t('reminders.tableStatus')}</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedReminders.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell className="font-medium">{reminder.customer_name}</TableCell>
              <TableCell>{formatPhoneDisplay(reminder.customer_phone)}</TableCell>
              <TableCell>
                <span className="line-clamp-1 truncate">
                  {reminder.reminder_templates?.name ?? '—'}
                </span>
              </TableCell>
              <TableCell>{formatDate(reminder.scheduled_date)}</TableCell>
              <TableCell>{renderChannelBadge(reminder.channel)}</TableCell>
              <TableCell>{renderStatusBadge(reminder.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteReminderDialog({ open: true, reminder });
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderRemindersMobileList = () => (
    <div className="grid gap-2">
      {paginatedReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="p-4 flex items-center justify-between gap-4 transition-shadow bg-white border border-border/50 rounded-lg hover:shadow-md"
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-semibold text-sm text-foreground">{reminder.customer_name}</div>
            <div className="text-sm text-muted-foreground">{formatPhoneDisplay(reminder.customer_phone)}</div>
            {reminder.reminder_templates?.name && (
              <div className="text-xs text-muted-foreground truncate line-clamp-1">
                {reminder.reminder_templates.name}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs text-muted-foreground">{formatDate(reminder.scheduled_date)}</span>
              {renderChannelBadge(reminder.channel)}
              {renderStatusBadge(reminder.status)}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setDeleteReminderDialog({ open: true, reminder })}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );

  const renderRemindersList = () => {
    if (remindersLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (paginatedReminders.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          title={remindersSearch ? t('common.noResults') : t('reminders.noReminders')}
        />
      );
    }

    if (isMobile) {
      return (
        <>
          {renderRemindersMobileList()}
          <PaginationFooter
            currentPage={remindersPage}
            totalPages={remindersTotalPages}
            totalItems={filteredReminders.length}
            pageSize={remindersPageSize}
            onPageChange={handleRemindersPageChange}
            onPageSizeChange={handleRemindersPageSizeChange}
            itemLabel={t('reminders.itemLabelReminders')}
          />
        </>
      );
    }

    return (
      <div className={isMobile ? undefined : 'flex flex-col flex-1 min-h-0'}>
        {renderRemindersDesktopTable()}
        <div className="shrink-0 pb-2">
          <PaginationFooter
            currentPage={remindersPage}
            totalPages={remindersTotalPages}
            totalItems={filteredReminders.length}
            pageSize={remindersPageSize}
            onPageChange={handleRemindersPageChange}
            onPageSizeChange={handleRemindersPageSizeChange}
            itemLabel={t('reminders.itemLabelReminders')}
          />
        </div>
      </div>
    );
  };

  // --- Templates tab content ---

  const renderTemplatesDesktopTable = () => (
    <div ref={templatesTableRef} className="rounded-lg border border-border/50 bg-white overflow-auto flex-1 min-h-0">
      <Table wrapperClassName="overflow-visible">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('reminders.tableName')}</TableHead>
            <TableHead className="w-[120px]">{t('reminders.tableReminders')}</TableHead>
            <TableHead className="w-[100px]">{t('reminders.tableServices')}</TableHead>
            <TableHead className="w-[120px]">{t('reminders.tableChannel')}</TableHead>
            <TableHead className="w-[100px]">{t('reminders.tableClients')}</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTemplates.map((template) => (
            <TableRow
              key={template.id}
              className="cursor-pointer"
              onClick={() => handleTemplateClick(template)}
            >
              <TableCell className="font-medium">{template.name}</TableCell>
              <TableCell>{template.items.length}</TableCell>
              <TableCell>
                {template.servicesCount > 0 ? template.servicesCount : '—'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {template.sms_template && <Badge variant="outline" className="text-xs">SMS</Badge>}
                  {template.email_subject && <Badge variant="outline" className="text-xs">Email</Badge>}
                </div>
              </TableCell>
              <TableCell>
                {template.activeCustomersCount > 0 ? template.activeCustomersCount : '—'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateClick(template);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTemplateDialog({ open: true, template });
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderTemplatesMobileList = () => (
    <div className="grid gap-2">
      {paginatedTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => handleTemplateClick(template)}
          className="p-4 flex items-center justify-between gap-4 transition-shadow cursor-pointer bg-white border border-border/50 rounded-lg hover:shadow-md"
        >
          <div className="flex-1 min-w-0 space-y-1">
            <div className="font-semibold text-sm text-foreground">{template.name}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {template.items.length} {t('reminderTemplates.remindersCount')}
              </Badge>
              {template.servicesCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {template.servicesCount} {template.servicesCount === 1 ? t('reminders.serviceCount') : t('reminders.servicesCount')}
                </Badge>
              )}
              {template.sms_template && <Badge variant="outline" className="text-xs">SMS</Badge>}
              {template.email_subject && <Badge variant="outline" className="text-xs">Email</Badge>}
              {template.activeCustomersCount > 0 && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {template.activeCustomersCount}{' '}
                  {template.activeCustomersCount === 1
                    ? t('reminders.customerSingular')
                    : t('reminders.customerPlural')}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateClick(template);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTemplateDialog({ open: true, template });
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );

  const renderTemplatesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (paginatedTemplates.length === 0) {
      return (
        <EmptyState
          icon={Bell}
          title={templatesSearch ? t('common.noResults') : t('reminderTemplates.empty')}
        >
          {!templatesSearch && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('reminders.addTemplate')}
            </Button>
          )}
        </EmptyState>
      );
    }

    if (isMobile) {
      return (
        <>
          {renderTemplatesMobileList()}
          <PaginationFooter
            currentPage={templatesPage}
            totalPages={templatesTotalPages}
            totalItems={filteredTemplates.length}
            pageSize={templatesPageSize}
            onPageChange={handleTemplatesPageChange}
            onPageSizeChange={handleTemplatesPageSizeChange}
            itemLabel={t('reminders.itemLabelTemplates')}
          />
        </>
      );
    }

    return (
      <div className={isMobile ? undefined : 'flex flex-col flex-1 min-h-0'}>
        {renderTemplatesDesktopTable()}
        <div className="shrink-0 pb-2">
          <PaginationFooter
            currentPage={templatesPage}
            totalPages={templatesTotalPages}
            totalItems={filteredTemplates.length}
            pageSize={templatesPageSize}
            onPageChange={handleTemplatesPageChange}
            onPageSizeChange={handleTemplatesPageSizeChange}
            itemLabel={t('reminders.itemLabelTemplates')}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cn(isMobile ? 'space-y-4 pb-28' : 'flex flex-col h-[calc(100vh-80px)]')}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {t('reminders.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('reminders.description')}</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('reminders.addTemplate')}</span>
        </Button>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'reminders' | 'templates')}
        className={isMobile ? undefined : 'flex flex-col flex-1 min-h-0'}
      >
        <AdminTabsList className="shrink-0 mb-4">
          <AdminTabsTrigger value="reminders">{t('reminders.allReminders')}</AdminTabsTrigger>
          <AdminTabsTrigger value="templates">{t('reminders.templates')}</AdminTabsTrigger>
        </AdminTabsList>

        {/* Tab: All reminders */}
        <TabsContent
          value="reminders"
          className={isMobile ? undefined : 'data-[state=active]:flex flex-col flex-1 min-h-0'}
        >
          {/* Search + Status Filter */}
          <div className={cn('shrink-0 pb-4', isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4')}>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('reminders.searchReminders')}
                  value={remindersSearch}
                  onChange={(e) => setRemindersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'scheduled' | 'sent' | 'failed')}
              >
                <SelectTrigger className="w-[160px] bg-white shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('reminders.statusScheduled')}</SelectItem>
                  <SelectItem value="sent">{t('reminders.statusSent')}</SelectItem>
                  <SelectItem value="all">{t('reminders.statusAll')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {renderRemindersList()}
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent
          value="templates"
          className={isMobile ? undefined : 'data-[state=active]:flex flex-col flex-1 min-h-0'}
        >
          {/* Search */}
          <div className={cn('shrink-0 pb-4', isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4')}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('reminders.searchTemplates')}
                value={templatesSearch}
                onChange={(e) => setTemplatesSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {renderTemplatesList()}
        </TabsContent>
      </Tabs>

      {/* Delete reminder confirmation */}
      <ConfirmDialog
        open={deleteReminderDialog.open}
        onOpenChange={(open) => !open && setDeleteReminderDialog({ open: false, reminder: null })}
        title={t('reminders.deleteReminderTitle')}
        description={t('reminders.deleteReminderDesc', {
          name: deleteReminderDialog.reminder?.customer_name || '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteReminder}
        variant="destructive"
      />

      {/* Delete template confirmation */}
      <ConfirmDialog
        open={deleteTemplateDialog.open}
        onOpenChange={(open) => !open && setDeleteTemplateDialog({ open: false, template: null })}
        title={t('reminderTemplates.deleteConfirmTitle')}
        description={t('reminderTemplates.deleteConfirmDesc', {
          name: deleteTemplateDialog.template?.name || '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteTemplate}
        variant="destructive"
      />
    </div>
  );
}
