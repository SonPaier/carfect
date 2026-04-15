import { useState, useEffect, useCallback, Fragment } from 'react';
import { mapProductToInvoicePosition } from './utils/invoicePositionMapper';
import { type AddressData } from './order-drawer/AddressFields';
import { toast } from 'sonner';
import AddSalesOrderDrawer from './AddSalesOrderDrawer';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Input } from '@shared/ui';
import { Button } from '@shared/ui';
import { Badge } from '@shared/ui';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PaginationFooter,
} from '@shared/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@shared/ui';
import {
  ConfirmDialog,
  EmptyState,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui';
import { CreateInvoiceDrawer } from '@shared/invoicing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { type SalesOrder } from '@/data/salesMockData';
import { VAT_RATE } from './constants';

type PaymentStatus = SalesOrder['paymentStatus'];

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: 'Do opłacenia', className: 'border-amber-500 text-amber-600' },
  paid: { label: 'Opłacone', className: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  collective: { label: 'Zbiorcza', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  collective_paid: {
    label: 'Zbiorcza opłacona',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  invoice_unpaid: {
    label: 'Do opłacenia (FV)',
    className: 'border-orange-500 text-orange-600',
  },
  invoice_paid: {
    label: 'Opłacone (FV)',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
};

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

  const { count } = await supabase
    .from('sales_orders')
    .select('id', { count: 'exact', head: true })
    .eq('instance_id', instanceId)
    .like('order_number', `%${suffix}`);

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

const DEFAULT_PAGE_SIZE = 25;

const SalesOrdersView = () => {
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;

  const [bankAccounts, setBankAccounts] = useState<{ name: string; number: string }[]>([]);
  const [shipmentInFlight, setShipmentInFlight] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId) return;
    supabase
      .from('instances')
      .select('bank_accounts')
      .eq('id', instanceId)
      .single()
      .then(({ data }) => {
        if (data?.bank_accounts)
          setBankAccounts(data.bank_accounts as { name: string; number: string }[]);
      });
  }, [instanceId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<EditOrderData | null>(null);
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
  const [bulkInvoiceState, setBulkInvoiceState] = useState<{
    open: boolean;
    orders: SalesOrder[];
  }>({ open: false, orders: [] });
  const [trackingDialog, setTrackingDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
  }>({ open: false, orderId: '', orderNumber: '' });
  const [trackingInput, setTrackingInput] = useState('');
  const bulk = useBulkSelection();

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
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

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

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }

    setTotalCount(count || 0);

    // Fetch invoices separately
    const orderIds = (data || []).map((o) => o.id);
    const invoiceMap: Record<
      string,
      { id: string; invoice_number: string; status: string; pdf_url: string }
    > = {};
    if (orderIds.length > 0) {
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, sales_order_id, invoice_number, status, pdf_url')
        .in('sales_order_id', orderIds);
      if (!invError && invoices) {
        for (const inv of invoices) {
          invoiceMap[inv.sales_order_id] = inv;
        }
      }
    }

    const mapped: SalesOrder[] = (data || []).map((o) => {
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
        products: (
          (o.sales_order_items || []) as {
            name: string;
            quantity: number;
            price_net: number;
            price_unit?: string;
            discount_percent?: number;
            required_mb?: number;
            product_type?: string;
          }[]
        ).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceNet: Number(item.price_net),
          priceGross: Number(item.price_net) * 1.23,
          unit: item.price_unit || 'szt.',
          discountPercent:
            item.discount_percent != null ? Number(item.discount_percent) : undefined,
          requiredMb: item.required_mb ?? undefined,
          productType: (item.product_type as 'roll' | 'other') || undefined,
        })),
        packages: ((o.packages || []) as { shippingMethod?: string; shippingCost?: number }[]).map(
          (pkg) => ({
            shippingMethod: pkg.shippingMethod || 'shipping',
            shippingCost: pkg.shippingCost ?? undefined,
          }),
        ),
        comment: o.comment || undefined,
        status: o.status as SalesOrder['status'],
        paymentStatus: inv
          ? inv.status === 'paid'
            ? o.payment_status === 'collective'
              ? 'collective_paid'
              : 'invoice_paid'
            : 'invoice_unpaid'
          : ((o.payment_status || 'unpaid') as PaymentStatus),
        trackingNumber: o.tracking_number || undefined,
        trackingUrl: o.apaczka_tracking_url || undefined,
        apaczkaOrderId: o.apaczka_order_id || undefined,
        invoiceId: inv?.id || undefined,
        invoiceNumber: inv?.invoice_number || undefined,
        invoiceStatus: inv?.status || undefined,
        invoicePdfUrl: inv?.pdf_url || undefined,
        paymentMethod: o.payment_method || undefined,
        deliveryType: (o.delivery_type as SalesOrder['deliveryType']) || undefined,
      };
    });

    setOrders(mapped);
  }, [instanceId, currentPage, pageSize, sortColumn, sortDirection, debouncedSearch]);

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

  const totalPages = Math.ceil(totalCount / pageSize);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const changePaymentStatus = async (id: string, newStatus: PaymentStatus) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    // For invoice-based statuses, update the invoice record
    if (newStatus === 'invoice_paid' || newStatus === 'invoice_unpaid') {
      if (order.invoiceId) {
        const invoiceStatus = newStatus === 'invoice_paid' ? 'paid' : 'issued';
        const { error: invError } = await supabase
          .from('invoices')
          .update({ status: invoiceStatus, updated_at: new Date().toISOString() })
          .eq('id', order.invoiceId);
        if (invError) {
          toast.error('Błąd zmiany statusu faktury');
          return;
        }
      }
      // Also update the order's payment_status for consistency
      const dbStatus = newStatus === 'invoice_paid' ? 'paid' : 'unpaid';
      await supabase
        .from('sales_orders')
        .update({ payment_status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } else {
      const { error } = await supabase
        .from('sales_orders')
        .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        toast.error('Błąd zmiany statusu płatności');
        return;
      }
    }

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, paymentStatus: newStatus } : o)));
  };

  const changeStatus = async (id: string, newStatus: SalesOrder['status']) => {
    const updates: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'wysłany') {
      updates.shipped_at = new Date().toISOString();
    } else {
      updates.shipped_at = null;
    }
    // When leaving 'wysłany', clear Apaczka data so shipment can be re-created
    if (newStatus !== 'wysłany') {
      updates.apaczka_order_id = null;
      updates.tracking_number = null;
      updates.apaczka_tracking_url = null;
    }
    const { error } = await supabase.from('sales_orders').update(updates).eq('id', id);
    if (error) {
      toast.error('Błąd zmiany statusu');
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              shippedAt: newStatus === 'wysłany' ? new Date().toISOString() : undefined,
              trackingNumber: newStatus === 'wysłany' ? o.trackingNumber : undefined,
              trackingUrl: newStatus === 'wysłany' ? o.trackingUrl : undefined,
              paymentStatus: o.paymentStatus,
            }
          : o,
      ),
    );
  };

  const saveManualTracking = async () => {
    const number = trackingInput.trim();
    if (!number) return;
    const url = `https://www.apaczka.pl/sledz-przesylke/?waybill=${number}`;
    const { error } = await supabase
      .from('sales_orders')
      .update({
        tracking_number: number,
        apaczka_tracking_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trackingDialog.orderId);
    if (error) {
      toast.error('Błąd zapisu listu przewozowego');
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === trackingDialog.orderId ? { ...o, trackingNumber: number, trackingUrl: url } : o,
      ),
    );
    setTrackingDialog({ open: false, orderId: '', orderNumber: '' });
    setTrackingInput('');
    toast.success('List przewozowy dodany');
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await supabase.from('sales_roll_usages').delete().eq('order_id', orderId);
      await supabase.from('sales_order_items').delete().eq('order_id', orderId);
      await supabase.from('sales_orders').delete().eq('id', orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success('Zamówienie usunięte');
    } catch (err: unknown) {
      toast.error('Błąd usuwania: ' + ((err as Error).message || ''));
    }
  };

  const handleBulkInvoice = async () => {
    const selectedOrders = orders.filter((o) => bulk.isSelected(o.id));
    if (selectedOrders.length === 0) return;

    // Validate same customer
    const customerIds = [...new Set(selectedOrders.map((o) => o.customerId).filter(Boolean))];
    if (customerIds.length > 1) {
      toast.error('Zaznaczone zamówienia muszą mieć tego samego klienta');
      return;
    }
    if (customerIds.length === 0) {
      toast.error('Zaznaczone zamówienia nie mają przypisanego klienta');
      return;
    }

    // Fetch customer discount
    let customerDiscount = 0;
    const { data: cust } = await supabase
      .from('sales_customers')
      .select('discount_percent')
      .eq('id', customerIds[0])
      .single();
    customerDiscount = cust?.discount_percent ?? 0;

    setBulkInvoiceState({
      open: true,
      orders: selectedOrders.map((o) => ({ ...o, customerDiscount })),
    });
  };

  const handleOpenInvoiceDrawer = async (order: SalesOrder) => {
    let customerDiscount = 0;
    if (order.customerId) {
      const { data: cust } = await supabase
        .from('sales_customers')
        .select('discount_percent')
        .eq('id', order.customerId)
        .single();
      customerDiscount = cust?.discount_percent ?? 0;
    }
    setInvoiceDrawerState({ open: true, order: { ...order, customerDiscount } });
  };

  const handleEditOrder = async (order: SalesOrder) => {
    // Fetch order items with vehicle info from DB
    const { data: items } = await (supabase
      .from('sales_order_items')
      .select(
        'id, product_id, variant_id, name, price_net, price_unit, quantity, vehicle, sort_order, discount_percent, required_mb, product_type',
      )
      .eq('order_id', order.id)
      .order('sort_order') as any);

    // Fetch delivery_type from the order
    const { data: orderData } = await (supabase
      .from('sales_orders')
      .select(
        'delivery_type, payment_method, bank_account_number, comment, customer_id, customer_name, packages, attachments, shipping_address, is_net_payer',
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
    const rollWidthMap: Record<string, number> = {};
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
      // Infer productType from DB or name (legacy data may have wrong type)
      const isFormatki = (item.name as string)?.toLowerCase().includes('wycinanie formatek');
      const productType: 'roll' | 'other' = isFormatki
        ? 'other'
        : (item.product_type as 'roll' | 'other') || 'roll';
      return {
        instanceKey: item.id, // Use DB id so it can be mapped to package productKeys
        productId: item.product_id || item.name,
        variantId: item.variant_id || undefined,
        name: item.name,
        priceNet: Number(item.price_net),
        priceUnit: item.price_unit || 'szt.',
        productType,
        quantity: item.quantity,
        vehicle: item.vehicle || '',
        excludeFromDiscount: item.product_id ? excludeMap[item.product_id] || false : false,
        discountPercent: item.discount_percent != null ? Number(item.discount_percent) : undefined,
        requiredMb: item.required_mb ? Number(item.required_mb) : undefined,
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

    // Fallback: jeśli żadna paczka nie ma productKeys pasujących do editProducts,
    // przypisz wszystkie produkty do pierwszej paczki
    const allInstanceKeys = editProducts.map((p) => p.instanceKey);
    const allAssignedKeys = new Set(editPackages.flatMap((pkg) => pkg.productKeys ?? []));
    const anyMatches = allInstanceKeys.some((key) => allAssignedKeys.has(key));
    if (!anyMatches && allInstanceKeys.length > 0) {
      const firstPkg = editPackages[0];
      const fallbackPkg = firstPkg
        ? { ...firstPkg, productKeys: allInstanceKeys }
        : {
            id: crypto.randomUUID(),
            shippingMethod: 'shipping' as const,
            packagingType: 'tuba' as const,
            dimensions: { length: 0, diameter: 0 },
            courier: undefined,
            courierServiceId: undefined,
            weight: 1,
            contents: '',
            declaredValueManual: false,
            oversized: false,
            productKeys: allInstanceKeys,
          };
      editPackages = [fallbackPkg];
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
      paymentMethod: (orderData?.payment_method || 'cod') as
        | 'cod'
        | 'transfer'
        | 'free'
        | 'cash'
        | 'card',
      bankAccountNumber: orderData?.bank_account_number || '',
      comment: orderData?.comment || '',
      isNetPayer: orderData?.is_net_payer ?? false,
      sendEmail: false,
      attachments: ((orderData?.attachments as any[]) || []).map((a: any) => a.url),
      shippingAddress: orderData?.shipping_address
        ? (orderData.shipping_address as AddressData)
        : undefined,
    });
    setDrawerOpen(true);
  };

  const handleCreateShipment = async (orderId: string) => {
    if (shipmentInFlight) return;
    setShipmentInFlight(orderId);
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
    } finally {
      setShipmentInFlight(null);
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    try {
      toast.info('Anuluję przesyłkę w Apaczka...');
      const { data, error } = await supabase.functions.invoke('cancel-apaczka-shipment', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'anulowany' as const,
                trackingNumber: undefined,
                trackingUrl: undefined,
              }
            : o,
        ),
      );
      toast.success('Przesyłka anulowana');
    } catch (err: any) {
      toast.error('Nie udało się anulować przesyłki' + (err.message ? ': ' + err.message : ''));
    }
  };

  const handlePrintLabel = async (orderId: string) => {
    try {
      toast.info('Pobieram etykietę...');
      const { data, error } = await supabase.functions.invoke('get-apaczka-label', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.pdf_base64) throw new Error('Brak danych etykiety');
      const pdfBytes = Uint8Array.from(atob(data.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error('Nie udało się pobrać etykiety' + (err.message ? ': ' + err.message : ''));
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 pb-4">
        <h2 className="text-xl font-semibold text-foreground">Zamówienia</h2>
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4" />
          Dodaj zamówienie
        </Button>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search */}
      <div className="shrink-0 pb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po firmie, mieście, osobie, produkcie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {bulk.count > 0 && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">Zaznaczono: {bulk.count}</span>
          <Button size="sm" variant="outline" onClick={bulk.clear}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleBulkInvoice}>
            Wystaw zbiorczą fakturę
          </Button>
        </div>
      )}

      {/* Table — scrollable */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] px-2">
                <Checkbox
                  checked={
                    bulk.selectionState(orders.map((o) => o.id)) === 'all'
                      ? true
                      : bulk.selectionState(orders.map((o) => o.id)) === 'some'
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={() => bulk.toggleAll(orders.map((o) => o.id))}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
              <SortableHead column="orderNumber" className="w-[100px]">
                Nr
              </SortableHead>
              <SortableHead column="customerName">Klient</SortableHead>
              <SortableHead column="createdAt" className="w-[110px]">
                Utworzono
              </SortableHead>
              <SortableHead column="shippedAt" className="w-[110px]">
                Wysłano
              </SortableHead>
              <TableHead className="w-[160px]">Dostawa</TableHead>
              <TableHead className="w-[200px]">List przewozowy</TableHead>
              <SortableHead column="totalNet" className="text-right w-[170px]">
                Kwota netto
              </SortableHead>
              <TableHead className="w-[180px]">Płatność</TableHead>
              <SortableHead column="status" className="w-[140px]">
                Status
              </SortableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
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
                      <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={bulk.isSelected(order.id)}
                          onCheckedChange={() => bulk.toggle(order.id)}
                        />
                      </TableCell>
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
                      <TableCell className="text-sm whitespace-nowrap">
                        {order.deliveryType === 'pickup'
                          ? 'Odbiór osobisty'
                          : order.deliveryType === 'uber'
                            ? 'Uber'
                            : 'Wysyłka'}
                      </TableCell>
                      <TableCell>
                        {order.trackingNumber ? (
                          <div className="flex items-center gap-1 text-sm">
                            <a
                              href={order.trackingUrl || '#'}
                              target={order.trackingUrl ? '_blank' : undefined}
                              rel={order.trackingUrl ? 'noopener noreferrer' : undefined}
                              className="text-primary hover:underline truncate max-w-[160px]"
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
                            {order.paymentMethod === 'cod' && (
                              <span className="text-muted-foreground whitespace-nowrap">
                                (za pobr.)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {order.paymentMethod === 'free'
                          ? 'Bezpłatne'
                          : formatCurrency(order.totalNet, order.currency)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(() => {
                                const cfg = PAYMENT_STATUS_CONFIG[order.paymentStatus];
                                const isOutline =
                                  order.paymentStatus === 'unpaid' ||
                                  order.paymentStatus === 'invoice_unpaid';
                                return (
                                  <Badge
                                    variant={isOutline ? 'outline' : 'default'}
                                    className={`${cfg.className} cursor-pointer`}
                                  >
                                    {cfg.label}
                                  </Badge>
                                );
                              })()}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-0">
                            {(
                              Object.entries(PAYMENT_STATUS_CONFIG) as [
                                PaymentStatus,
                                { label: string; className: string },
                              ][]
                            ).map(([status, cfg]) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  changePaymentStatus(order.id, status);
                                }}
                              >
                                <Badge
                                  variant={
                                    status === 'unpaid' || status === 'invoice_unpaid'
                                      ? 'outline'
                                      : 'default'
                                  }
                                  className={cfg.className}
                                >
                                  {cfg.label}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                changeStatus(order.id, 'nowy');
                              }}
                            >
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Nowy
                              </Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                changeStatus(order.id, 'wysłany');
                              }}
                            >
                              <Badge className="bg-emerald-600 text-white">Wysłany</Badge>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                changeStatus(order.id, 'anulowany');
                              }}
                            >
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
                            {!order.trackingNumber && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackingDialog({
                                    open: true,
                                    orderId: order.id,
                                    orderNumber: order.orderNumber,
                                  });
                                  setTrackingInput('');
                                }}
                              >
                                Dodaj list przewozowy
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.paymentMethod !== 'free' &&
                              (order.invoiceId ? (
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
                                        window.open(url, '_blank');
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
                              ))}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateShipment(order.id);
                              }}
                            >
                              Utwórz przesyłkę
                            </DropdownMenuItem>
                            {order.apaczkaOrderId && order.status !== 'anulowany' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintLabel(order.id);
                                }}
                              >
                                Drukuj etykietę
                              </DropdownMenuItem>
                            )}
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
                        <TableCell colSpan={10} className="p-0">
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

      {/* Pagination footer — always visible at bottom */}
      <div className="shrink-0">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemLabel="zamówień"
        />
      </div>
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
          positions={[
            ...invoiceDrawerState.order.products.map((p) =>
              mapProductToInvoicePosition(p, invoiceDrawerState.order!.customerDiscount),
            ),
            ...(() => {
              const shippingPkgs = (invoiceDrawerState.order!.packages || []).filter(
                (pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null,
              );
              return shippingPkgs.map((pkg, i) => ({
                name: shippingPkgs.length === 1 ? 'Wysyłka' : `Wysyłka #${i + 1}`,
                quantity: 1,
                // shippingCost is brutto from Apaczka — convert to netto to match product positions
                unit_price_gross: Math.round((pkg.shippingCost! / (1 + VAT_RATE)) * 100) / 100,
                vat_rate: 23,
                unit: 'szt.',
                discount: 0,
              }));
            })(),
          ]}
          onSuccess={fetchOrders}
          supabaseClient={supabase}
          customerTable="sales_customers"
          bankAccounts={bankAccounts}
        />
      )}
      {bulkInvoiceState.open && bulkInvoiceState.orders.length > 0 && (
        <CreateInvoiceDrawer
          open={bulkInvoiceState.open}
          onClose={() => setBulkInvoiceState({ open: false, orders: [] })}
          instanceId={instanceId!}
          salesOrderId={bulkInvoiceState.orders[0].id}
          customerId={bulkInvoiceState.orders[0].customerId}
          customerName={bulkInvoiceState.orders[0].customerName}
          positions={bulkInvoiceState.orders.flatMap((order) => [
            ...order.products.map((p) => mapProductToInvoicePosition(p, order.customerDiscount)),
            ...(order.packages || [])
              .filter((pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null)
              .map((pkg, i, arr) => ({
                name:
                  arr.length === 1
                    ? `Wysyłka (${order.orderNumber})`
                    : `Wysyłka #${i + 1} (${order.orderNumber})`,
                quantity: 1,
                unit_price_gross: Math.round((pkg.shippingCost! / (1 + VAT_RATE)) * 100) / 100,
                vat_rate: 23,
                unit: 'szt.',
                discount: 0,
              })),
          ])}
          onSuccess={async () => {
            // Mark all bulk orders as 'collective'
            const ids = bulkInvoiceState.orders.map((o) => o.id);
            await supabase
              .from('sales_orders')
              .update({ payment_status: 'collective', updated_at: new Date().toISOString() })
              .in('id', ids);
            setBulkInvoiceState({ open: false, orders: [] });
            bulk.clear();
            fetchOrders();
            toast.success(`Zbiorcza faktura wystawiona dla ${ids.length} zamówień`);
          }}
          supabaseClient={supabase}
          customerTable="sales_customers"
          bankAccounts={bankAccounts}
        />
      )}
      <Dialog
        open={trackingDialog.open}
        onOpenChange={(open) => {
          setTrackingDialog((prev) => ({ ...prev, open }));
          if (!open) setTrackingInput('');
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{trackingDialog.orderNumber} - Dodaj list przewozowy</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nr listu przewozowego"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveManualTracking();
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackingDialog({ open: false, orderId: '', orderNumber: '' })}
            >
              Anuluj
            </Button>
            <Button onClick={saveManualTracking} disabled={!trackingInput.trim()}>
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrdersView;
