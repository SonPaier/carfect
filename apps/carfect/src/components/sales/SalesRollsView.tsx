import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
import { ConfirmDialog } from '@shared/ui';
import { useAuth } from '@/hooks/useAuth';
import type { SalesRoll } from './types/rolls';
import { formatRollSize, formatMbM2Lines } from './types/rolls';
import { fetchRolls, deleteRoll } from './services/rollService';
import AddEditRollDrawer from './rolls/AddEditRollDrawer';
import RollScanDrawer from './rolls/RollScanDrawer';
import RollDetailsDrawer from './rolls/RollDetailsDrawer';

type TabType = 'active' | 'sold';
type SortColumn = 'productName' | 'productCode' | 'widthMm' | 'remainingMb' | 'deliveryDate';
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
    } catch (err: any) {
      toast.error('Błąd ładowania rolek: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [instanceId, activeTab]);

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
        (r.barcode || '').includes(q),
    );
  }, [rolls, searchQuery]);

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
        case 'deliveryDate':
          cmp = (a.deliveryDate || '').localeCompare(b.deliveryDate || '');
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
      toast.success('Rolka usunięta');
      loadRolls();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteConfirm({ open: false, rollId: '', rollName: '' });
    }
  };

  const handleEditClick = (roll: SalesRoll) => {
    setEditRoll(roll);
    setEditDrawerOpen(true);
  };

  const handleAddManual = () => {
    setEditRoll(null);
    setEditDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-foreground">Ewidencja rolek</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddManual}>
            <Plus className="w-4 h-4" />
            Dodaj ręcznie
          </Button>
          <Button size="sm" onClick={() => setScanDrawerOpen(true)}>
            <ScanLine className="w-4 h-4" />
            Skanuj rolki
          </Button>
        </div>
      </div>

      {/* Search + Status filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie, kodzie, barcode..."
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
              Na stanie
              {rolls.length > 0 && activeTab === 'active' ? ` (${filteredRolls.length})` : ''}
            </SelectItem>
            <SelectItem value="sold">Sprzedane</SelectItem>
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
                Produkt <SortIcon col="productName" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('productCode')}
              >
                Kod <SortIcon col="productCode" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('widthMm')}
              >
                Rozmiar <SortIcon col="widthMm" />
              </TableHead>
              <TableHead>Na stanie</TableHead>
              <TableHead>Zużyto</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('remainingMb')}
              >
                Pozostało <SortIcon col="remainingMb" />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('deliveryDate')}
              >
                Data dostawy <SortIcon col="deliveryDate" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Ładowanie...
                </TableCell>
              </TableRow>
            ) : paginatedRolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={Disc}
                    title={
                      searchQuery
                        ? 'Brak wyników wyszukiwania'
                        : activeTab === 'active'
                          ? 'Brak rolek na stanie'
                          : 'Brak sprzedanych rolek'
                    }
                    description={
                      searchQuery
                        ? 'Spróbuj zmienić kryteria wyszukiwania'
                        : 'Dodaj pierwszą rolkę do ewidencji'
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
                  <TableCell className="text-sm whitespace-nowrap">
                    <MbM2Display mb={roll.initialLengthM} widthMm={roll.widthMm} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    <MbM2Display mb={roll.currentUsageMb || 0} widthMm={roll.widthMm} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <MbM2Display
                      mb={roll.remainingMb || 0}
                      widthMm={roll.widthMm}
                      className={`font-medium ${
                        (roll.remainingMb || 0) <= 0
                          ? 'text-destructive'
                          : (roll.remainingMb || 0) < roll.initialLengthM * 0.2
                            ? 'text-orange-500'
                            : 'text-green-600'
                      }`}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {roll.deliveryDate ? format(parseISO(roll.deliveryDate), 'dd.MM.yyyy') : '—'}
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
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDetailsRoll(roll);
                            setDetailsDrawerOpen(true);
                          }}
                        >
                          Szczegóły
                        </DropdownMenuItem>
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
                          Usuń
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
            {filteredRolls.length} {filteredRolls.length === 1 ? 'rolka' : 'rolek'}
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
        instanceId={instanceId}
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
        onEdit={handleEditClick}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Usuń rolkę"
        description={`Czy na pewno chcesz usunąć rolkę "${deleteConfirm.rollName}"? Tej operacji nie można cofnąć.`}
        onConfirm={handleDelete}
        confirmLabel="Usuń"
        variant="destructive"
      />
    </div>
  );
};

export default SalesRollsView;
