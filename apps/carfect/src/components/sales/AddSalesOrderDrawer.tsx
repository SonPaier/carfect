import { useState, useMemo, useEffect } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Label } from '@shared/ui';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInstanceData } from '@/hooks/useInstanceData';
import { type SalesOrder } from '@/data/salesMockData';
import { getNextOrderNumber } from './SalesOrdersView';
import AddEditSalesCustomerDrawer from './AddEditSalesCustomerDrawer';
import SalesProductSelectionDrawer from './SalesProductSelectionDrawer';
import { ImagePasteZone } from '@/components/ui/image-paste-zone';

import { VAT_RATE } from './constants';
import { createRollUsage, deleteRollUsagesByOrder, fetchRollRemainingMb } from './services/rollService';
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
}

interface AddSalesOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: SalesOrder[];
  initialCustomer?: { id: string; name: string; discountPercent?: number } | null;
  editOrder?: EditOrderData | null;
  onOrderCreated?: () => void;
}

const AddSalesOrderDrawer = ({ open, onOpenChange, orders, initialCustomer, editOrder, onOrderCreated }: AddSalesOrderDrawerProps) => {
  const { roles } = useAuth();
  const instanceId = roles.find(r => r.instance_id)?.instance_id || null;
  const { data: instanceData } = useInstanceData(instanceId);
  const bankAccounts = useMemo(() => {
    const raw = instanceData?.bank_accounts;
    if (!Array.isArray(raw) || raw.length === 0) return [];
    return raw.map((a: any) =>
      typeof a === 'string' ? { name: '', number: a } : { name: a.name || '', number: a.number || '' }
    ).filter((a: { number: string }) => a.number.trim() !== '');
  }, [instanceData?.bank_accounts]);

  // Hooks
  const customerSearch = useCustomerSearch(instanceId);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const orderPackages = useOrderPackages({ products, setProducts });

  // Local state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
      const editPackages = editOrder.packages && editOrder.packages.length > 0
        ? editOrder.packages
        : [createDefaultPackage()];
      orderPackages.setPackages(editPackages);
      setPaymentMethod(editOrder.paymentMethod || 'cod');
      setBankAccountNumber(editOrder.bankAccountNumber || '');
      setComment(editOrder.comment);
      setSendEmail(editOrder.sendEmail);
      setAttachments(editOrder.attachments || []);
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

  const nextOrderNumber = useMemo(() => getNextOrderNumber(orders), [orders]);

  /* ── Totals ── */

  const subtotalNet = useMemo(
    () => products.reduce((sum, p) => sum + p.priceNet * p.quantity, 0),
    [products]
  );

  const discountableNet = useMemo(
    () => products
      .filter(p => !p.excludeFromDiscount)
      .reduce((sum, p) => sum + p.priceNet * p.quantity, 0),
    [products]
  );

  const customerDiscount = customerSearch.selectedCustomer?.discountPercent || 0;
  const discountAmount = customerDiscount > 0
    ? discountableNet * (customerDiscount / 100)
    : 0;

  const totalNet = Math.max(0, subtotalNet - discountAmount);
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
    onOpenChange(false);
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
  };

  const handleSubmit = async () => {
    if (!instanceId) { toast.error('Brak instancji'); return; }
    if (!customerSearch.selectedCustomer) { toast.error('Wybierz klienta'); return; }
    if (products.length === 0) { toast.error('Dodaj przynajmniej jeden produkt'); return; }

    // Validate roll availability before saving (multi-roll assignments)
    const allAssignments = products.flatMap((p) =>
      (p.rollAssignments || [])
        .filter((a) => a.rollId && a.usageM2 > 0)
        .map((a) => ({ ...a, productName: p.name }))
    );
    if (allAssignments.length > 0) {
      setSaving(true);
      try {
        for (const a of allAssignments) {
          const rollData = await fetchRollRemainingMb(
            a.rollId,
            isEdit ? editOrder?.id : undefined
          );
          const remainingM2 = mbToM2(rollData.remainingMb, rollData.widthMm);
          if (a.usageM2 > remainingM2) {
            const shortage = (a.usageM2 - remainingM2).toFixed(2);
            toast.error(`Rolka przypisana do „${a.productName}" ma za mało materiału. Zostało ${remainingM2.toFixed(2)} m², brakuje ${shortage} m².`);
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
      const { data: { user } } = await supabase.auth.getUser();

      const packagesPayload = orderPackages.packages.length > 0 ? orderPackages.packages : null;
      const effectiveDeliveryType = orderPackages.packages.length > 0 ? orderPackages.packages[0].shippingMethod : 'shipping' as DeliveryType;

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
            attachments: attachments.map((url, i) => ({ url, name: `formatka-${i + 1}`, uploadedAt: new Date().toISOString() })),
          })
          .eq('id', editOrder.id) as any);

        if (error) throw error;

        // Delete old items and their roll usages (cascade handles usages)
        await (supabase.from('sales_order_items').delete().eq('order_id', editOrder.id) as any);
        if (products.length > 0) {
          const items = products.map((p, idx) => ({
            order_id: editOrder.id,
            product_id: p.productId || null,
            variant_id: p.variantId || null,
            name: p.name,
            quantity: p.quantity,
            price_net: p.priceNet,
            price_unit: p.priceUnit || 'szt.',
            vehicle: p.vehicle || null,
            sort_order: idx,
          }));
          const { data: insertedItems } = await (supabase.from('sales_order_items').insert(items).select('id') as any);

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
                    console.warn('Roll usage creation failed:', e);
                  }
                }
              }
            }
          }
        }

        toast.success('Zamówienie zaktualizowane');
      } else {
        const { data: order, error } = await (supabase
          .from('sales_orders')
          .insert({
            instance_id: instanceId,
            customer_id: customerSearch.selectedCustomer.id,
            order_number: nextOrderNumber,
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
            attachments: attachments.map((url, i) => ({ url, name: `formatka-${i + 1}`, uploadedAt: new Date().toISOString() })),
          })
          .select('id')
          .single() as any);

        if (error) throw error;

        if (order?.id && products.length > 0) {
          const items = products.map((p, idx) => ({
            order_id: order.id,
            product_id: p.productId || null,
            variant_id: p.variantId || null,
            name: p.name,
            quantity: p.quantity,
            price_net: p.priceNet,
            price_unit: p.priceUnit || 'szt.',
            vehicle: p.vehicle || null,
            sort_order: idx,
          }));
          const { data: insertedItems } = await (supabase.from('sales_order_items').insert(items).select('id') as any);

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
                    console.warn('Roll usage creation failed:', e);
                  }
                }
              }
            }
          }
        }

        toast.success('Zamówienie zostało dodane');

        if (sendEmail && order?.id) {
          try {
            const { data: emailRes, error: emailErr } = await supabase.functions.invoke('send-order-confirmation', {
              body: { orderId: order.id },
            });
            if (emailRes?.error) {
              toast.error('Zamówienie zapisane, ale nie udało się wysłać emaila: ' + emailRes.error);
            } else if (emailErr) {
              toast.error('Zamówienie zapisane, ale nie udało się wysłać emaila');
            } else {
              toast.success('Email z potwierdzeniem wysłany');
            }
          } catch {
            toast.error('Zamówienie zapisane, ale nie udało się wysłać emaila');
          }
        }

        const hasShippingPackages = orderPackages.packages.some(p => p.shippingMethod === 'shipping');
        if (hasShippingPackages && order?.id) {
          try {
            const { data: shipmentRes, error: shipmentErr } = await supabase.functions.invoke('create-apaczka-shipment', {
              body: { orderId: order.id },
            });
            if (shipmentRes?.error) {
              toast.error('Zamówienie zapisane, ale nie udało się utworzyć przesyłki: ' + shipmentRes.error);
            } else if (shipmentErr) {
              let errDetail = '';
              try {
                const errBody = await (shipmentErr as any).context?.json?.();
                errDetail = errBody?.error || errBody?.message || '';
              } catch { /* ignore parse errors */ }
              toast.error('Zamówienie zapisane, ale nie udało się utworzyć przesyłki' + (errDetail ? ': ' + errDetail : ''));
            } else {
              toast.success(`Przesyłka utworzona. Nr listu: ${shipmentRes.waybill_number}`);
            }
          } catch {
            toast.error('Zamówienie zapisane, ale nie udało się utworzyć przesyłki');
          }
        }
      }

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
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
        onOpenChange(false);
      }
    }}>
      <SheetContent
        side="right"
        className="w-full flex flex-col h-full p-0 gap-0 bg-white text-foreground [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60 [&_label]:text-foreground sm:max-w-[80vw]"
        hasDarkOverlay
        hideCloseButton
      >
        {/* Fixed Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="max-w-[1000px] ml-auto w-full flex items-center justify-between">
            <SheetTitle>{isEdit ? `Edytuj zamówienie: ${editOrder?.orderNumber}` : `Dodaj zamówienie: ${nextOrderNumber}`}</SheetTitle>
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
          <div className="max-w-[1000px] ml-auto space-y-4">
            <CustomerSearchSection
              {...customerSearch}
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
              onRemovePackage={orderPackages.removePackage}
              onShippingMethodChange={orderPackages.updatePackageShippingMethod}
              onPackagingTypeChange={orderPackages.updatePackagePackagingType}
              onDimensionChange={orderPackages.updatePackageDimension}
              onCourierChange={orderPackages.updatePackageCourier}
              onWeightChange={orderPackages.updatePackageWeight}
              onContentsChange={orderPackages.updatePackageContents}
              onDeclaredValueChange={orderPackages.updatePackageDeclaredValue}
              onOversizedChange={orderPackages.updatePackageOversized}
              onAddProduct={(packageId) => { orderPackages.setActivePackageId(packageId); orderPackages.setProductDrawerOpen(true); }}
              onRemoveProduct={orderPackages.removeProductFromPackage}
              onUpdateQuantity={orderPackages.updateQuantity}
              onUpdateVehicle={orderPackages.updateVehicle}
              onUpdateRollAssignment={orderPackages.updateRollAssignment}
              onSetRollAssignments={orderPackages.setRollAssignments}
              onToggleDiscount={orderPackages.toggleExcludeFromDiscount}
              customerDiscount={customerDiscount}
              onAddPackage={orderPackages.addPackage}
            />

            <PaymentSection
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              bankAccountNumber={bankAccountNumber}
              setBankAccountNumber={setBankAccountNumber}
              bankAccounts={bankAccounts}
            />

            {products.length > 0 && (
              <OrderSummarySection
                subtotalNet={subtotalNet}
                discountAmount={discountAmount}
                customerDiscount={customerDiscount}
                totalNet={totalNet}
                totalGross={totalGross}
              />
            )}

            {/* Email checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
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
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Formatki (paste images) */}
            <ImagePasteZone
              images={attachments}
              onImagesChange={setAttachments}
              pathPrefix={instanceId || 'unknown'}
              maxImages={10}
              disabled={saving}
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="max-w-[1000px] ml-auto flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Anuluj
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Zapisuję...</> : isEdit ? 'Zapisz zmiany' : 'Dodaj zamówienie'}
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
          onClose={() => { orderPackages.setProductDrawerOpen(false); orderPackages.setActivePackageId(null); }}
          instanceId={instanceId}
          selectedProductIds={[]}
          selectedVariantIds={[]}
          onConfirm={orderPackages.handleProductsConfirm}
        />
      </>
    )}
    </>
  );
};

export default AddSalesOrderDrawer;
