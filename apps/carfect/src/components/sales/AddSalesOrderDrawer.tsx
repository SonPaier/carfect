import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@shared/ui';
import { Button } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Label } from '@shared/ui';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInstanceData } from '@/hooks/useInstanceData';
import { useSalesSettings } from './hooks/useSalesSettings';
import { getNextOrderNumber } from './SalesOrdersView';
import AddEditSalesCustomerDrawer from './AddEditSalesCustomerDrawer';
import SalesProductSelectionDrawer from './SalesProductSelectionDrawer';
import { ImagePasteZone } from '@/components/ui/image-paste-zone';

import { VAT_RATE } from './constants';
import {
  createRollUsage,
  deleteRollUsagesByOrder,
  fetchRollRemainingMb,
} from './services/rollService';
import { m2ToMb, mbToM2 } from './types/rolls';
import { useCustomerSearch } from './hooks/useCustomerSearch';
import {
  useOrderPackages,
  type OrderProduct,
  type OrderPackage,
  type DeliveryType,
  getItemKey,
  createDefaultPackage,
} from './hooks/useOrderPackages';
import { CustomerSearchSection } from './order-drawer/CustomerSearchSection';
import { PackagesSection } from './order-drawer/PackagesSection';
import { OrderSummarySection } from './order-drawer/OrderSummarySection';
import { PaymentSection } from './order-drawer/PaymentSection';
import { ShippingAddressSection } from './order-drawer/ShippingAddressSection';
import { type AddressData } from './order-drawer/AddressFields';
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
import type { InvoicePosition } from '@shared/invoicing';
import {
  mapProductToInvoicePosition,
  bruttoCostToInvoicePosition,
} from './utils/invoicePositionMapper';
import { UpdateInvoiceConfirmDialog } from './UpdateInvoiceConfirmDialog';

// Re-export types used externally
export type { OrderPackage, OrderProduct, DeliveryType };

type PaymentMethod = 'cod' | 'transfer' | 'free' | 'cash' | 'card' | 'tab';

export interface EditOrderData {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerDiscount?: number;
  products: OrderProduct[];
  packages?: OrderPackage[];
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  bankAccountNumber: string;
  comment: string;
  isNetPayer?: boolean;
  sendEmail: boolean;
  attachments?: string[];
  shippingAddress?: AddressData;
}

interface AddSalesOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCustomer?: { id: string; name: string; discountPercent?: number } | null;
  editOrder?: EditOrderData | null;
  onOrderCreated?: () => void;
  /**
   * Called after a successful save when the user confirmed they want to update the linked
   * invoice. Parent should open InvoiceDrawer in edit-with-diff mode.
   */
  onRequestInvoiceEdit?: (params: {
    invoiceId: string;
    orderId: string;
    customerId: string;
    customerName: string;
    incomingPositions: InvoicePosition[];
  }) => void;
}

