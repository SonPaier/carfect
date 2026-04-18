import { useTranslation } from 'react-i18next';
import { Loader2, MoreHorizontal, Trash2, Search, Bell } from 'lucide-react';
import { Button, Badge, Input, cn } from '@shared/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  PaginationFooter,
} from '@shared/ui';
import { useIsMobile, EmptyState } from '@shared/ui';
import { formatPhoneDisplay } from '@shared/utils';
import { ConfirmDialog } from '@shared/ui';
import { useState } from 'react';
import type { CustomerReminder } from '@/hooks/useRemindersList';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === 'scheduled') return <Badge variant="outline">{t('reminders.statusScheduled')}</Badge>;
  if (status === 'sent') return <Badge variant="secondary">{t('reminders.statusSent')}</Badge>;
  if (status === 'failed') return <Badge variant="destructive">{t('reminders.statusFailed')}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function ChannelBadge({ channel }: { channel: string | null }) {
  return <Badge variant="outline">{channel === 'email' ? 'Email' : 'SMS'}</Badge>;
}

interface ReminderListTabProps {
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'scheduled' | 'sent';
  onStatusFilterChange: (value: 'all' | 'scheduled' | 'sent') => void;
  paginated: CustomerReminder[];
  filtered: CustomerReminder[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onDelete: (id: string) => Promise<void>;
  pageSize: number;
}

export function ReminderListTab({
  loading, search, onSearchChange, statusFilter, onStatusFilterChange,
  paginated, filtered, page, totalPages, onPageChange, onPageSizeChange,
  tableRef, onDelete, pageSize,
}: ReminderListTabProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; reminder: CustomerReminder | null }>({
    open: false, reminder: null,
  });

  const handleConfirmDelete = async () => {
    if (!deleteDialog.reminder) return;
    await onDelete(deleteDialog.reminder.id);
    setDeleteDialog({ open: false, reminder: null });
  };

  const renderDeleteMenu = (reminder: CustomerReminder) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, reminder }); }}
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
        <EmptyState
          icon={Bell}
          title={search ? t('common.noResults') : t('reminders.noReminders')}
        />
      );
    }

    if (isMobile) {
      return (
        <>
          <div className="grid gap-2">
            {paginated.map((reminder) => (
              <div
                key={reminder.id}
                className="p-4 flex items-center justify-between gap-4 transition-shadow bg-white border border-border/50 rounded-lg hover:shadow-md"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-semibold text-sm text-foreground">{reminder.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{formatPhoneDisplay(reminder.customer_phone)}</div>
                  {reminder.reminder_templates?.name && (
                    <div className="text-xs text-muted-foreground truncate">{reminder.reminder_templates.name}</div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-xs text-muted-foreground">{formatDate(reminder.scheduled_date)}</span>
                    <ChannelBadge channel={reminder.channel} />
                    <StatusBadge status={reminder.status} />
                  </div>
                </div>
                {renderDeleteMenu(reminder)}
              </div>
            ))}
          </div>
          <PaginationFooter
            currentPage={page} totalPages={totalPages} totalItems={filtered.length}
            pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
            itemLabel={t('reminders.itemLabelReminders')}
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
              {paginated.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">{reminder.customer_name}</TableCell>
                  <TableCell>{formatPhoneDisplay(reminder.customer_phone)}</TableCell>
                  <TableCell><span className="truncate">{reminder.reminder_templates?.name ?? '—'}</span></TableCell>
                  <TableCell>{formatDate(reminder.scheduled_date)}</TableCell>
                  <TableCell><ChannelBadge channel={reminder.channel} /></TableCell>
                  <TableCell><StatusBadge status={reminder.status} /></TableCell>
                  <TableCell>{renderDeleteMenu(reminder)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="shrink-0 pb-2">
          <PaginationFooter
            currentPage={page} totalPages={totalPages} totalItems={filtered.length}
            pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
            itemLabel={t('reminders.itemLabelReminders')}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Search + Status Filter */}
      <div className={cn('shrink-0 pb-4', isMobile && 'sticky top-0 z-20 bg-background -mx-4 px-4')}>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('reminders.searchReminders')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as 'all' | 'scheduled' | 'sent')}>
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

      {renderContent()}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, reminder: null })}
        title={t('reminders.deleteReminderTitle')}
        description={t('reminders.deleteReminderDesc', { name: deleteDialog.reminder?.customer_name || '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </>
  );
}
