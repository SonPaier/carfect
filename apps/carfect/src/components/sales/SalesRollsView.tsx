import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Plus, ScanLine, MoreHorizontal, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input, Button, Badge } from '@shared/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { ConfirmDialog } from '@shared/ui';
import { useAuth } from '@/hooks/useAuth';
import type { SalesRoll } from './types/rolls';
import { formatRollSize, formatMbM2 } from './types/rolls';
import { fetchRolls, deleteRoll, archiveRoll, restoreRoll } from './services/rollService';
import AddEditRollDrawer from './rolls/AddEditRollDrawer';
import RollScanDrawer from './rolls/RollScanDrawer';
import RollUsageDrawer from './rolls/RollUsageDrawer';

type TabType = 'active' | 'archived';
type SortColumn = 'productName' | 'productCode' | 'barcode' | 'widthMm' | 'remainingMb' | 'deliveryDate';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

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
  const [usageDrawerOpen, setUsageDrawerOpen] = useState(false);
  const [usageRoll, setUsageRoll] = useState<SalesRoll | null>(null);

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
        (r.barcode || '').includes(q)
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
        case 'barcode':
          cmp = (a.barcode || '').localeCompare(b.barcode || '');
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
    currentPage * ITEMS_PER_PAGE
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

  const handleArchive = async (roll: SalesRoll) => {
    try {
      await archiveRoll(roll.id);
      toast.success('Rolka zarchiwizowana');
      loadRolls();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRestore = async (roll: SalesRoll) => {
    try {
      await restoreRoll(roll.id);
      toast.success('Rolka przywrócona na stan');
      loadRolls();
    } catch (err: any) {
      toast.error(err.message);
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
        <h2 className="text-xl font-semibold">Ewidencja rolek</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddManual}>
            <Plus className="w-4 h-4 mr-1" />
            Dodaj ręcznie
          </Button>
          <Button size="sm" onClick={() => setScanDrawerOpen(true)}>
            <ScanLine className="w-4 h-4 mr-1" />
            Skanuj rolki
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Na stanie
          {activeTab === 'active' && rolls.length > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {filteredRolls.length}
            </Badge>
          )}
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'archived'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('archived')}
        >
          Archiwum
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj po nazwie, kodzie, barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
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
                onClick={() => handleSort('barcode')}
              >
                Kod kreskowy <SortIcon col="barcode" />
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
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Ładowanie...
                </TableCell>
              </TableRow>
            ) : paginatedRolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'Brak wyników wyszukiwania'
                    : activeTab === 'active'
                    ? 'Brak rolek na stanie'
                    : 'Archiwum jest puste'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRolls.map((roll) => (
                <TableRow key={roll.id}>
                  <TableCell>
                    <div className="font-medium">{roll.productName}</div>
                    <div className="text-xs text-muted-foreground">{roll.brand}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {roll.productCode || '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {roll.barcode || '—'}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatRollSize(roll.widthMm, roll.initialLengthM)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatMbM2(roll.initialLengthM, roll.widthMm)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatMbM2(roll.currentUsageMb || 0, roll.widthMm)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`text-sm font-medium ${
                        (roll.remainingMb || 0) <= 0
                          ? 'text-destructive'
                          : (roll.remainingMb || 0) < roll.initialLengthM * 0.2
                          ? 'text-orange-500'
                          : 'text-green-600'
                      }`}
                    >
                      {formatMbM2(roll.remainingMb || 0, roll.widthMm)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {roll.deliveryDate
                      ? format(parseISO(roll.deliveryDate), 'dd.MM.yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
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
                        <DropdownMenuItem onClick={() => { setUsageRoll(roll); setUsageDrawerOpen(true); }}>
                          Zobacz zużycie
                        </DropdownMenuItem>
                        {activeTab === 'active' ? (
                          <DropdownMenuItem onClick={() => handleArchive(roll)}>
                            Archiwizuj
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleRestore(roll)}>
                            Przywróć na stan
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

      <RollUsageDrawer
        open={usageDrawerOpen}
        onOpenChange={setUsageDrawerOpen}
        roll={usageRoll}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((prev) => ({ ...prev, open }))
        }
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
