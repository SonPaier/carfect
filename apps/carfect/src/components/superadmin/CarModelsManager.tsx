import React, { useState, useMemo, useEffect } from 'react';
import { useCarModels } from '@/contexts/CarModelsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Card, CardContent, CardHeader } from '@shared/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { Badge } from '@shared/ui';
import { toast } from 'sonner';
import { Plus, Search, Upload, Download, Pencil, Trash2, Loader2, Car, Check, X, Clock } from 'lucide-react';
import { AddCarModelDialog } from './AddCarModelDialog';
import { EditCarModelDialog } from './EditCarModelDialog';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 20;

interface CarModelWithStatus {
  id: string;
  brand: string;
  name: string;
  size: string;
  status: string;
  created_at: string;
}

export const CarModelsManager: React.FC = () => {
  const { t } = useTranslation();
  const { carModels, isLoading, refetch } = useCarModels();
  const [allModels, setAllModels] = useState<CarModelWithStatus[]>([]);
  const [loadingAllModels, setLoadingAllModels] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'proposal' | 'all'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<{ id: string; brand: string; name: string; size: string } | null>(null);

  // Fetch all models including proposals for super admin
  const fetchAllModels = async () => {
    setLoadingAllModels(true);
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, brand, name, size, status, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllModels((data || []) as CarModelWithStatus[]);
    } catch (error) {
      console.error('Error fetching all models:', error);
    } finally {
      setLoadingAllModels(false);
    }
  };

  useEffect(() => {
    fetchAllModels();
  }, []);

  // carModels is used to keep the context fresh after mutations
  void carModels;

  const proposalCount = useMemo(() =>
    allModels.filter(m => m.status === 'proposal').length,
    [allModels]
  );

  const brands = useMemo(() => {
    const uniqueBrands = new Set(allModels.map(m => m.brand));
    return Array.from(uniqueBrands).sort();
  }, [allModels]);

  const filteredModels = useMemo(() => {
    return allModels.filter(model => {
      // Status filter
      if (statusFilter !== 'all' && model.status !== statusFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBrand = model.brand.toLowerCase().includes(query);
        const matchesName = model.name.toLowerCase().includes(query);
        if (!matchesBrand && !matchesName) return false;
      }

      // Brand filter
      if (brandFilter !== 'all' && model.brand !== brandFilter) return false;

      // Size filter
      if (sizeFilter !== 'all' && model.size !== sizeFilter) return false;

      return true;
    });
  }, [allModels, searchQuery, brandFilter, sizeFilter, statusFilter]);

  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredModels.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredModels, currentPage]);

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);

  const handleImportFromJson = async () => {
    try {
      setIsImporting(true);
      const { data, error } = await supabase.functions.invoke('seed-car-models');

      if (error) throw error;

      toast.success(t('superAdmin.carModels.importSuccess', { inserted: data.inserted, skipped: data.skipped }));
      await refetch();
      await fetchAllModels();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('superAdmin.carModels.importError'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportToCsv = () => {
    const headers = [
      t('superAdmin.carModels.brand'),
      t('superAdmin.carModels.model'),
      t('superAdmin.carModels.size'),
    ];
    const activeModels = allModels.filter(m => m.status === 'active');
    const rows = activeModels.map(m => [m.brand, m.name, m.size]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `samochody_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(t('superAdmin.carModels.exportSuccess'));
  };

  const handleDeleteModel = async (id: string, brand: string, name: string) => {
    if (!confirm(t('superAdmin.carModels.deleteConfirm', { brand, name }))) return;

    try {
      const { error } = await supabase
        .from('car_models')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('superAdmin.carModels.deleteSuccess', { brand, name }));
      await refetch();
      await fetchAllModels();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('superAdmin.carModels.deleteError'));
    }
  };

  const handleAcceptProposal = async (model: CarModelWithStatus) => {
    try {
      const { error } = await supabase
        .from('car_models')
        .update({ status: 'active' })
        .eq('id', model.id);

      if (error) throw error;

      toast.success(t('superAdmin.carModels.acceptSuccess', { brand: model.brand, name: model.name }));
      await refetch();
      await fetchAllModels();
    } catch (error) {
      console.error('Accept error:', error);
      toast.error(t('superAdmin.carModels.acceptError'));
    }
  };

  const handleRejectProposal = async (model: CarModelWithStatus) => {
    try {
      const { error } = await supabase
        .from('car_models')
        .update({ active: false })
        .eq('id', model.id);

      if (error) throw error;

      toast.success(t('superAdmin.carModels.rejectSuccess', { brand: model.brand, name: model.name }));
      await fetchAllModels();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(t('superAdmin.carModels.rejectError'));
    }
  };

  const getSizeBadgeVariant = (size: string) => {
    switch (size) {
      case 'S': return 'secondary';
      case 'M': return 'default';
      case 'L': return 'destructive';
      default: return 'outline';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'S': return t('superAdmin.carModels.sizeSmall');
      case 'M': return t('superAdmin.carModels.sizeMedium');
      case 'L': return t('superAdmin.carModels.sizeLarge');
      default: return size;
    }
  };

  if (isLoading || loadingAllModels) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">{t('superAdmin.carModels.title')}</h2>
          <Badge variant="outline" className="ml-2">
            {t('superAdmin.carModels.modelsCount', { count: allModels.filter(m => m.status === 'active').length })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportFromJson}
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {t('superAdmin.carModels.importJson')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            {t('superAdmin.carModels.exportCsv')}
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('superAdmin.carModels.addModel')}
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
        >
          {t('superAdmin.carModels.approved')}
        </Button>
        <Button
          variant={statusFilter === 'proposal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setStatusFilter('proposal'); setCurrentPage(1); }}
          className="relative"
        >
          <Clock className="h-4 w-4 mr-2" />
          {t('superAdmin.carModels.pendingApproval')}
          {proposalCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1.5">
              {proposalCount}
            </Badge>
          )}
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
        >
          {t('superAdmin.carModels.all')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('superAdmin.carModels.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
              />
            </div>
            <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('superAdmin.carModels.brand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('superAdmin.carModels.allBrands')}</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sizeFilter} onValueChange={(v) => { setSizeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('superAdmin.carModels.size')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('superAdmin.carModels.allSizes')}</SelectItem>
                <SelectItem value="S">{t('superAdmin.carModels.smallSize')}</SelectItem>
                <SelectItem value="M">{t('superAdmin.carModels.mediumSize')}</SelectItem>
                <SelectItem value="L">{t('superAdmin.carModels.largeSize')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('superAdmin.carModels.brand')}</TableHead>
                <TableHead>{t('superAdmin.carModels.model')}</TableHead>
                <TableHead>{t('superAdmin.carModels.size')}</TableHead>
                {statusFilter !== 'active' && <TableHead>{t('superAdmin.carModels.status')}</TableHead>}
                <TableHead className="w-[100px]">{t('superAdmin.carModels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={statusFilter !== 'active' ? 5 : 4} className="text-center text-muted-foreground py-8">
                    {statusFilter === 'proposal'
                      ? t('superAdmin.carModels.noProposals')
                      : allModels.length === 0
                        ? t('superAdmin.carModels.noModels')
                        : t('superAdmin.carModels.noFilterResults')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModels.map(model => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.brand}</TableCell>
                    <TableCell>{model.name}</TableCell>
                    <TableCell>
                      <Badge variant={getSizeBadgeVariant(model.size)}>
                        {getSizeLabel(model.size)}
                      </Badge>
                    </TableCell>
                    {statusFilter !== 'active' && (
                      <TableCell>
                        <Badge variant={model.status === 'proposal' ? 'outline' : 'secondary'}>
                          {model.status === 'proposal'
                            ? t('superAdmin.carModels.proposal')
                            : t('superAdmin.carModels.activeStatus')}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {model.status === 'proposal' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingModel({
                                id: model.id,
                                brand: model.brand,
                                name: model.name,
                                size: model.size
                              })}
                              title={t('superAdmin.carModels.editBeforeAccept')}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAcceptProposal(model)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title={t('superAdmin.carModels.accept')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRejectProposal(model)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={t('superAdmin.carModels.reject')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingModel({
                                id: model.id,
                                brand: model.brand,
                                name: model.name,
                                size: model.size
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteModel(model.id, model.brand, model.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t('superAdmin.carModels.showing', {
                  from: ((currentPage - 1) * ITEMS_PER_PAGE) + 1,
                  to: Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length),
                  total: filteredModels.length,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('superAdmin.carModels.previous')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t('superAdmin.carModels.page', { current: currentPage, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('superAdmin.carModels.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCarModelDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={async () => { await refetch(); await fetchAllModels(); }}
      />

      {editingModel && (
        <EditCarModelDialog
          open={!!editingModel}
          onOpenChange={(open) => !open && setEditingModel(null)}
          model={editingModel}
          onSuccess={async () => { await refetch(); await fetchAllModels(); }}
        />
      )}
    </div>
  );
};
