import { useState, useEffect, useCallback, Fragment } from 'react';
import { toast } from 'sonner';
import AddSalesOrderDrawer from './AddSalesOrderDrawer';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui';
import { ConfirmDialog, EmptyState } from '@shared/ui';
import { CreateInvoiceDrawer } from '@shared/invoicing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { type SalesOrder } from '@/data/salesMockData';

const formatCurrency = (value: number, currency: 'PLN' | 'EUR') => {
  if (currency === 'EUR') {
    return (
      value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
    );
  }
  return (
    value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł'
  );
};

export const getNextOrderNumber = async (
  instanceId: string,
  date: Date = new Date(),
): Promise<string> => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthStr = String(month).padStart(2, '0');
  const suffix = `/${monthStr}/${year}`;

  const { count } = await (supabase
    .from('sales_orders')
    .select('id', { count: 'exact', head: true })
    .eq('instance_id', instanceId)
    .like('order_number', `%${suffix}`) as any);

  return `${(count || 0) + 1}/${monthStr}/${year}`;
};

type SortColumn =
  | 'orderNumber'
  | 'customerName'
  | 'createdAt'
  | 'shippedAt'
  | 'status'
  | 'totalNet';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 25;

const SalesOrdersView = () => {
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;

  const [bankAccounts, setBankAccounts] = useState<{ name: string; number: string }[]>([]);

  useEffect(() => {
    if (!instanceId) return;
    supabase
      .from('instances')
      .select('bank_accounts')
      .eq('id', instanceId)
      .single()
      .then(({ data }: any) => {
        if (data?.bank_accounts) setBankAccounts(data.bank_accounts);
      });
  }, [instanceId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
  }>({ open: false, orderId: '', orderNumber: '' });
  const [cancelShipmentConfirm, setCancelShipmentConfirm] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
  }>({ open: false, orderId: '', orderNumber: '' });
  const [sortColumn, setSortColumn] = useState<SortColumn>('orderNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [invoiceDrawerState, setInvoiceDrawerState] = useState<{
    open: boolean;
    order: SalesOrder | null;
  }>({ open: false, order: null });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    if (!instanceId) return;

    // Map sort column to DB column
    const sortColumnMap: Record<SortColumn, string> = {
      orderNumber: 'created_at', // order_number isn't easily sortable in DB, use created_at
      customerName: 'customer_name',
      createdAt: 'created_at',
      shippedAt: 'shipped_at',
      status: 'status',
      totalNet: 'total_net',
    };
    const dbSortCol = sortColumnMap[sortColumn] || 'created_at';

    // Build query with server-side pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('sales_orders')
      .select('*, sales_order_items(*)', { count: 'exact' })
      .eq('instance_id', instanceId);

    // Server-side search — escape PostgREST special chars
    if (debouncedSearch.trim()) {
      const escaped = debouncedSearch.trim().replace(/[%_\\(),."]/g, (c) => `\\${c}`);
      const q = `%${escaped}%`;
      query = query.or(
        `customer_name.ilike.${q},order_number.ilike.${q},city.ilike.${q},contact_person.ilike.${q}`,
      );
    }

    query = query.order(dbSortCol, { ascending: sortDirection === 'asc' }).range(from, to);

    const { data, error, count } = await (query as any);

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    setTotalCount(count || 0);

    // Fetch invoices separately
    const orderIds = (data || []).map((o: any) => o.id);
    let invoiceMap: Record<string, any> = {};
    if (orderIds.length > 0) {
      const { data: invoices, error: invError } = await (supabase
        .from('invoices')
        .select('id, sales_order_id, invoice_number, status, pdf_url')
        .in('sales_order_id', orderIds) as any);
      if (!invError && invoices) {
        for (const inv of invoices) {
          invoiceMap[inv.sales_order_id] = inv;
        }
      }
    }

    const mapped: SalesOrder[] = (data || []).map((o: any) => {
      const inv = invoiceMap[o.id];
      return {
        id: o.id,
        orderNumber: o.order_number,
        createdAt: o.created_at,
        shippedAt: o.shipped_at || undefined,
        customerName: o.customer_name,
        customerId: o.customer_id || undefined,
        city: o.city || undefined,
        contactPerson: o.contact_person || undefined,
        totalNet: Number(o.total_net),
        totalGross: Number(o.total_gross),
        currency: (o.currency || 'PLN') as 'PLN' | 'EUR',
        products: (o.sales_order_items || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          priceNet: Number(item.price_net),
          priceGross: Number(item.price_net) * 1.23,
          unit: item.price_unit || 'szt.',
        })),
        comment: o.comment || undefined,
        status: o.status as SalesOrder['status'],
        trackingNumber: o.tracking_number || undefined,
        trackingUrl: o.apaczka_tracking_url || undefined,
        invoiceId: inv?.id || undefined,
        invoiceNumber: inv?.invoice_number || undefined,
        invoiceStatus: inv?.status || undefined,
        invoicePdfUrl: inv?.pdf_url || undefined,
      };
    });

    setOrders(mapped);
  }, [instanceId, currentPage, sortColumn, sortDirection, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const changeStatus = async (id: string, newStatus: SalesOrder['status']) => {
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'wysłany') {
      updates.shipped_at = new Date().toISOString();
    } else {
      updates.shipped_at = null;
    }
    await (supabase.from('sales_orders').update(updates).eq('id', id) as any);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              shippedAt: newStatus === 'wysłany' ? new Date().toISOString() : undefined,
            }
          : o,
      ),
    );
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await (supabase.from('sales_roll_usages').delete().eq('order_id', orderId) as any);
      await (supabase.from('sales_order_items').delete().eq('order_id', orderId) as any);
      await (supabase.from('sales_orders').delete().eq('id', orderId) as any);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success('Zamówienie usunięte');
    } catch (err: any) {
      toast.error('Błąd usuwania: ' + (err.message || ''));
    }
  };

  const handleOpenInvoiceDrawer = async (order: SalesOrder) => {
    let customerDiscount = 0;
    if (order.customerId) {
      const { data: cust } = await (supabase
        .from('sales_customers')
        .select('discount_percent')
        .eq('id', order.customerId)
        .single() as any);
      customerDiscount = cust?.discount_percent ?? 0;
    }
    setInvoiceDrawerState({ open: true, order: { ...order, customerDiscount } });
  };

  const handleEditOrder = async (order: SalesOrder) => {
    // Fetch order items with vehicle info from DB
    const { data: items } = await (supabase
      .from('sales_order_items')
      .select(
        'id, product_id, variant_id, name, price_net, price_unit, quantity, vehicle, sort_order',
      )
      .eq('order_id', order.id)
      .order('sort_order') as any);

    // Fetch delivery_type from the order
    const { data: orderData } = await (supabase
      .from('sales_orders')
      .select(
        'delivery_type, payment_method, bank_account_number, comment, customer_id, customer_name, packages, attachments',
      )
      .eq('id', order.id)
      .single() as any);

    // Fetch customer discount
    let customerDiscount: number | undefined;
    if (orderData?.customer_id) {
      const { data: cust } = await (supabase
        .from('sales_customers')
        .select('discount_percent')
        .eq('id', orderData.customer_id)
        .single() as any);
      customerDiscount = cust?.discount_percent ?? undefined;
    }

    // Fetch existing roll usages for this order
    const { data: rollUsages, error: rollUsagesErr } = await (supabase
      .from('sales_roll_usages')
      .select('order_item_id, roll_id, used_m2')
      .eq('order_id', order.id) as any);

    // Fetch roll widths for assigned rolls
    const rollIds = [...new Set((rollUsages || []).map((u: any) => u.roll_id))] as string[];
    let rollWidthMap: Record<string, number> = {};
    if (rollIds.length > 0) {
      const { data: rollsData } = await (supabase
        .from('sales_rolls')
        .select('id, width_mm')
        .in('id', rollIds) as any);
      if (rollsData) {
        for (const r of rollsData as { id: string; width_mm: number }[]) {
          rollWidthMap[r.id] = Number(r.width_mm);
        }
      }
    }

    // Build usage map by order_item_id (multi-roll: array per item)
    const usagesByItemId: Record<
      string,
      Array<{ rollId: string; usedM2: number; widthMm: number }>
    > = {};
    for (const u of (rollUsages || []) as {
      order_item_id: string;
      roll_id: string;
      used_m2: number;
    }[]) {
      if (!usagesByItemId[u.order_item_id]) usagesByItemId[u.order_item_id] = [];
      usagesByItemId[u.order_item_id].push({
        rollId: u.roll_id,
        usedM2: Number(u.used_m2),
        widthMm: rollWidthMap[u.roll_id] || 1524,
      });
    }

    // Fetch exclude_from_discount for products in this order
    const productIds = [
      ...new Set((items || []).map((i: any) => i.product_id).filter(Boolean)),
    ] as string[];
    const excludeMap: Record<string, boolean> = {};
    if (productIds.length > 0) {
      const { data: prodData } = await (supabase
        .from('sales_products')
        .select('id, exclude_from_discount')
        .in('id', productIds) as any);
      (prodData || []).forEach((p: any) => {
        excludeMap[p.id] = p.exclude_from_discount || false;
      });
    }

    const editProducts = (items || []).map((item: any) => {
      const usages = usagesByItemId[item.id] || [];
      return {
        instanceKey: item.id, // Use DB id so it can be mapped to package productKeys
        productId: item.product_id || item.name,
        variantId: item.variant_id || undefined,
        name: item.name,
        priceNet: Number(item.price_net),
        priceUnit: item.price_unit || 'szt.',
        quantity: item.quantity,
        vehicle: item.vehicle || '',
        excludeFromDiscount: item.product_id ? excludeMap[item.product_id] || false : false,
        rollAssignments: usages.map((u) => ({
          rollId: u.rollId,
          usageM2: u.usedM2,
          widthMm: u.widthMm,
        })),
      };
    });

    // Rebuild package productKeys: stored packages have sort_order indices as keys.
    // Map each index to the corresponding editProduct's instanceKey (item.id).
    const rawPackages: any[] = orderData?.packages || [];
    let editPackages = rawPackages;
    if (rawPackages.length > 0 && editProducts.length > 0) {
      editPackages = rawPackages.map((pkg: any) => ({
        ...pkg,
        productKeys: (pkg.productKeys || []).map((k: string) => {
          const idx = Number(k);
          if (!isNaN(idx) && editProducts[idx]) return editProducts[idx].instanceKey;
          return k; // fallback for legacy UUID keys
        }),
      }));
    }

    setEditOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: orderData?.customer_id || '',
      customerName: orderData?.customer_name || order.customerName,
      customerDiscount,
      products: editProducts,
      packages: editPackages,
      deliveryType: (orderData?.delivery_type || 'shipping') as 'shipping' | 'pickup' | 'uber',
      paymentMethod: (orderData?.payment_method || 'cod') as 'cod' | 'transfer',
      bankAccountNumber: orderData?.bank_account_number || '',
      comment: orderData?.comment || '',
      sendEmail: false,
      attachments: ((orderData?.attachments as any[]) || []).map((a: any) => a.url),
    });
    setDrawerOpen(true);
  };

  const handleCreateShipment = async (orderId: string) => {
    try {
      toast.info('Tworzę przesyłkę w Apaczka...');
      const { data, error } = await supabase.functions.invoke('create-apaczka-shipment', {
        body: { orderId },
      });
      if (error) {
        let errDetail = '';
        try {
          const errBody = await (error as any).context?.json?.();
          errDetail = errBody?.error || errBody?.message || '';
        } catch {
          /* ignore */
        }
        toast.error('Błąd tworzenia przesyłki' + (errDetail ? ': ' + errDetail : ''));
        return;
      }
      if (data?.error) {
        const valPrice = data.valuation?.price_gross
          ? ` | Wycena: ${data.valuation.price_gross} PLN`
          : '';
        toast.error('Błąd: ' + data.error + valPrice, { duration: 10000 });
        return;
      }
      toast.success(`Przesyłka utworzona. Nr listu: ${data.waybill_number}`);
      fetchOrders();
    } catch {
      toast.error('Nie udało się utworzyć przesyłki');
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    try {
      await (supabase
        .from('sales_orders')
        .update({
          status: 'anulowany',
          apaczka_order_id: null,
          tracking_number: null,
          apaczka_tracking_url: null,
          shipped_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId) as any);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'anulowany' as const, trackingNumber: undefined, trackingUrl: undefined }
            : o,
        ),
      );
      toast.success('Przesyłka anulowana');
    } catch {
      toast.error('Nie udało się anulować przesyłki');
    }
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-semibold text-foreground">Zamówienia</h2>
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4" />
          Dodaj zamówienie
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po firmie, mieście, osobie, produkcie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHead column="orderNumber" className="w-[120px]">
                Nr
              </SortableHead>
              <SortableHead column="customerName" className="w-[200px]">
                Klient
              </SortableHead>
              <SortableHead column="createdAt" className="w-[100px]">
                Utworzono
              </SortableHead>
              <SortableHead column="shippedAt" className="w-[100px]">
                Wysłano
              </SortableHead>
              <TableHead className="w-[180px]">List przewozowy</TableHead>
              <SortableHead column="totalNet" className="text-right w-[120px]">
                Kwota netto
              </SortableHead>
              <TableHead className="w-[120px]">Płatność</TableHead>
              <SortableHead column="status" className="w-[100px]">
                Status
              </SortableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    icon={ShoppingCart}
                    title="Brak zamówień"
                    description="Utwórz pierwsze zamówienie dla klienta"
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedRows.has(order.id);

                return (
                  <Fragment key={order.id}>
                    <TableRow
                      className="group hover:bg-hover-strong cursor-pointer"
                      onClick={() => handleEditOrder(order)}
                    >
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(order.id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                          {order.orderNumber}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(order.createdAt), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.shippedAt ? (
                          format(parseISO(order.shippedAt), 'dd.MM.yyyy')
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <a
                            href={order.trackingUrl || '#'}
                            target={order.trackingUrl ? '_blank' : undefined}
                            rel={order.trackingUrl ? 'noopener noreferrer' : undefined}
                            className="text-sm text-primary hover:underline truncate block max-w-[160px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!order.trackingUrl) {
                                e.preventDefault();
                                toast.info('Śledzenie przesyłki w przygotowaniu');
                              }
                            }}
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatCurrency(order.totalNet, order.currency)}
                      </TableCell>
                      <TableCell>
                        {order.invoiceStatus === 'paid' ? (
                          <Badge className="bg-emerald-600 text-white text-xs">Opłacone</Badge>
                        ) : order.invoiceId ? (
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-blue-600 text-xs"
                          >
                            Wystawiona FV
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Badge
                                variant={order.status === 'wysłany' ? 'default' : 'outline'}
                                className={
                                  order.status === 'wysłany'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                    : order.status === 'anulowany'
                                      ? 'border-red-500 text-red-600 cursor-pointer'
                                      : 'border-amber-500 text-amber-600 cursor-pointer'
                                }
                              >
                                {order.status === 'nowy'
                                  ? 'Nowy'
                                  : order.status === 'wysłany'
                                    ? 'Wysłany'
                                    : order.status === 'anulowany'
                                      ? 'Anulowany'
                                      : order.status}
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-0">
                            <DropdownMenuItem onClick={() => changeStatus(order.id, 'nowy')}>
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Nowy
                              </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(order.id, 'wysłany')}>
                              <Badge className="bg-emerald-600 text-white">Wysłany</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeStatus(order.id, 'anulowany')}>
                              <Badge variant="outline" className="border-red-500 text-red-600">
                                Anulowany
                              </Badge>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                              Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.invoiceId ? (
                              <DropdownMenuItem
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (order.invoicePdfUrl) {
                                    window.open(order.invoicePdfUrl, '_blank');
                                    return;
                                  }
                                  try {
                                    toast.info('Pobieram PDF...');
                                    const session = await supabase.auth.getSession();
                                    const token = session.data.session?.access_token;
                                    const res = await fetch(
                                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invoicing-api`,
                                      {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`,
                                          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                                        },
                                        body: JSON.stringify({
                                          action: 'get_pdf_url',
                                          instanceId,
                                          invoiceId: order.invoiceId,
                                        }),
                                      },
                                    );
                                    if (!res.ok) throw new Error(await res.text());
                                    const contentType = res.headers.get('content-type') || '';
                                    if (contentType.includes('application/pdf')) {
                                      const blob = await res.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `faktura-${order.invoiceNumber || order.invoiceId}.pdf`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    } else {
                                      const json = await res.json();
                                      if (json.pdf_url) {
                                        window.open(json.pdf_url, '_blank');
                                      } else {
                                        toast.error('PDF faktury niedostępny');
                                      }
                                    }
                                  } catch {
                                    toast.error('Nie udało się pobrać PDF');
                                  }
                                }}
                              >
                                Pobierz FV
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenInvoiceDrawer(order);
                                }}
                              >
                                Wystaw FV
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateShipment(order.id);
                              }}
                            >
                              Utwórz przesyłkę
                            </DropdownMenuItem>
                            {order.trackingNumber && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelShipmentConfirm({
                                    open: true,
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                  });
                                }}
                              >
                                Anuluj przesyłkę
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm({
                                  open: true,
                                  orderId: order.id,
                                  orderNumber: order.orderNumber,
                                });
                              }}
                            >
                              Usuń
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${order.id}-expanded`} className="hover:bg-transparent">
                        <TableCell colSpan={9} className="p-0">
                          <div className="bg-card px-6 py-4 border-t border-border/50">
                            {order.comment && (
                              <p className="text-sm text-muted-foreground mb-3">{order.comment}</p>
                            )}
                            <div className="space-y-1.5">
                              {order.products.map((product, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-sm gap-4"
                                >
                                  <span className="text-muted-foreground min-w-0 truncate">
                                    {product.name}
                                  </span>
                                  <div className="flex items-center gap-4 shrink-0 tabular-nums text-xs text-muted-foreground">
                                    <span>{product.quantity} szt.</span>
                                    <span className="w-24 text-right">
                                      {formatCurrency(product.priceNet, order.currency)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Strona {currentPage} z {totalPages} ({totalCount} zamówień)
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
            {(() => {
              const pages: (number | 'dots')[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (currentPage > 3) pages.push('dots');
                for (
                  let i = Math.max(2, currentPage - 1);
                  i <= Math.min(totalPages - 1, currentPage + 1);
                  i++
                ) {
                  pages.push(i);
                }
                if (currentPage < totalPages - 2) pages.push('dots');
                pages.push(totalPages);
              }
              return pages.map((page, idx) =>
                page === 'dots' ? (
                  <span key={`dots-${idx}`} className="px-2 text-muted-foreground text-sm">
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="w-9"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ),
              );
            })()}
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
      <AddSalesOrderDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setEditOrder(null);
        }}
        editOrder={editOrder}
        onOrderCreated={fetchOrders}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Usuń zamówienie"
        description={`Czy na pewno chcesz usunąć zamówienie ${deleteConfirm.orderNumber}? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        variant="destructive"
        onConfirm={() => handleDeleteOrder(deleteConfirm.orderId)}
      />
      <ConfirmDialog
        open={cancelShipmentConfirm.open}
        onOpenChange={(open) => setCancelShipmentConfirm((prev) => ({ ...prev, open }))}
        title="Anuluj przesyłkę"
        description={`Czy na pewno chcesz anulować przesyłkę dla zamówienia ${cancelShipmentConfirm.orderNumber}? Dane śledzenia zostaną usunięte.`}
        confirmLabel="Anuluj przesyłkę"
        variant="destructive"
        onConfirm={() => handleCancelShipment(cancelShipmentConfirm.orderId)}
      />
      {invoiceDrawerState.order && (
        <CreateInvoiceDrawer
          open={invoiceDrawerState.open}
          onClose={() => setInvoiceDrawerState({ open: false, order: null })}
          instanceId={instanceId!}
          salesOrderId={invoiceDrawerState.order.id}
          customerId={invoiceDrawerState.order.customerId}
          customerName={invoiceDrawerState.order.customerName}
          positions={invoiceDrawerState.order.products.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unit_price_gross: p.priceNet,
            vat_rate: 23,
            unit: p.unit === 'meter' ? 'm2' : p.unit === 'piece' ? 'szt.' : p.unit || 'szt.',
            discount: invoiceDrawerState.order!.customerDiscount ?? 0,
          }))}
          onSuccess={fetchOrders}
          supabaseClient={supabase}
          customerTable="sales_customers"
          bankAccounts={bankAccounts}
        />
      )}
    </div>
  );
};

export default SalesOrdersView;
