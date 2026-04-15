import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, MoreHorizontal, Settings2, ArrowUp, ArrowDown, Package } from 'lucide-react';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Input, EmptyState } from '@shared/ui';
import { Button } from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AddSalesProductDrawer from './AddSalesProductDrawer';
import { CategoryManagementDialog } from '@/components/admin/CategoryManagementDialog';

export interface SalesProduct {
  id: string;
  shortName: string;
  fullName: string;
  description?: string;
  priceNet: number;
  priceUnit: string;
  productType: 'roll' | 'other';
  categoryId?: string | null;
  categoryName?: string | null;
  hasVariants?: boolean;
  excludeFromDiscount?: boolean;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

const ITEMS_PER_PAGE = 10;

type SortColumn = 'shortName' | 'fullName' | 'categoryName' | 'priceNet';
type SortDirection = 'asc' | 'desc';

const SalesProductsView = () => {
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<SalesProduct | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('shortName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const fetchProducts = useCallback(async () => {
    if (!instanceId) return;
    setLoading(true);
    const { data } = await supabase
      .from('sales_products')
      .select(
        'id, short_name, full_name, description, price_net, price_unit, product_type, category_id, has_variants, exclude_from_discount',
      )
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false });

    // Fetch categories to map names
    const { data: cats } = await supabase
      .from('unified_categories')
      .select('id, name')
      .eq('instance_id', instanceId)
      .eq('category_type', 'sales');
    const catMap = new Map((cats || []).map((c) => [c.id, c.name]));

    setProducts(
      (data || []).map((p) => ({
        id: p.id,
        shortName: p.short_name,
        fullName: p.full_name,
        description: p.description || undefined,
        priceNet: Number(p.price_net),
        priceUnit: p.price_unit,
        categoryId: p.category_id || null,
        categoryName: p.category_id ? catMap.get(p.category_id) || null : null,
        productType: (p.product_type as 'roll' | 'other') || 'roll',
        hasVariants: p.has_variants || false,
        excludeFromDiscount: p.exclude_from_discount || false,
      })),
    );
    setLoading(false);
  }, [instanceId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) => p.shortName.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    const dir = sortDirection === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortColumn) {
        case 'shortName':
          return a.shortName.localeCompare(b.shortName) * dir;
        case 'fullName':
          return a.fullName.localeCompare(b.fullName) * dir;
        case 'categoryName':
          return (a.categoryName || '').localeCompare(b.categoryName || '') * dir;
        case 'priceNet':
          return (a.priceNet - b.priceNet) * dir;
        default:
          return 0;
      }
    });
    return sorted;
  }, [filteredProducts, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sales_products').delete().eq('id', id);
    if (error) {
      toast.error('Błąd usuwania');
      return;
    }
    toast.success('Produkt usunięty');
    fetchProducts();
  };

  const SortableHead = ({
    column,
    children,
    className,
  }: {
    column: SortColumn;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
        onClick={() => handleSort(column)}
      >
        {children}
        {sortColumn === column &&
          (sortDirection === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          ))}
      </button>
    </TableHead>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap shrink-0 pb-4">
        <h2 className="text-xl font-semibold text-foreground">Produkty</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <Settings2 className="w-4 h-4" />
            Kategorie
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditProduct(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Dodaj produkt
          </Button>
        </div>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search */}
      <div className="flex items-center gap-4 shrink-0 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead column="shortName">Nazwa</SortableHead>
              <SortableHead column="fullName">Nazwa pełna</SortableHead>
              <SortableHead column="categoryName">Kategoria</SortableHead>
              <SortableHead column="priceNet" className="text-right w-[120px]">
                Cena netto
              </SortableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  {loading ? (
                    <div className="text-center text-muted-foreground py-8">Ładowanie...</div>
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="Brak produktów"
                      description="Dodaj pierwszy produkt do katalogu"
                    />
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-hover-strong cursor-pointer"
                  onClick={() => {
                    setEditProduct(product);
                    setDrawerOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{product.shortName}</TableCell>
                  <TableCell className="text-sm">{product.fullName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.categoryName || '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums whitespace-nowrap">
                    {formatCurrency(product.priceNet)} /{' '}
                    {product.priceUnit === 'meter' ? 'm²' : 'szt.'}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditProduct(product);
                            setDrawerOpen(true);
                          }}
                        >
                          Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(product.id)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage} z {totalPages} ({sortedProducts.length} produktów)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Poprzednia
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Następna
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
      {instanceId && (
        <>
          <AddSalesProductDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            instanceId={instanceId}
            onSaved={fetchProducts}
            product={editProduct}
          />
          <CategoryManagementDialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
            instanceId={instanceId}
            categoryType="sales"
            serviceCounts={products.reduce(
              (acc, p) => {
                if (p.categoryId) acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            )}
            onCategoriesChanged={fetchProducts}
          />
        </>
      )}
    </div>
  );
};

export default SalesProductsView;
