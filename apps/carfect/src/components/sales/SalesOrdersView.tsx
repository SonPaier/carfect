import { useState, useEffect, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  mapProductToInvoicePosition,
  bruttoCostToInvoicePosition,
} from './utils/invoicePositionMapper';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui';
import { CreateInvoiceDrawer } from '@shared/invoicing';
import { SalesOrderInvoiceActions } from './SalesOrderInvoiceActions';
import { OrderInvoiceMenuItems } from './order-row/OrderInvoiceMenuItems';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { type SalesOrder } from '@/data/salesMockData';
type PaymentStatus = SalesOrder['paymentStatus'];

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { labelKey: string; className: string }> = {
  unpaid: {
    labelKey: 'sales.orders.paymentStatusUnpaid',
    className: 'border-amber-500 text-amber-600',
  },
  paid: {
    labelKey: 'sales.orders.paymentStatusPaid',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  collective: {
    labelKey: 'sales.orders.paymentStatusCollective',
    className: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  collective_paid: {
    labelKey: 'sales.orders.paymentStatusCollectivePaid',
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  invoice_unpaid: {
    labelKey: 'sales.orders.paymentStatusInvoiceUnpaid',
    className: 'border-orange-500 text-orange-600',
  },
  invoice_paid: {
    labelKey: 'sales.orders.paymentStatusInvoicePaid',
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

type SortColumn = 'orderNumber' | 'customerName' | 'createdAt' | 'status' | 'totalNet';
type SortDirection = 'asc' | 'desc';

const DEFAULT_PAGE_SIZE = 25;

const SalesOrdersView = () => {
  const { t } = useTranslation();
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
    /** When set, opens drawer in EDIT mode pre-loading the existing invoice. */
    editInvoiceId?: string;
    /** When set, drawer opens in edit-with-diff mode (passed as incomingPositions). */
    incomingPositions?: import('@shared/invoicing').InvoicePosition[];
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
  const [filterCreatedBy, setFilterCreatedBy] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [instanceUsers, setInstanceUsers] = useState<{ id: string; name: string }[]>([]);
  const bulk = useBulkSelection();

  // Fetch instance users for creator filter
  useEffect(() => {
    if (!instanceId) return;
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('instance_id', instanceId)
      .then(({ data }) => {
        if (data) {
          setInstanceUsers(
            data
              .filter((p) => p.full_name && !p.full_name.includes('@'))
              .map((p) => ({ id: p.id, name: p.full_name! })),
          );
        }
      });
  }, [instanceId]);

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

    // Server-side filters
    if (filterCreatedBy !== 'all') query = query.eq('created_by', filterCreatedBy);
    if (filterPaymentStatus !== 'all') query = query.eq('payment_status', filterPaymentStatus);
    if (filterDeliveryType !== 'all') query = query.eq('delivery_type', filterDeliveryType);
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);

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
      {
        id: string;
        invoice_number: string;
        status: string;
        pdf_url: string;
        external_invoice_id: string | null;
        total_gross: number | null;
        total_net: number | null;
        provider: 'fakturownia' | 'ifirma';
      }
    > = {};
    if (orderIds.length > 0) {
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select(
          'id, sales_order_id, invoice_number, status, pdf_url, external_invoice_id, total_gross, positions, provider',
        )
        .in('sales_order_id', orderIds);
      if (!invError && invoices) {
        for (const inv of invoices) {
          // Per-position net sum — handles mixed VAT rates correctly (incl. zw at vat_rate=-1).
          // unit_price_gross in stored positions is already brutto (mapper-converted on submit).
          const positions = (inv.positions ?? []) as Array<{
            unit_price_gross: number;
            quantity: number;
            vat_rate: number;
            discount?: number;
          }>;
          const total_net = positions.reduce((sum, p) => {
            const rate = p.vat_rate === -1 ? 0 : Number(p.vat_rate) / 100;
            const unitNet =
              rate > 0 ? Number(p.unit_price_gross) / (1 + rate) : Number(p.unit_price_gross);
            const lineNet = unitNet * Number(p.quantity) * (1 - (Number(p.discount) || 0) / 100);
            return sum + lineNet;
          }, 0);
          invoiceMap[inv.sales_order_id] = { ...inv, total_net: Math.round(total_net * 100) / 100 };
        }
      }
    }

    // Resolve creator names
    const creatorIds = [
      ...new Set((data || []).map((o) => o.created_by).filter(Boolean)),
    ] as string[];
    const creatorMap = new Map<string, string>();
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', creatorIds);
      for (const p of profiles || []) {
        if (p.full_name && !p.full_name.includes('@')) creatorMap.set(p.id, p.full_name);
      }
    }

    const mapped: SalesOrder[] = (data || []).map((o) => {
      const inv = invoiceMap[o.id];
      return {
        id: o.id,
        orderNumber: o.order_number,
        createdBy: o.created_by || undefined,
        createdByName: o.created_by ? creatorMap.get(o.created_by) : undefined,
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
        packages: (
          (o.packages || []) as {
            shippingMethod?: string;
            shippingCost?: number;
            uberCost?: number;
          }[]
        ).map((pkg) => ({
          shippingMethod: pkg.shippingMethod || 'shipping',
          shippingCost: pkg.shippingCost ?? undefined,
          uberCost: pkg.uberCost ?? undefined,
        })),
        comment: o.comment || undefined,
        status: o.status as SalesOrder['status'],
        paymentStatus: inv
          ? inv.status === 'cancelled'
            ? ((o.payment_status || 'unpaid') as PaymentStatus)
            : inv.status === 'paid'
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
        invoiceExternalId: inv?.external_invoice_id || undefined,
        invoiceTotalGross: inv?.total_gross ?? undefined,
        invoiceTotalNet: inv?.total_net ?? undefined,
        invoiceProvider: inv?.provider || undefined,
        paymentMethod: o.payment_method || undefined,
        bankAccountNumber: o.bank_account_number || undefined,
        deliveryType: (o.delivery_type as SalesOrder['deliveryType']) || undefined,
      };
    });

    setOrders(mapped);
  }, [
    instanceId,
    currentPage,
    pageSize,
    sortColumn,
    sortDirection,
    debouncedSearch,
    filterCreatedBy,
    filterPaymentStatus,
    filterDeliveryType,
    filterStatus,
  ]);

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
          toast.error(t('sales.orders.toastInvoiceStatusError'));
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
        toast.error(t('sales.orders.toastPaymentStatusError'));
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
      toast.error(t('sales.orders.toastStatusError'));
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
      toast.error(t('sales.orders.toastTrackingError'));
      return;
    }
    setOrders((prev) =>
      prev.map((o) =>
        o.id === trackingDialog.orderId ? { ...o, trackingNumber: number, trackingUrl: url } : o,
      ),
    );
    setTrackingDialog({ open: false, orderId: '', orderNumber: '' });
    setTrackingInput('');
    toast.success(t('sales.orders.toastTrackingSaved'));
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await supabase.from('sales_roll_usages').delete().eq('order_id', orderId);
      await supabase.from('sales_order_items').delete().eq('order_id', orderId);
      await supabase.from('sales_orders').delete().eq('id', orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success(t('sales.orders.toastOrderDeleted'));
    } catch (err: unknown) {
      toast.error(
        t('sales.orders.toastOrderDeleteError', { message: (err as Error).message || '' }),
      );
    }
  };

  const handleBulkInvoice = async () => {
    const selectedOrders = orders.filter((o) => bulk.isSelected(o.id));
    if (selectedOrders.length === 0) return;

    // Validate same customer
    const customerIds = [...new Set(selectedOrders.map((o) => o.customerId).filter(Boolean))];
    if (customerIds.length > 1) {
      toast.error(t('sales.orders.toastBulkDifferentCustomers'));
      return;
    }
    if (customerIds.length === 0) {
      toast.error(t('sales.orders.toastBulkNoCustomer'));
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
      toast.info(t('sales.orders.toastCreatingShipment'));
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
        toast.error(t('sales.orders.toastShipmentError') + (errDetail ? ': ' + errDetail : ''));
        return;
      }
      if (data?.error) {
        const valPrice = data.valuation?.price_gross
          ? ` | Wycena: ${data.valuation.price_gross} PLN`
          : '';
        toast.error(t('common.error') + ': ' + data.error + valPrice, { duration: 10000 });
        return;
      }
      toast.success(t('sales.orders.toastShipmentCreated', { waybill: data.waybill_number }));
      fetchOrders();
    } catch {
      toast.error(t('sales.orders.toastShipmentCreateFailed'));
    } finally {
      setShipmentInFlight(null);
    }
  };

  const handleCancelShipment = async (orderId: string) => {
    try {
      toast.info(t('sales.orders.toastCancellingShipment'));
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
      toast.success(t('sales.orders.toastShipmentCancelled'));
    } catch (err: any) {
      toast.error(
        t('sales.orders.toastShipmentCancelFailed') + (err.message ? ': ' + err.message : ''),
      );
    }
  };

  const handlePrintLabel = async (orderId: string) => {
    try {
      toast.info(t('sales.orders.toastFetchingLabel'));
      const { data, error } = await supabase.functions.invoke('get-apaczka-label', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.pdf_base64) throw new Error(t('sales.orders.toastNoLabelData'));
      const pdfBytes = Uint8Array.from(atob(data.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(
        t('sales.orders.toastLabelFetchFailed') + (err.message ? ': ' + err.message : ''),
      );
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
        <h2 className="text-xl font-semibold text-foreground">{t('sales.orders.title')}</h2>
        <Button size="sm" onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4" />
          {t('sales.orders.addOrder')}
        </Button>
      </div>
      <div id="hint-infobox-slot" className="flex flex-col gap-4 shrink-0" />

      {/* Search + Filters */}
      <div className="shrink-0 pb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('sales.orders.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {instanceUsers.length > 0 && (
          <Select
            value={filterCreatedBy}
            onValueChange={(v) => {
              setFilterCreatedBy(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Opiekun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy opiekunowie</SelectItem>
              {instanceUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={filterPaymentStatus}
          onValueChange={(v) => {
            setFilterPaymentStatus(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder={t('sales.orders.payment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('sales.orders.allPayments')}</SelectItem>
            <SelectItem value="unpaid">{t('sales.orders.unpaid')}</SelectItem>
            <SelectItem value="paid">{t('sales.orders.paid')}</SelectItem>
            <SelectItem value="collective">Zbiorcza</SelectItem>
            <SelectItem value="collective_paid">{t('sales.orders.collectivePaid')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterDeliveryType}
          onValueChange={(v) => {
            setFilterDeliveryType(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Dostawa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie dostawy</SelectItem>
            <SelectItem value="shipping">{t('sales.orders.shipping')}</SelectItem>
            <SelectItem value="pickup">{t('sales.orders.pickup')}</SelectItem>
            <SelectItem value="uber">Uber</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="nowy">Nowy</SelectItem>
            <SelectItem value="wysłany">{t('sales.orders.shipped')}</SelectItem>
            <SelectItem value="anulowany">Anulowany</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {bulk.count > 0 && (
        <div className="shrink-0 flex items-center gap-3 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">Zaznaczono: {bulk.count}</span>
          <Button size="sm" variant="outline" onClick={bulk.clear}>
            Anuluj
          </Button>
          <Button size="sm" onClick={handleBulkInvoice}>
            {t('sales.orders.issueCollectiveInvoice')}
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
              <TableHead className="w-[120px]">Faktura</TableHead>
              <TableHead className="w-[160px]">Dostawa</TableHead>
              <TableHead className="w-[200px]">List przewozowy</TableHead>
              <SortableHead column="totalNet" className="text-right w-[170px]">
                Kwota netto
              </SortableHead>
              <TableHead className="w-[180px]">{t('sales.orders.payment')}</TableHead>
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
                    title={t('sales.orders.noOrders')}
                    description={t('sales.orders.createFirstOrder')}
                  />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedRows.has(order.id);
                const invoiceNetMismatch =
                  order.invoiceTotalGross != null &&
                  Math.abs(
                    Math.round((order.invoiceTotalGross / 1.23) * 100) / 100 - order.totalNet,
                  ) > 1;

                return (
                  <Fragment key={order.id}>
                    <TableRow
                      className={`group hover:bg-hover-strong cursor-pointer ${invoiceNetMismatch ? 'bg-red-50' : ''}`}
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
                          <div>
                            {order.orderNumber}
                            {order.createdByName && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500 text-white leading-none">
                                {order.createdByName.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="text-sm">
                        {format(parseISO(order.createdAt), 'dd.MM.yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.invoiceNumber && order.invoiceId ? (
                          <div className="flex items-start gap-1">
                            <div className="flex-1">
                              {order.invoicePdfUrl ? (
                                <a
                                  href={order.invoicePdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {order.invoiceNumber}
                                </a>
                              ) : (
                                <span>{order.invoiceNumber}</span>
                              )}
                              {(order.invoiceTotalNet ?? order.invoiceTotalGross) != null && (
                                <div
                                  className={`text-xs tabular-nums ${
                                    invoiceNetMismatch
                                      ? 'text-red-600 font-medium'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {formatCurrency(
                                    order.invoiceTotalNet ??
                                      Math.round((order.invoiceTotalGross! / 1.23) * 100) / 100,
                                    order.currency,
                                  )}
                                </div>
                              )}
                            </div>
                            <SalesOrderInvoiceActions
                              invoice={{
                                id: order.invoiceId,
                                number: order.invoiceNumber,
                                status: order.invoiceStatus || 'issued',
                                externalInvoiceId: order.invoiceExternalId || null,
                                provider: order.invoiceProvider || 'fakturownia',
                              }}
                              instanceId={instanceId!}
                              supabaseClient={supabase}
                              onChanged={() => fetchOrders()}
                              onRequestEdit={(invoiceId) =>
                                setInvoiceDrawerState({
                                  open: true,
                                  order,
                                  editInvoiceId: invoiceId,
                                })
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {order.deliveryType === 'pickup'
                          ? t('sales.orders.pickup')
                          : order.deliveryType === 'uber'
                            ? 'Uber'
                            : t('sales.orders.shipping')}
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
                                  toast.info(t('sales.orders.trackingInPreparation'));
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
                          ? t('sales.orders.free')
                          : formatCurrency(order.totalNet, order.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
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
                                      {t(cfg.labelKey)}
                                    </Badge>
                                  );
                                })()}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-0">
                              {(
                                Object.entries(PAYMENT_STATUS_CONFIG) as [
                                  PaymentStatus,
                                  { labelKey: string; className: string },
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
                                    {t(cfg.labelKey)}
                                  </Badge>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {order.paymentMethod && (
                            <span className="text-xs text-foreground block">
                              {{
                                cod: t('sales.orders.paymentCod'),
                                transfer: t('sales.orders.paymentTransfer'),
                                cash: t('sales.orders.paymentCash'),
                                card: t('sales.orders.paymentCard'),
                                free: t('sales.orders.free'),
                                tab: t('sales.orders.paymentTab'),
                              }[order.paymentMethod] ?? order.paymentMethod}
                            </span>
                          )}
                        </div>
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
                                    ? t('sales.orders.shipped')
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
                              <Badge className="bg-emerald-600 text-white">
                                {t('sales.orders.shipped')}
                              </Badge>
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
                            <OrderInvoiceMenuItems
                              order={order}
                              instanceId={instanceId}
                              supabaseClient={supabase}
                              onIssueInvoice={() => handleOpenInvoiceDrawer(order)}
                              onEditInvoice={(invoiceId) =>
                                setInvoiceDrawerState({
                                  open: true,
                                  order,
                                  editInvoiceId: invoiceId,
                                })
                              }
                              onChanged={fetchOrders}
                            />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateShipment(order.id);
                              }}
                            >
                              {t('sales.orders.createShipment')}
                            </DropdownMenuItem>
                            {order.apaczkaOrderId && order.status !== 'anulowany' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintLabel(order.id);
                                }}
                              >
                                {t('sales.orders.printLabel')}
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
                                {t('sales.orders.cancelShipment')}
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
                              {t('common.delete')}
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
          itemLabel={t('sales.orders.ordersLabel')}
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
        onRequestInvoiceEdit={({
          invoiceId,
          orderId,
          customerId,
          customerName,
          incomingPositions,
        }) => {
          // Open the existing CreateInvoiceDrawer in edit-with-diff mode, using
          // the freshly-saved order's positions as the diff baseline.
          const stubOrder: SalesOrder = {
            id: orderId,
            customerId,
            customerName,
            products: [],
            packages: [],
          } as unknown as SalesOrder;
          setInvoiceDrawerState({
            open: true,
            order: stubOrder,
            editInvoiceId: invoiceId,
            incomingPositions,
          });
        }}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={t('sales.orders.deleteOrder')}
        description={t('sales.orders.deleteOrderConfirm', {
          orderNumber: deleteConfirm.orderNumber,
        })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={() => handleDeleteOrder(deleteConfirm.orderId)}
      />
      <ConfirmDialog
        open={cancelShipmentConfirm.open}
        onOpenChange={(open) => setCancelShipmentConfirm((prev) => ({ ...prev, open }))}
        title={t('sales.orders.cancelShipment')}
        description={t('sales.orders.cancelShipmentConfirm', {
          orderNumber: cancelShipmentConfirm.orderNumber,
        })}
        confirmLabel={t('sales.orders.cancelShipment')}
        variant="destructive"
        onConfirm={() => handleCancelShipment(cancelShipmentConfirm.orderId)}
      />
      {invoiceDrawerState.order && (
        <CreateInvoiceDrawer
          open={invoiceDrawerState.open}
          existingInvoiceId={invoiceDrawerState.editInvoiceId}
          incomingPositions={invoiceDrawerState.incomingPositions}
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
              return shippingPkgs.map((pkg, i) =>
                bruttoCostToInvoicePosition(
                  pkg.shippingCost!,
                  shippingPkgs.length === 1 ? t('sales.orders.shipping') : `Wysyłka #${i + 1}`,
                ),
              );
            })(),
            ...(() => {
              const uberPkgs = (invoiceDrawerState.order!.packages || []).filter(
                (pkg) => pkg.shippingMethod === 'uber' && pkg.uberCost != null,
              );
              return uberPkgs.map((pkg, i) =>
                bruttoCostToInvoicePosition(
                  pkg.uberCost!,
                  uberPkgs.length === 1 ? 'Uber' : `Uber #${i + 1}`,
                ),
              );
            })(),
          ]}
          onSuccess={fetchOrders}
          supabaseClient={supabase}
          customerTable="sales_customers"
          bankAccounts={bankAccounts}
          defaultBankAccountNumber={invoiceDrawerState.order.bankAccountNumber}
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
          positions={bulkInvoiceState.orders.flatMap((order) => {
            const shippingPkgs = (order.packages || []).filter(
              (pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null,
            );
            const uberPkgs = (order.packages || []).filter(
              (pkg) => pkg.shippingMethod === 'uber' && pkg.uberCost != null,
            );
            return [
              ...order.products.map((p) => mapProductToInvoicePosition(p, order.customerDiscount)),
              ...shippingPkgs.map((pkg, i) =>
                bruttoCostToInvoicePosition(
                  pkg.shippingCost!,
                  shippingPkgs.length === 1
                    ? t('sales.orders.shippingLabel', { orderNumber: order.orderNumber })
                    : t('sales.orders.shippingLabelMulti', {
                        index: i + 1,
                        orderNumber: order.orderNumber,
                      }),
                ),
              ),
              ...uberPkgs.map((pkg, i) =>
                bruttoCostToInvoicePosition(
                  pkg.uberCost!,
                  uberPkgs.length === 1
                    ? `Uber (${order.orderNumber})`
                    : `Uber #${i + 1} (${order.orderNumber})`,
                ),
              ),
            ];
          })}
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
            toast.success(t('sales.orders.collectiveInvoiceSuccess', { count: ids.length }));
          }}
          supabaseClient={supabase}
          customerTable="sales_customers"
          bankAccounts={bankAccounts}
          defaultBankAccountNumber={bulkInvoiceState.orders[0]?.bankAccountNumber}
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
