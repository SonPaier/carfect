import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Plus,
  ScanLine,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Disc,
  BarChart3,
  X,
  Users,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Input,
  Button,
  Badge,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { ConfirmDialog, Sheet, SheetContent, SheetHeader, SheetTitle } from '@shared/ui';
import { useAuth } from '@/hooks/useAuth';
import type { SalesRoll } from './types/rolls';
import { formatRollSize, formatMbM2Lines, mbToM2 } from './types/rolls';
import {
  fetchRolls,
  fetchRollById,
  deleteRoll,
  archiveRoll,
  restoreRoll,
} from './services/rollService';
import AddEditRollDrawer from './rolls/AddEditRollDrawer';
import RollScanDrawer from './rolls/RollScanDrawer';
import RollDetailsDrawer from './rolls/RollDetailsDrawer';
import EmployeeRollsDrawer from './rolls/EmployeeRollsDrawer';

type TabType = 'active' | 'sold';
type SortColumn = 'productName' | 'productCode' | 'widthMm' | 'remainingMb' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const MbM2Display = ({
  mb,
  widthMm,
  className,
}: {
  mb: number;
  widthMm: number;
  className?: string;
}) => {
  const f = formatMbM2Lines(mb, widthMm);
  return (
    <div className={className}>
      <div className="text-sm">{f.mb}</div>
      <div className="text-xs text-muted-foreground">{f.m2}</div>
    </div>
  );
};

