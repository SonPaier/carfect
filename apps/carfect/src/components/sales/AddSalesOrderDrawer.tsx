import { useState, useMemo, useEffect, useRef } from 'react';
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

// Re-export types used externally
export type { OrderPackage, OrderProduct, DeliveryType };

type PaymentMethod = 'cod' | 'transfer';

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
}

const AddSalesOrderDrawer = ({
  open,
  onOpenChange,
  initialCustomer,
  editOrder,
  onOrderCreated,
}: AddSalesOrderDrawerProps) => {
  const { roles } = useAuth();
  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;
  const { data: instanceData } = useInstanceData(instanceId);
  const { data: salesSettings } = useSalesSettings(instanceId);
  const bankAccounts = useMemo(() => {
    // Prefer sales_instance_settings, fallback to instances
    const raw = salesSettings?.bank_accounts ?? instanceData?.bank_accounts;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw
      .map((a: any) =>
        typeof a === 'string'
          ? { name: '', number: a }
          : { name: a.name || '', number: a.number || '' },
      )
      .filter((a: { number: string }) => a.number.trim() !== '');
  }, [salesSettings?.bank_accounts, instanceData?.bank_accounts]);

  // Hooks
  const customerSearch = useCustomerSearch(instanceId);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const orderPackages = useOrderPackages({ products, setProducts });
  const {
    markDirty,
    resetDirty,
    handleClose: handleUnsavedClose,
    dialogProps,
  } = useUnsavedChanges();

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
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

  const isEdit = !!editOrder;

  // Set initial data when opening
  useEffect(() => {
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
    }
  }, [open, initialCustomer, editOrder]);

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
      .then(({ data }: any) => {
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
      });
  }, [customerSearch.selectedCustomer?.id]);

  const [nextOrderNumber, setNextOrderNumber] = useState('');
  useEffect(() => {
    if (open && !isEdit && instanceId) {
      getNextOrderNumber(instanceId).then(setNextOrderNumber);
    }
  }, [open, isEdit, instanceId]);

  const hasShipping = orderPackages.packages.some((p) => p.shippingMethod === 'shipping');

  /* ── Totals ── */

  /** Effective quantity: total m² from roll assignments, or plain quantity */
  const getEffectiveQty = (p: OrderProduct) =>
    p.rollAssignments?.length
      ? p.rollAssignments.reduce((sum, ra) => sum + ra.usageM2, 0)
      : p.quantity;

  const getProductTotal = (p: OrderProduct) => p.priceNet * getEffectiveQty(p);

  const subtotalNet = useMemo(
    () => products.reduce((sum, p) => sum + getProductTotal(p), 0),
    [products],
  );

  const customerDiscount = customerSearch.selectedCustomer?.discountPercent || 0;

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

  // Shipping costs from Apaczka (brutto) — convert to netto for summary
  const shippingCosts = useMemo(
    () =>
      orderPackages.packages
        .filter((pkg) => pkg.shippingMethod === 'shipping' && pkg.shippingCost != null)
        .map((pkg) => pkg.shippingCost!),
    [orderPackages.packages],
  );
  const shippingNetTotal = shippingCosts.reduce((sum, cost) => sum + cost / (1 + VAT_RATE), 0);

  const totalNet = Math.max(0, subtotalNet - discountAmount) + shippingNetTotal;
  const totalGross = totalNet * (1 + VAT_RATE);

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
      toast.error('Brak instancji');
      return;
    }
    if (!customerSearch.selectedCustomer) {
      toast.error('Wybierz klienta');
      return;
    }
    if (products.length === 0) {
      toast.error('Dodaj przynajmniej jeden produkt');
      return;
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
              `Rolka przypisana do „${names}" ma za mało materiału. Potrzeba ${usage.totalM2.toFixed(2)} m², zostało ${remainingM2.toFixed(2)} m² (brakuje ${shortage} m²).`,
            );
            setSaving(false);
            return;
          }
        }
      } catch (err: any) {
        toast.error('Błąd walidacji rolek: ' + (err.message || ''));
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
        const { error } = await (supabase
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
            packages: packagesPayload,
            attachments: attachments.map((url, i) => ({
              url,
              name: `formatka-${i + 1}`,
              uploadedAt: new Date().toISOString(),
            })),
            shipping_address: hasShipping ? shippingAddress : null,
          })
          .eq('id', editOrder.id) as any);

        if (error) throw error;

        // Delete old roll usages and items explicitly (don't rely on cascade)
        await (supabase.from('sales_roll_usages').delete().eq('order_id', editOrder.id) as any);
        await (supabase.from('sales_order_items').delete().eq('order_id', editOrder.id) as any);
        if (products.length > 0) {
          const items = products.map((p, idx) => {
            const qty = getEffectiveQty(p);
            return {
              order_id: editOrder.id,
              product_id: p.productId || null,
              variant_id: p.variantId || null,
              name: p.name,
              quantity: qty,
              price_net: p.priceNet,
              price_unit: p.priceUnit || 'szt.',
              vehicle: p.vehicle || null,
              sort_order: idx,
              discount_percent: p.discountPercent ?? customerDiscount ?? 0,
            };
          });
          const { data: insertedItems } = await (supabase
            .from('sales_order_items')
            .insert(items)
            .select('id') as any);

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
                    });
                  } catch (e) {
                    console.error('Roll usage creation failed:', e);
                    toast.error(
                      `Błąd zapisu zużycia rolki: ${(e as any)?.message || 'Nieznany błąd'}`,
                    );
                  }
                }
              }
            }
          }
        }

        toast.success('Zamówienie zaktualizowane');
      } else {
        // Regenerate order number at save time to avoid race conditions
        const freshOrderNumber = await getNextOrderNumber(instanceId!);
        const { data: order, error } = await (supabase
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
          .single() as any);

        if (error) throw error;

        if (order?.id && products.length > 0) {
          const items = products.map((p, idx) => {
            // For m² products, store total assigned m² as quantity
            const qty = getEffectiveQty(p);
            return {
              order_id: order.id,
              product_id: p.productId || null,
              variant_id: p.variantId || null,
              name: p.name,
              quantity: qty,
              price_net: p.priceNet,
              price_unit: p.priceUnit || 'szt.',
              vehicle: p.vehicle || null,
              sort_order: idx,
              discount_percent: p.discountPercent ?? customerDiscount ?? 0,
            };
          });
          const { data: insertedItems } = await (supabase
            .from('sales_order_items')
            .insert(items)
            .select('id') as any);

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
                    });
                  } catch (e) {
                    console.error('Roll usage creation failed:', e);
                    toast.error(
                      `Błąd zapisu zużycia rolki: ${(e as any)?.message || 'Nieznany błąd'}`,
                    );
                  }
                }
              }
            }
          }
        }

        toast.success('Zamówienie zostało dodane');

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
                'Zamówienie zapisane, ale nie udało się wysłać emaila: ' + emailRes.error,
              );
            } else if (emailErr) {
              toast.error('Zamówienie zapisane, ale nie udało się wysłać emaila');
            } else {
              toast.success('Email z potwierdzeniem wysłany');
            }
          } catch {
            toast.error('Zamówienie zapisane, ale nie udało się wysłać emaila');
          }
        }
      }

      resetDirty();
      resetForm();
      onOpenChange(false);
      onOrderCreated?.();
    } catch (err: any) {
      toast.error('Błąd przy zapisie zamówienia: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
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
          className="w-full flex flex-col h-full p-0 gap-0 bg-white text-foreground [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60 [&_label]:text-foreground sm:max-w-[80vw]"
          hasDarkOverlay
          hideCloseButton
          onInteractOutside={(e) => {
            e.preventDefault();
            if (!orderPackages.productDrawerOpen && !addCustomerOpen) {
              handleClose();
            }
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            if (!orderPackages.productDrawerOpen && !addCustomerOpen) {
              handleClose();
            }
          }}
        >
          {/* Fixed Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="w-full flex items-center justify-between">
              <SheetTitle>
                {isEdit
                  ? `Edytuj zamówienie: ${editOrder?.orderNumber}`
                  : `Dodaj zamówienie: ${nextOrderNumber}`}
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
                  <span className="text-sm">Zastosowano rabat: {customerDiscount}%</span>
                </div>
              )}

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
                onDeclaredValueChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageDeclaredValue(...args);
                }}
                onOversizedChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageOversized(...args);
                }}
                onShippingCostChange={(...args) => {
                  markDirty();
                  orderPackages.updatePackageShippingCost(...args);
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
                onUpdateRequiredM2={(...args) => {
                  markDirty();
                  orderPackages.updateRequiredM2(...args);
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
              />

              {/* Email checkbox */}
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
                  Wyślij email z potwierdzeniem zamówienia
                </Label>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="order-comment">Uwagi do zamówienia</Label>
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

              {/* Formatki (paste images) */}
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

              {/* Summary — at the end */}
              {products.length > 0 && (
                <OrderSummarySection
                  products={products}
                  subtotalNet={subtotalNet}
                  discountAmount={discountAmount}
                  customerDiscount={customerDiscount}
                  shippingCosts={shippingCosts}
                  totalNet={totalNet}
                  totalGross={totalGross}
                />
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Anuluj
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Zapisuję...
                  </>
                ) : isEdit ? (
                  'Zapisz zmiany'
                ) : (
                  'Dodaj zamówienie'
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
            onConfirm={(...args) => {
              markDirty();
              orderPackages.handleProductsConfirm(...args);
            }}
          />
        </>
      )}
      <UnsavedChangesDialog {...dialogProps} />
    </>
  );
};

export default AddSalesOrderDrawer;
