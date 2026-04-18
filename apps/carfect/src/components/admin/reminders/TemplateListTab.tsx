import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2, MoreHorizontal, Trash2, Users, Bell, Search, Pencil } from 'lucide-react';
import { Button, Badge, Input, cn } from '@shared/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  PaginationFooter,
} from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import { useIsMobile, EmptyState } from '@shared/ui';
import type { TemplateWithCount, ReminderTemplate } from '@/hooks/useTemplatesList';

interface TemplateListTabProps {
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  paginated: TemplateWithCount[];
  filtered: TemplateWithCount[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onTemplateClick: (template: ReminderTemplate) => void;
  onDelete: (templateId: string) => Promise<void>;
  onAddNew: () => void;
  pageSize: number;
}

export function TemplateListTab({
  loading, search, onSearchChange, paginated, filtered,
  page, totalPages, onPageChange, onPageSizeChange,
  tableRef, onTemplateClick, onDelete, onAddNew, pageSize,
}: TemplateListTabProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: ReminderTemplate | null }>({
    open: false, template: null,
  });

  const handleConfirmDelete = async () => {
    if (!deleteDialog.template) return;
    await onDelete(deleteDialog.template.id);
    setDeleteDialog({ open: false, template: null });
  };

  const renderMenu = (template: TemplateWithCount) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTemplateClick(template); }}>
          <Pencil className="h-4 w-4 mr-2" />
          {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, template }); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (paginated.length === 0) {
      return (
        <EmptyState icon={Bell} title={search ? t('common.noResults') : t('reminderTemplates.empty')}>
          {!search && (
            <Button onClick={onAddNew} className="gap-2">
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
          <div className="grid gap-2">
            {paginated.map((template) => (
              <div
                key={template.id}
                onClick={() => onTemplateClick(template)}
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
                        {template.activeCustomersCount === 1 ? t('reminders.customerSingular') : t('reminders.customerPlural')}
                      </Badge>
                    )}
                  </div>
                </div>
                {renderMenu(template)}
              </div>
            ))}
          </div>
          <PaginationFooter
            currentPage={page} totalPages={totalPages} totalItems={filtered.length}
            pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
            itemLabel={t('reminders.itemLabelTemplates')}
          />
        </>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div ref={tableRef} className="rounded-lg border border-border/50 bg-white overflow-auto flex-1 min-h-0">
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
              {paginated.map((template) => (
                <TableRow key={template.id} className="cursor-pointer" onClick={() => onTemplateClick(template)}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.items.length}</TableCell>
                  <TableCell>{template.servicesCount > 0 ? template.servicesCount : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {template.sms_template && <Badge variant="outline" className="text-xs">SMS</Badge>}
                      {template.email_subject && <Badge variant="outline" className="text-xs">Email</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{template.activeCustomersCount > 0 ? template.activeCustomersCount : '—'}</TableCell>
                  <TableCell>{renderMenu(template)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="shrink-0 pb-2">
          <PaginationFooter
            currentPage={page} totalPages={totalPages} totalItems={filtered.length}
            pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
            itemLabel={t('reminders.itemLabelTemplates')}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Search */}
      <div className={cn('shrink-0 pb-4', isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4')}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('reminders.searchTemplates')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {renderContent()}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, template: null })}
        title={t('reminderTemplates.deleteConfirmTitle')}
        description={t('reminderTemplates.deleteConfirmDesc', { name: deleteDialog.template?.name || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </>
  );
}