const SalesRollsView = () => {
  const { t } = useTranslation();
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;

  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [rolls, setRolls] = useState<SalesRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>('productName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Drawers
  const [scanDrawerOpen, setScanDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editRoll, setEditRoll] = useState<SalesRoll | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [detailsRoll, setDetailsRoll] = useState<SalesRoll | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [employeeDrawerOpen, setEmployeeDrawerOpen] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    rollId: string;
    rollName: string;
  }>({ open: false, rollId: '', rollName: '' });

  const loadRolls = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const data = await fetchRolls(instanceId, activeTab);
      setRolls(data);
    } catch (err: unknown) {
      toast.error(t('sales.rolls.toastLoadError', { message: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [instanceId, activeTab, t]);

  useEffect(() => {
    loadRolls();
  }, [loadRolls]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Filter
  const filteredRolls = useMemo(() => {
    if (!searchQuery.trim()) return rolls;
    const q = searchQuery.toLowerCase();
    return rolls.filter(
      (r) =>
        r.brand.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q) ||
        (r.productCode || '').toLowerCase().includes(q) ||
        (r.barcode || '').includes(q) ||
        (r.customerNames || []).some((name) => name.toLowerCase().includes(q)),
    );
  }, [rolls, searchQuery]);

  // Summary grouped by product name + width variant
  const summary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        widthMm: number;
        count: number;
        unopened: number;
        totalRemainingMb: number;
        totalRemainingM2: number;
      }
    >();
    let totalUnopened = 0;

    for (const r of rolls) {
      const key = `${r.productName}::${r.widthMm}`;
      const remainingMb = r.remainingMb ?? r.lengthM;
      const remainingM2 = mbToM2(remainingMb, r.widthMm);
      const isUnopened = remainingMb >= r.lengthM && (r.currentUsageMb ?? 0) === 0;

      if (isUnopened) totalUnopened++;

      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        prev.unopened += isUnopened ? 1 : 0;
        prev.totalRemainingMb += remainingMb;
        prev.totalRemainingM2 += remainingM2;
      } else {
        map.set(key, {
          name: r.productName,
          widthMm: r.widthMm,
          count: 1,
          unopened: isUnopened ? 1 : 0,
          totalRemainingMb: remainingMb,
          totalRemainingM2: remainingM2,
        });
      }
    }
    const rows = [...map.values()]
      .map((v) => ({
        name: v.name,
        widthMm: v.widthMm,
        count: v.count,
        unopened: v.unopened,
        opened: v.count - v.unopened,
        remainingMb: v.totalRemainingMb,
        remainingM2: v.totalRemainingM2,
      }))
      .sort((a, b) => b.remainingMb - a.remainingMb || a.name.localeCompare(b.name));

    const totalCount = rolls.length;
    const totalM2 = rows.reduce((sum, r) => sum + r.remainingM2, 0);
    const totalMb = rows.reduce((sum, r) => sum + r.remainingMb, 0);
    return { rows, totalCount, totalM2, totalMb, totalUnopened };
  }, [rolls]);

  // Sort
  const sortedRolls = useMemo(() => {
    const sorted = [...filteredRolls];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'productName':
          cmp = `${a.brand} ${a.productName}`.localeCompare(`${b.brand} ${b.productName}`);
          break;
        case 'productCode':
          cmp = (a.productCode || '').localeCompare(b.productCode || '');
          break;
        case 'widthMm':
          cmp = a.widthMm - b.widthMm;
          break;
        case 'remainingMb':
          cmp = (a.remainingMb || 0) - (b.remainingMb || 0);
          break;
        case 'createdAt':
          cmp = (a.createdAt || '').localeCompare(b.createdAt || '');
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRolls, sortColumn, sortDirection]);

  // Paginate
  const totalPages = Math.ceil(sortedRolls.length / ITEMS_PER_PAGE);
  const paginatedRolls = sortedRolls.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortColumn !== col) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 inline ml-1" />
    );
  };

  const handleDelete = async () => {
    try {
      await deleteRoll(deleteConfirm.rollId);
      toast.success(t('sales.rolls.toastDeleted'));
      loadRolls();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDeleteConfirm({ open: false, rollId: '', rollName: '' });
    }
  };

  const handleEditClick = (roll: SalesRoll) => {
    setEditRoll(roll);
    setEditDrawerOpen(true);
  };

  const handleArchive = async (roll: SalesRoll) => {
    try {
      await archiveRoll(roll.id);
      toast.success(t('sales.rolls.toastArchived'));
      loadRolls();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleRestore = async (roll: SalesRoll) => {
    try {
      await restoreRoll(roll.id);
      toast.success(t('sales.rolls.toastRestored'));
      loadRolls();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleAddManual = () => {
    setEditRoll(null);
    setEditDrawerOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0 pb-4">
        <h2 className="text-xl font-semibold text-foreground">{t('sales.rolls.title')}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSummaryOpen(true)}>
            <BarChart3 className="w-4 h-4" />
            {t('sales.rolls.viewStates')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEmployeeDrawerOpen(true)}>
            <Users className="w-4 h-4 mr-1" />
            {t('sales.rolls.employeesAndRolls')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddManual}>
            <Plus className="w-4 h-4" />
            {t('sales.rolls.addManual')}
          </Button>
          <Button size="sm" onClick={() => setScanDrawerOpen(true)}>
            <ScanLine className="w-4 h-4" />
            {t('sales.rolls.scanRolls')}
          </Button>
        </div>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search + Status filter */}
      <div className="flex items-center gap-4 shrink-0 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('sales.rolls.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              {t('sales.rolls.statusActive')}
              {rolls.length > 0 && activeTab === 'active' ? ` (${filteredRolls.length})` : ''}
            </SelectItem>
            <SelectItem value="sold">{t('sales.rolls.statusSold')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('productName')}
              >
                {t('sales.rolls.colProduct')} <SortIcon col="productName" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('productCode')}
              >
                {t('sales.rolls.colCode')} <SortIcon col="productCode" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('widthMm')}
              >
                {t('sales.rolls.colSize')} <SortIcon col="widthMm" />
              </TableHead>
              <TableHead>{t('sales.rolls.colInStock')}</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                {t('sales.rolls.colAdded')} <SortIcon col="createdAt" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {t('sales.rolls.loading')}
                </TableCell>
              </TableRow>
            ) : paginatedRolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Disc}
                    title={
                      searchQuery
                        ? t('sales.rolls.emptySearchTitle')
                        : activeTab === 'active'
                          ? t('sales.rolls.emptyActiveTitle')
                          : t('sales.rolls.emptySoldTitle')
                    }
                    description={
                      searchQuery
                        ? t('sales.rolls.emptySearchDesc')
                        : t('sales.rolls.emptyFirstRollDesc')
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedRolls.map((roll) => (
                <TableRow
                  key={roll.id}
                  className="cursor-pointer hover:bg-hover-strong"
                  onClick={() => {
                    setDetailsRoll(roll);
                    setDetailsDrawerOpen(true);
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{roll.productName}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{roll.productCode || '—'}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatRollSize(roll.widthMm, roll.initialLengthM)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <MbM2Display
                      mb={roll.remainingMb || 0}
                      widthMm={roll.widthMm}
                      className={`font-medium ${
                        (roll.remainingMb || 0) <= 0
                          ? 'text-destructive'
                          : (roll.remainingMb || 0) < roll.initialRemainingMb * 0.2
                            ? 'text-orange-500'
                            : 'text-green-600'
                      }`}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{format(parseISO(roll.createdAt), 'dd.MM.yyyy')}</div>
                    {roll.createdByName && (
                      <div className="text-xs text-muted-foreground">{roll.createdByName}</div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(roll)}>
                          {t('sales.rolls.actionEdit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDetailsRoll(roll);
                            setDetailsDrawerOpen(true);
                          }}
                        >
                          {t('sales.rolls.actionDetails')}
                        </DropdownMenuItem>
                        {activeTab === 'active' && (
                          <DropdownMenuItem onClick={() => handleArchive(roll)}>
                            {t('sales.rolls.actionMarkUsed')}
                          </DropdownMenuItem>
                        )}
                        {activeTab === 'sold' && (
                          <DropdownMenuItem onClick={() => handleRestore(roll)}>
                            {t('sales.rolls.actionRestore')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              rollId: roll.id,
                              rollName: `${roll.brand} ${roll.productName}`,
                            })
                          }
                        >
                          {t('sales.rolls.actionDelete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredRolls.length}{' '}
            {filteredRolls.length === 1
              ? t('sales.rolls.paginationRollSingular')
              : t('sales.rolls.paginationRollPlural')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Drawers */}
      <RollScanDrawer
        open={scanDrawerOpen}
        onOpenChange={setScanDrawerOpen}
        instanceId={instanceId!}
        onSaved={loadRolls}
      />

      <AddEditRollDrawer
        open={editDrawerOpen}
        onOpenChange={setEditDrawerOpen}
        instanceId={instanceId}
        roll={editRoll}
        onSaved={loadRolls}
      />

      <RollDetailsDrawer
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        roll={detailsRoll}
        instanceId={instanceId ?? ''}
        onEdit={handleEditClick}
        onUsageChange={async () => {
          loadRolls();
          if (detailsRoll) {
            const updated = await fetchRollById(detailsRoll.id);
            if (updated) setDetailsRoll(updated);
          }
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={t('sales.rolls.deleteTitle')}
        description={t('sales.rolls.deleteDescription', { name: deleteConfirm.rollName })}
        onConfirm={handleDelete}
        confirmLabel={t('sales.rolls.deleteConfirmLabel')}
        variant="destructive"
      />

      <EmployeeRollsDrawer
        open={employeeDrawerOpen}
        onClose={() => setEmployeeDrawerOpen(false)}
        instanceId={instanceId ?? ''}
      />

      {/* Summary drawer */}
      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent
          side="right"
          className="w-[80vw] sm:max-w-[80vw] flex flex-col bg-white p-0 gap-0"
          hideCloseButton
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 py-4 border-b shrink-0">
            <SheetTitle>{t('sales.rolls.summaryTitle')}</SheetTitle>
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="p-2 rounded-full bg-white hover:bg-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>

          <div className="flex gap-3 text-sm px-6 py-4 shrink-0 flex-wrap">
            <div className="bg-gray-50 border rounded-lg px-4 py-2">
              <div className="text-muted-foreground">{t('sales.rolls.summaryRolls')}</div>
              <div className="text-lg font-semibold">{summary.totalCount}</div>
            </div>
            <div className="bg-gray-50 border rounded-lg px-4 py-2">
              <div className="text-muted-foreground">{t('sales.rolls.summaryUnopened')}</div>
              <div className="text-lg font-semibold">{summary.totalUnopened}</div>
            </div>
            <div className="bg-gray-50 border rounded-lg px-4 py-2">
              <div className="text-muted-foreground">{t('sales.rolls.summaryRemainingMb')}</div>
              <div className="text-lg font-semibold">{summary.totalMb.toFixed(1)}</div>
            </div>
            <div className="bg-gray-50 border rounded-lg px-4 py-2">
              <div className="text-muted-foreground">{t('sales.rolls.summaryRemainingM2')}</div>
              <div className="text-lg font-semibold">{summary.totalM2.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>{t('sales.rolls.summaryColProduct')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColWidth')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColRolls')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColUnopened')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColOpened')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColRemainingMb')}</TableHead>
                    <TableHead className="text-right">{t('sales.rolls.summaryColRemainingM2')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.rows.map((row) => (
                    <TableRow key={`${row.name}-${row.widthMm}`}>
                      <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {row.widthMm}mm
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{row.unopened}</TableCell>
                      <TableCell className="text-right">{row.opened}</TableCell>
                      <TableCell className="text-right">{row.remainingMb.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{row.remainingM2.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default SalesRollsView;