const AddSalesOrderDrawer = ({
  open,
  onOpenChange,
  initialCustomer,
  editOrder,
  onOrderCreated,
  onRequestInvoiceEdit,
}: AddSalesOrderDrawerProps) => {
  const { t } = useTranslation();
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;
  const { data: instanceData } = useInstanceData(instanceId);
  const { data: salesSettings } = useSalesSettings(instanceId);
  const bankAccounts = useMemo(() => {
    // Prefer sales_instance_settings, fallback to instances
    const raw = salesSettings?.bank_accounts ?? instanceData?.bank_accounts;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map((a: unknown) =>
        typeof a === 'string'
          ? { name: '', number: a }
          : {
              name: (a as { name?: string; number?: string }).name || '',
              number: (a as { name?: string; number?: string }).number || '',
            },
      )
      .filter((a: { number: string }) => a.number.trim() !== '');
  }, [salesSettings?.bank_accounts, instanceData?.bank_accounts]);

  // Hooks
  const customerSearch = useCustomerSearch(instanceId);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const orderPackages = useOrderPackages({ products, setProducts });
  const {
    isDirty,
    markDirty,
    resetDirty,
    handleClose: handleUnsavedClose,
    dialogProps,
  } = useUnsavedChanges();

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isNetPayer, setIsNetPayer] = useState(false);
  const [codAmountOverrides, setCodAmountOverrides] = useState<Record<string, number | undefined>>(
    {},
  );
  const [sendEmail, setSendEmail] = useState(false);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [shippingAddress, setShippingAddress] = useState<AddressData>({
    country: 'PL',
    street: '',
    streetLine2: '',
    postalCode: '',
    city: '',
  });
  // When loading an edited order with a saved address, skip the next customer-fetch override
  const skipAddressOverrideRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [customerAddress, setCustomerAddress] = useState<{ postalCode: string; city: string }>({
    postalCode: '',
    city: '',
  });

  // Add customer drawer state
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addCustomerInitialQuery, setAddCustomerInitialQuery] = useState('');

  // Existing invoice (for the "edit order ⇒ update invoice" confirm flow)
  const [existingInvoice, setExistingInvoice] = useState<{
    id: string;
    number: string | null;
    provider: 'fakturownia' | 'ifirma';
  } | null>(null);
  const [confirmInvoiceDialogOpen, setConfirmInvoiceDialogOpen] = useState(false);
  const pendingInvoiceEditRef = useRef(false);
  /** Set right before handing off to parent's invoice edit drawer — suppresses the
   * unsaved-changes prompt that would otherwise fire from focus-steal events. */
  const closingForInvoiceEditRef = useRef(false);

  const isEdit = !!editOrder;

  // Set initial data when opening
  useEffect(() => {
    if (open) {
      resetDirty();
      // Reset on each fresh open — keeps the flag set after close so late
      // focus-steal events from the spawned InvoiceDrawer don't re-prompt.
      closingForInvoiceEditRef.current = false;
    }
    if (open && editOrder) {
      customerSearch.setSelectedCustomer({
        id: editOrder.customerId,
        name: editOrder.customerName,
        discountPercent: editOrder.customerDiscount,
      });
      setProducts(editOrder.products);
      const editPackages =
        editOrder.packages && editOrder.packages.length > 0
          ? editOrder.packages
          : [createDefaultPackage()];
      orderPackages.setPackages(editPackages);
      setPaymentMethod(editOrder.paymentMethod || 'cod');
      setBankAccountNumber(editOrder.bankAccountNumber || '');
      setIsNetPayer(editOrder.isNetPayer ?? false);
      setComment(editOrder.comment);
      setSendEmail(editOrder.sendEmail);
      setAttachments(editOrder.attachments || []);
      if (editOrder.shippingAddress) {
        setShippingAddress(editOrder.shippingAddress);
        skipAddressOverrideRef.current = true;
      }
    } else if (open && !editOrder) {
      if (orderPackages.packages.length === 0) {
        orderPackages.setPackages([createDefaultPackage()]);
      }
      if (initialCustomer) {
        customerSearch.setSelectedCustomer({
          id: initialCustomer.id,
          name: initialCustomer.name,
          discountPercent: initialCustomer.discountPercent,
        });
      }
    }
    if (!open) {
      customerSearch.setSelectedCustomer(null);
      setExistingInvoice(null);
      setConfirmInvoiceDialogOpen(false);
      pendingInvoiceEditRef.current = false;
      // closingForInvoiceEditRef stays — late focus-steal events still need to short-circuit
    }
  }, [open, initialCustomer, editOrder]);

  // Load active (non-cancelled) invoice linked to the edited order
  useEffect(() => {
    if (!open || !editOrder?.id) {
      setExistingInvoice(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('invoices')
      .select('id, invoice_number, status, provider')
      .eq('sales_order_id', editOrder.id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: {
            id: string;
            invoice_number: string | null;
            status: string;
            provider: string | null;
          } | null;
        }) => {
          if (cancelled || !data) return;
          setExistingInvoice({
            id: data.id,
            number: data.invoice_number,
            provider: (data.provider as 'fakturownia' | 'ifirma') || 'fakturownia',
          });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [open, editOrder?.id]);

  // Set default bank account when instance data loads
  useEffect(() => {
    if (bankAccounts.length > 0 && !bankAccountNumber) {
      setBankAccountNumber(bankAccounts[0].number);
    }
  }, [bankAccounts]);

  // Fetch customer address for Apaczka valuation
  useEffect(() => {
    if (!customerSearch.selectedCustomer?.id) {
      setCustomerAddress({ postalCode: '', city: '' });
      setShippingAddress({ country: 'PL', street: '', streetLine2: '', postalCode: '', city: '' });
      return;
    }
    supabase
      .from('sales_customers')
      .select(
        'shipping_postal_code, shipping_city, shipping_country_code, shipping_street, shipping_street_line2',
      )
      .eq('id', customerSearch.selectedCustomer.id)
      .single()
      .then(
        ({
          data,
        }: {
          data: {
            shipping_postal_code: string | null;
            shipping_city: string | null;
            shipping_country_code: string | null;
            shipping_street: string | null;
            shipping_street_line2: string | null;
          } | null;
        }) => {
          if (data) {
            setCustomerAddress({
              postalCode: data.shipping_postal_code || '',
              city: data.shipping_city || '',
            });
            if (skipAddressOverrideRef.current) {
              skipAddressOverrideRef.current = false;
            } else {
              setShippingAddress({
                country: data.shipping_country_code || 'PL',
                street: data.shipping_street || '',
                streetLine2: data.shipping_street_line2 || '',
                postalCode: data.shipping_postal_code || '',
                city: data.shipping_city || '',
              });
            }
          }
        },
      );
  }, [customerSearch.selectedCustomer?.id]);

  const [nextOrderNumber, setNextOrderNumber] = useState('');
  useEffect(() => {
    if (open && !isEdit && instanceId) {
      getNextOrderNumber(instanceId).then(setNextOrderNumber);
    }
  }, [open, isEdit, instanceId]);

  /* ── Totals ── */

  const customerDiscount = customerSearch.selectedCustomer?.discountPercent || 0;

  // Sync isNetPayer when customer changes (only for new orders — edit restores from saved order)
  useEffect(() => {
    if (!isEdit && customerSearch.selectedCustomer) {
      setIsNetPayer(customerSearch.selectedCustomer.isNetPayer ?? false);
    }
  }, [customerSearch.selectedCustomer?.id, isEdit]);

  /** Extract roll width (mm) from product name, e.g. "Ultrafit XP Crystal - 1220mm x 30m" → 1220 */
  const getProductWidthMm = (p: OrderProduct): number => {
    const match = p.name.match(/(\d{3,4})\s*mm/);
    return match ? parseInt(match[1]) : 1524; // fallback to common width
  };

  /** Effective quantity in m²: from roll assignments, or requiredMb converted to m², or plain quantity */
  const getEffectiveQty = (p: OrderProduct) =>
    p.rollAssignments?.length
      ? p.rollAssignments.reduce((sum, ra) => sum + ra.usageM2, 0)
      : p.priceUnit === 'meter' && p.requiredMb
        ? mbToM2(p.requiredMb, getProductWidthMm(p))
        : p.quantity;

  // Auto-update declared value for packages where user hasn't manually set it
  const autoUpdateSignature = orderPackages.packages
    .map((p) => `${p.productKeys.join(',')}-${p.declaredValueManual ? '1' : '0'}`)
    .join('|');

  useEffect(() => {
    const newPackages = orderPackages.packages.map((pkg) => {
      if (pkg.declaredValueManual) return pkg;
      const pkgProducts = products.filter((p) => pkg.productKeys.includes(getItemKey(p)));
      if (pkgProducts.length === 0)
        return pkg.declaredValue !== undefined ? { ...pkg, declaredValue: undefined } : pkg;
      const autoValue = pkgProducts.reduce((sum, p) => {
        const qty = getEffectiveQty(p);
        const discount = p.discountPercent ?? (p.excludeFromDiscount ? 0 : customerDiscount);
        const net = p.priceNet * qty * (1 - discount / 100);
        return sum + (isNetPayer ? net : net * (1 + VAT_RATE));
      }, 0);
      const rounded = Math.round(autoValue * 100) / 100;
      return pkg.declaredValue === rounded ? pkg : { ...pkg, declaredValue: rounded };
    });
    const changed = newPackages.some((pkg, i) => pkg !== orderPackages.packages[i]);
    if (changed) {
      orderPackages.setPackages(newPackages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, customerDiscount, isNetPayer, autoUpdateSignature]);

  const hasShipping = orderPackages.packages.some((p) => p.shippingMethod === 'shipping');

  const getProductTotal = (p: OrderProduct) => p.priceNet * getEffectiveQty(p);

  const subtotalNet = useMemo(
    () => products.reduce((sum, p) => sum + getProductTotal(p), 0),
    [products],
  );

  // Per-product discount: each product uses its own discountPercent (or customerDiscount fallback).
  // Products flagged excludeFromDiscount with no explicit per-product override get 0%.
  const discountAmount = useMemo(
    () =>
      products.reduce((sum, p) => {
        const discount = p.discountPercent ?? (p.excludeFromDiscount ? 0 : customerDiscount);
        return sum + getProductTotal(p) * (discount / 100);
      }, 0),
    [products, customerDiscount],
  );

  // Shipping costs from Apaczka — always brutto, unaffected by netto/brutto toggle
  const shippingCosts = useMemo(
    () =>
      orderPackages.packages
        .filter((pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null)
        .map((pkg) => pkg.shippingCost!),
    [orderPackages.packages],
  );
  // Uber costs — user-entered, always brutto. Not sent to Apaczka, but included on invoice.
  const uberCosts = useMemo(
    () =>
      orderPackages.packages
        .filter((pkg) => pkg.shippingMethod === 'uber' && pkg.uberCost != null)
        .map((pkg) => pkg.uberCost!),
    [orderPackages.packages],
  );
  const shippingBruttoTotal = shippingCosts.reduce((sum, cost) => sum + cost, 0);
  const uberBruttoTotal = uberCosts.reduce((sum, cost) => sum + cost, 0);
  const deliveryBruttoTotal = shippingBruttoTotal + uberBruttoTotal;
  const deliveryNetTotal = deliveryBruttoTotal / (1 + VAT_RATE);

  const productsNet = Math.max(0, subtotalNet - discountAmount);
  const totalNet = productsNet + deliveryNetTotal;
  // Delivery (shipping + uber) is always added as brutto regardless of payer type
  const totalGross = isNetPayer ? productsNet + deliveryBruttoTotal : totalNet * (1 + VAT_RATE);

  /* ── Handlers ── */

  const handleAddNewCustomer = () => {
    setAddCustomerInitialQuery(customerSearch.customerSearch);
    customerSearch.setDropdownOpen(false);
    setAddCustomerOpen(true);
  };

  const handleCustomerSaved = () => {
    if (customerSearch.customerSearch.length >= 2) {
      customerSearch.searchCustomers(customerSearch.customerSearch);
    }
  };

  const handleClose = () => {
    // We're handing off to parent's invoice edit drawer — bypass the unsaved prompt.
    if (closingForInvoiceEditRef.current) return;
    handleUnsavedClose(handleSubmit, () => {
      resetDirty();
      resetForm();
      onOpenChange(false);
    });
  };

  const resetForm = () => {
    customerSearch.setSelectedCustomer(null);
    customerSearch.setCustomerSearch('');
    setProducts([]);
    orderPackages.setPackages([createDefaultPackage()]);
    orderPackages.setActivePackageId(null);
    setPaymentMethod('cod');
    setBankAccountNumber(bankAccounts.length > 0 ? bankAccounts[0].number : '');
    setSendEmail(false);
    setComment('');
    setAttachments([]);
    setShippingAddress({ country: 'PL', street: '', streetLine2: '', postalCode: '', city: '' });
  };

  const handleSubmit = async () => {
    if (!instanceId) {
      toast.error(t('sales.order.errorNoInstance'));
      return;
    }
    if (!customerSearch.selectedCustomer) {
      toast.error(t('sales.order.errorNoCustomer'));
      return;
    }
    if (products.length === 0) {
      toast.error(t('sales.order.errorNoProducts'));
      return;
    }

    // Edit-mode + active invoice + dirty form → ask whether to update the invoice.
    // pendingInvoiceEditRef === true means the user already chose in the dialog,
    // so we skip the prompt and proceed with save.
    if (
      isEdit &&
      existingInvoice &&
      existingInvoice.provider === 'fakturownia' &&
      isDirty &&
      !pendingInvoiceEditRef.current &&
      !confirmInvoiceDialogOpen
    ) {
      setConfirmInvoiceDialogOpen(true);
      return;
    }

    // If the user chose "Tak edytuj fakturę", validate that we can build invoice
    // positions BEFORE saving — otherwise we'd end with a saved order but no FV update.
    if (pendingInvoiceEditRef.current) {
      try {
        buildInvoicePositions();
      } catch (err: unknown) {
        pendingInvoiceEditRef.current = false;
        closingForInvoiceEditRef.current = false;
        toast.error((err as Error).message);
        return;
      }
    }

    // Validate roll availability before saving (multi-roll assignments)
    // Aggregate usage per roll across ALL products to catch same-roll-multiple-products
    const allAssignments = products.flatMap((p) =>
      (p.rollAssignments || [])
        .filter((a) => a.rollId && a.usageM2 > 0)
        .map((a) => ({ ...a, productName: p.name })),
    );
    if (allAssignments.length > 0) {
      setSaving(true);
      try {
        // Group total usage per roll across all products in this order
        const usageByRoll = new Map<string, { totalM2: number; productNames: string[] }>();
        for (const a of allAssignments) {
          const existing = usageByRoll.get(a.rollId);
          if (existing) {
            existing.totalM2 += a.usageM2;
            if (!existing.productNames.includes(a.productName)) {
              existing.productNames.push(a.productName);
            }
          } else {
            usageByRoll.set(a.rollId, { totalM2: a.usageM2, productNames: [a.productName] });
          }
        }

        // Validate each roll's total usage against remaining capacity
        for (const [rollId, usage] of usageByRoll) {
          const rollData = await fetchRollRemainingMb(rollId, isEdit ? editOrder?.id : undefined);
          const remainingM2 = mbToM2(rollData.remainingMb, rollData.widthMm);
          if (usage.totalM2 > remainingM2 + 0.01) {
            // small epsilon for floating point
            const shortage = (usage.totalM2 - remainingM2).toFixed(2);
            const names = usage.productNames.join(', ');
            toast.error(
              t('salesOrder.rollNotEnoughMaterial', {
                names,
                needed: usage.totalM2.toFixed(2),
                remaining: remainingM2.toFixed(2),
                shortage,
              }),
            );
            setSaving(false);
            return;
          }
        }
      } catch (err: unknown) {
        toast.error(t('salesOrder.rollValidationError', { error: (err as Error).message || '' }));
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Convert productKeys from UI UUIDs to sort_order indices for stable DB storage
      const keyToIndex = new Map(products.map((p, idx) => [getItemKey(p), String(idx)]));
      const packagesPayload =
        orderPackages.packages.length > 0
          ? orderPackages.packages.map((pkg) => ({
              ...pkg,
              productKeys: pkg.productKeys.map((k) => keyToIndex.get(k) ?? k),
            }))
          : null;
      const effectiveDeliveryType =
        orderPackages.packages.length > 0
          ? orderPackages.packages[0].shippingMethod
          : ('shipping' as DeliveryType);

      if (isEdit && editOrder) {
        const { error } = (await supabase
          .from('sales_orders')
          .update({
            customer_id: customerSearch.selectedCustomer.id,
            customer_name: customerSearch.selectedCustomer.name,
            total_net: totalNet,
            total_gross: totalGross,
            comment: comment || null,
            delivery_type: effectiveDeliveryType,
            payment_method: paymentMethod,
            bank_account_number: bankAccountNumber || null,
            is_net_payer: isNetPayer,
            packages: packagesPayload,
            attachments: attachments.map((url, i) => ({
              url,
              name: `formatka-${i + 1}`,
              uploadedAt: new Date().toISOString(),
            })),
            shipping_address: hasShipping ? shippingAddress : null,
          })
          .eq('id', editOrder.id)) as { error: { message: string } | null };

        if (error) throw error;

        // Delete old roll usages and items explicitly (don't rely on cascade)
        await supabase.from('sales_roll_usages').delete().eq('order_id', editOrder.id);
        await supabase.from('sales_order_items').delete().eq('order_id', editOrder.id);
        if (products.length > 0) {
          const items = products.map((p, idx) => {
            const qty = getEffectiveQty(p);
            return {
              order_id: editOrder.id,
              product_id: p.productId || null,
              variant_id: p.productType === 'other' ? null : p.variantId || null,
              name: p.name,
              quantity: qty,
              price_net: p.priceNet,
              price_unit: p.priceUnit || 'szt.',
              product_type: p.productType || 'roll',
              vehicle: p.productType === 'other' ? null : p.vehicle || null,
              sort_order: idx,
              discount_percent: p.discountPercent ?? customerDiscount ?? 0,
              required_mb: p.requiredMb ?? null,
            };
          });
          const { data: insertedItems, error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(items)
            .select('id');

          if (itemsError) throw itemsError;

          // Create roll usages for meter-based products (multi-roll)
          if (insertedItems) {
            for (let i = 0; i < products.length; i++) {
              const p = products[i];
              const assignments = p.rollAssignments || [];
              for (const a of assignments) {
                if (a.rollId && a.usageM2 > 0 && insertedItems[i]?.id) {
                  try {
                    await createRollUsage({
                      rollId: a.rollId,
                      orderId: editOrder.id,
                      orderItemId: insertedItems[i].id,
                      usedM2: a.usageM2,
                      usedMb: m2ToMb(a.usageM2, a.widthMm),
                      instanceId: instanceId!,
                    });
                  } catch (e) {
                    console.error('Roll usage creation failed:', e);
                    toast.error(
                      t('salesOrder.rollUsageSaveError', { error: (e as Error)?.message || '' }),
                    );
                  }
                }
              }
            }
          }
        }

        toast.success(t('salesOrder.orderUpdated'));
      } else {
        // Regenerate order number at save time to avoid race conditions
        const freshOrderNumber = await getNextOrderNumber(instanceId!);
        const { data: order, error } = await supabase
          .from('sales_orders')
          .insert({
            instance_id: instanceId,
            customer_id: customerSearch.selectedCustomer.id,
            order_number: freshOrderNumber,
            customer_name: customerSearch.selectedCustomer.name,
            total_net: totalNet,
            total_gross: totalGross,
            currency: 'PLN',
            comment: comment || null,
            delivery_type: effectiveDeliveryType,
            payment_method: paymentMethod,
            bank_account_number: bankAccountNumber || null,
            is_net_payer: isNetPayer,
            status: 'nowy',
            created_by: user?.id || null,
            packages: packagesPayload,
            attachments: attachments.map((url, i) => ({
              url,
              name: `formatka-${i + 1}`,
              uploadedAt: new Date().toISOString(),
            })),
            shipping_address: hasShipping ? shippingAddress : null,
          })
          .select('id')
          .single();

        if (error) throw error;

        if (order?.id && products.length > 0) {
          const items = products.map((p, idx) => {
            // For m² products, store total assigned m² as quantity
            const qty = getEffectiveQty(p);
            return {
              order_id: order.id,
              product_id: p.productId || null,
              variant_id: p.productType === 'other' ? null : p.variantId || null,
              name: p.name,
              quantity: qty,
              price_net: p.priceNet,
              price_unit: p.priceUnit || 'szt.',
              product_type: p.productType || 'roll',
              vehicle: p.productType === 'other' ? null : p.vehicle || null,
              sort_order: idx,
              discount_percent: p.discountPercent ?? customerDiscount ?? 0,
              required_mb: p.requiredMb ?? null,
            };
          });
          const { data: insertedItems, error: itemsError } = await supabase
            .from('sales_order_items')
            .insert(items)
            .select('id');

          if (itemsError) throw itemsError;

          // Create roll usages for meter-based products (multi-roll)
          if (insertedItems) {
            for (let i = 0; i < products.length; i++) {
              const p = products[i];
              const assignments = p.rollAssignments || [];
              for (const a of assignments) {
                if (a.rollId && a.usageM2 > 0 && insertedItems[i]?.id) {
                  try {
                    await createRollUsage({
                      rollId: a.rollId,
                      orderId: order.id,
                      orderItemId: insertedItems[i].id,
                      usedM2: a.usageM2,
                      usedMb: m2ToMb(a.usageM2, a.widthMm),
                      instanceId: instanceId!,
                    });
                  } catch (e) {
                    console.error('Roll usage creation failed:', e);
                    toast.error(
                      t('salesOrder.rollUsageSaveError', { error: (e as Error)?.message || '' }),
                    );
                  }
                }
              }
            }
          }
        }

        toast.success(t('salesOrder.orderCreated'));

        if (sendEmail && order?.id) {
          try {
            const { data: emailRes, error: emailErr } = await supabase.functions.invoke(
              'send-order-confirmation',
              {
                body: { orderId: order.id },
              },
            );
            if (emailRes?.error) {
              toast.error(
                t('salesOrder.orderSavedEmailFailedWithError', { error: emailRes.error }),
              );
            } else if (emailErr) {
              toast.error(t('salesOrder.orderSavedEmailFailed'));
            } else {
              toast.success(t('salesOrder.confirmationEmailSent'));
            }
          } catch {
            toast.error(t('salesOrder.orderSavedEmailFailed'));
          }
        }
      }

      resetDirty();
      onOrderCreated?.();

      // After successful save, if the user chose "Tak, edytuj fakturę",
      // hand off the freshly saved positions to the parent so it can open
      // InvoiceDrawer in edit-with-diff mode. Then close this drawer.
      if (
        pendingInvoiceEditRef.current &&
        existingInvoice &&
        onRequestInvoiceEdit &&
        editOrder?.id &&
        customerSearch.selectedCustomer
      ) {
        const incomingPositions = buildInvoicePositions();
        closingForInvoiceEditRef.current = true;
        onRequestInvoiceEdit({
          invoiceId: existingInvoice.id,
          orderId: editOrder.id,
          customerId: customerSearch.selectedCustomer.id,
          customerName: customerSearch.selectedCustomer.name,
          incomingPositions,
        });
      }
      pendingInvoiceEditRef.current = false;
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      pendingInvoiceEditRef.current = false;
      closingForInvoiceEditRef.current = false;
      toast.error(t('salesOrder.orderSaveError', { error: err.message || '' }));
    } finally {
      setSaving(false);
    }
  };

  // Build invoice positions from current order (used as incomingPositions for the diff)
  const buildInvoicePositions = () => {
    const shippingPkgs = orderPackages.packages.filter(
      (pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null,
    );
    const uberPkgs = orderPackages.packages.filter(
      (pkg) => pkg.shippingMethod === 'uber' && pkg.uberCost != null,
    );
    return [
      ...products.map((p) => mapProductToInvoicePosition(p, customerDiscount)),
      ...shippingPkgs.map((pkg, i) =>
        bruttoCostToInvoicePosition(
          pkg.shippingCost!,
          shippingPkgs.length === 1 ? t('sales.orders.shipping') : `Wysyłka #${i + 1}`,
        ),
      ),
      ...uberPkgs.map((pkg, i) =>
        bruttoCostToInvoicePosition(
          pkg.uberCost!,
          uberPkgs.length === 1 ? 'Uber' : `Uber #${i + 1}`,
        ),
      ),
    ];
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleClose();
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full flex flex-col h-full p-0 gap-0 bg-white text-foreground [&_label]:text-foreground sm:max-w-[80vw]"
          hasDarkOverlay
          hideCloseButton
          onInteractOutside={(e) => {
            e.preventDefault();
            if (!orderPackages.productDrawerOpen && !addCustomerOpen && !confirmInvoiceDialogOpen) {
              handleClose();
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (!orderPackages.productDrawerOpen && !addCustomerOpen && !confirmInvoiceDialogOpen) {
              handleClose();
            }
          }}
        >
          {/* Fixed Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="w-full flex items-center justify-between">
              <SheetTitle>
                {isEdit
                  ? t('salesOrder.editTitle', { number: editOrder?.orderNumber })
                  : t('salesOrder.addTitle', { number: nextOrderNumber })}
              </SheetTitle>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-hover transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <CustomerSearchSection
                {...customerSearch}
                handleSelectCustomer={(c) => {
                  customerSearch.handleSelectCustomer(c);
                  markDirty();
                }}
                setSelectedCustomer={(c) => {
                  customerSearch.setSelectedCustomer(c);
                  if (c) markDirty();
                }}
                onAddNewCustomer={handleAddNewCustomer}
              />

              {customerSearch.selectedCustomer && customerDiscount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-sky-50 border border-sky-200 text-sky-700">
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="text-sm">
                    {t('salesOrder.discountApplied', { percent: customerDiscount })}
                  </span>
                </div>
              )}

              <PaymentSection
                paymentMethod={paymentMethod}
                setPaymentMethod={(v) => {
                  setPaymentMethod(v);
                  markDirty();
                }}
                bankAccountNumber={bankAccountNumber}
                setBankAccountNumber={(v) => {
                  setBankAccountNumber(v);
                  markDirty();
                }}
                bankAccounts={bankAccounts}
                isNetPayer={isNetPayer}
                setIsNetPayer={(v) => {
                  setIsNetPayer(v);
                  markDirty();
                }}
              />

              <PackagesSection
                packages={orderPackages.packages}
                products={products}
                instanceId={instanceId}
                onRemovePackage={(...args) => {
                  markDirty();
                  orderPackages.removePackage(...args);
                }}
                onShippingMethodChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageShippingMethod(...args);
                }}
                onPackagingTypeChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackagePackagingType(...args);
                }}
                onDimensionChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageDimension(...args);
                }}
                onCourierChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageCourier(...args);
                }}
                onWeightChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageWeight(...args);
                }}
                onContentsChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageContents(...args);
                }}
                onDeclaredValueChange={(pkgId, value, isManual) => {
                  markDirty();
                  orderPackages.updatePackageDeclaredValue(pkgId, value, isManual);
                }}
                onOversizedChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageOversized(...args);
                }}
                onShippingCostChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageShippingCost(...args);
                }}
                onUberCostChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageUberCost(...args);
                }}
                onAddProduct={(packageId) => {
                  markDirty();
                  orderPackages.setActivePackageId(packageId);
                  orderPackages.setProductDrawerOpen(true);
                }}
                onRemoveProduct={(pkgId, itemKey) => {
                  markDirty();
                  orderPackages.removeProductFromPackage(pkgId, itemKey);
                }}
                onUpdateQuantity={(...args) => {
                  markDirty();
                  orderPackages.updateQuantity(...args);
                }}
                onUpdateVehicle={(...args) => {
                  markDirty();
                  orderPackages.updateVehicle(...args);
                }}
                onUpdateRollAssignment={(...args) => {
                  markDirty();
                  orderPackages.updateRollAssignment(...args);
                }}
                onSetRollAssignments={(...args) => {
                  markDirty();
                  orderPackages.setRollAssignments(...args);
                }}
                onUpdateRequiredMb={(...args) => {
                  markDirty();
                  orderPackages.updateRequiredMb(...args);
                }}
                onUpdateProductDiscount={(...args) => {
                  markDirty();
                  orderPackages.updateProductDiscount(...args);
                }}
                onToggleDiscount={(...args) => {
                  markDirty();
                  orderPackages.toggleExcludeFromDiscount(...args);
                }}
                customerDiscount={customerDiscount}
                customerName={customerSearch.selectedCustomer?.name}
                onAddPackage={(...args) => {
                  markDirty();
                  orderPackages.addPackage(...args);
                }}
                customerPostalCode={customerAddress.postalCode}
                customerCity={customerAddress.city}
                paymentMethod={paymentMethod}
                totalGross={totalGross}
                bankAccountNumber={bankAccountNumber}
                availableCouriers={instanceData?.apaczka_services || []}
                codAmountOverrides={codAmountOverrides}
                onCodAmountChange={(pkgId, value) => {
                  markDirty();
                  setCodAmountOverrides((prev) => ({ ...prev, [pkgId]: value }));
                }}
                isNetPayer={isNetPayer}
                excludeOrderId={editOrder?.id}
              />

              {hasShipping && (
                <ShippingAddressSection
                  address={shippingAddress}
                  onChange={(v) => {
                    setShippingAddress(v);
                    markDirty();
                  }}
                />
              )}

              {/* Uwagi + Formatki — same row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-comment">{t('salesOrder.orderComment')}</Label>
                  <Textarea
                    id="order-comment"
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      markDirty();
                    }}
                    rows={3}
                  />
                </div>
                <ImagePasteZone
                  images={attachments}
                  onImagesChange={(v) => {
                    setAttachments(v);
                    markDirty();
                  }}
                  pathPrefix={instanceId || 'unknown'}
                  maxImages={10}
                  disabled={saving}
                />
              </div>

              {/* Summary — at the end */}
              {products.length > 0 && (
                <OrderSummarySection
                  products={products}
                  subtotalNet={subtotalNet}
                  discountAmount={discountAmount}
                  customerDiscount={customerDiscount}
                  shippingCosts={shippingCosts}
                  uberCosts={uberCosts}
                  totalNet={totalNet}
                  totalGross={totalGross}
                  isNetPayer={isNetPayer}
                  paymentMethod={paymentMethod}
                />
              )}

              {/* Email checkbox — after summary */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-email"
                  checked={sendEmail}
                  onCheckedChange={(v) => {
                    setSendEmail(v === true);
                    markDirty();
                  }}
                />
                <Label htmlFor="send-email" className="text-sm font-normal cursor-pointer">
                  {t('salesOrder.sendConfirmationEmail')}
                </Label>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {t('salesOrder.saving')}
                  </>
                ) : isEdit ? (
                  t('salesOrder.saveChanges')
                ) : (
                  t('salesOrder.addOrder')
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {instanceId && (
        <>
          <AddEditSalesCustomerDrawer
            open={addCustomerOpen}
            onOpenChange={setAddCustomerOpen}
            customer={null}
            instanceId={instanceId}
            onSaved={handleCustomerSaved}
          />
          <SalesProductSelectionDrawer
            open={orderPackages.productDrawerOpen}
            onClose={() => {
              orderPackages.setProductDrawerOpen(false);
              orderPackages.setActivePackageId(null);
            }}
            instanceId={instanceId}
            selectedProductIds={[]}
            selectedVariantIds={[]}
            customerName={customerSearch.selectedCustomer?.name}
            onConfirm={(...args) => {
              markDirty();
              orderPackages.handleProductsConfirm(...args);
            }}
          />
        </>
      )}
      <UnsavedChangesDialog {...dialogProps} />
      <UpdateInvoiceConfirmDialog
        open={confirmInvoiceDialogOpen}
        onOpenChange={setConfirmInvoiceDialogOpen}
        invoiceNumber={existingInvoice?.number ?? null}
        onUpdateInvoice={() => {
          // Set both flags synchronously — async save below + focus-steal could
          // otherwise trigger the unsaved-changes prompt.
          pendingInvoiceEditRef.current = true;
          closingForInvoiceEditRef.current = true;
          handleSubmit();
        }}
        onSaveOnly={() => {
          pendingInvoiceEditRef.current = false;
          handleSubmit();
        }}
      />
    </>
  );
};

export default AddSalesOrderDrawer;
