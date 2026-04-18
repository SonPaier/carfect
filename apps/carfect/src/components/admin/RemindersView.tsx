import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import ReminderTemplateEditPage from '@/pages/ReminderTemplateEditPage';
import { Button, cn } from '@shared/ui';
import { useIsMobile } from '@shared/ui';
import { Tabs, TabsContent } from '@shared/ui';
import { AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminTabsList';
import { useRemindersList } from '@/hooks/useRemindersList';
import { useTemplatesList } from '@/hooks/useTemplatesList';
import { ReminderListTab } from './reminders/ReminderListTab';
import { TemplateListTab } from './reminders/TemplateListTab';
import type { ReminderTemplate } from '@/hooks/useTemplatesList';

interface RemindersViewProps {
  instanceId: string | null;
  onNavigateBack?: () => void;
}

export default function RemindersView({ instanceId }: RemindersViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<'reminders' | 'templates'>('reminders');
  const [editingShortId, setEditingShortId] = useState<string | null>(null);

  const reminders = useRemindersList(instanceId);
  const templates = useTemplatesList(instanceId);

  const handleTemplateClick = (template: ReminderTemplate) => {
    setEditingShortId(template.id.substring(0, 8));
  };

  const handleAddNew = () => {
    setEditingShortId('new');
  };

  if (editingShortId) {
    return (
      <ReminderTemplateEditPage
        inlineShortId={editingShortId}
        onBack={() => {
          setEditingShortId(null);
          templates.refetch();
        }}
      />
    );
  }

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

        <TabsContent
          value="reminders"
          className={isMobile ? undefined : 'data-[state=active]:flex flex-col flex-1 min-h-0'}
        >
          <ReminderListTab
            loading={reminders.loading}
            search={reminders.search}
            onSearchChange={reminders.setSearch}
            statusFilter={reminders.statusFilter}
            onStatusFilterChange={reminders.setStatusFilter}
            paginated={reminders.paginated}
            filtered={reminders.filtered}
            page={reminders.page}
            totalPages={reminders.totalPages}
            onPageChange={reminders.handlePageChange}
            onPageSizeChange={reminders.handlePageSizeChange}
            tableRef={reminders.tableRef}
            onDelete={reminders.deleteReminder}
            pageSize={25}
          />
        </TabsContent>

        <TabsContent
          value="templates"
          className={isMobile ? undefined : 'data-[state=active]:flex flex-col flex-1 min-h-0'}
        >
          <TemplateListTab
            loading={templates.loading}
            search={templates.search}
            onSearchChange={templates.setSearch}
            paginated={templates.paginated}
            filtered={templates.filtered}
            page={templates.page}
            totalPages={templates.totalPages}
            onPageChange={templates.handlePageChange}
            onPageSizeChange={templates.handlePageSizeChange}
            tableRef={templates.tableRef}
            onTemplateClick={handleTemplateClick}
            onDelete={templates.handleDeleteTemplate}
            onAddNew={handleAddNew}
            pageSize={25}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
