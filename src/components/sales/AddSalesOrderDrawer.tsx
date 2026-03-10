import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, X, Plus, Minus, Loader2, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInstanceData } from '@/hooks/useInstanceData';
import { type SalesOrder } from '@/data/salesMockData';
import { getNextOrderNumber } from './SalesOrdersView';
import AddEditSalesCustomerDrawer from './AddEditSalesCustomerDrawer';
import SalesProductSelectionDrawer, { type SelectedProductItem } from './SalesProductSelectionDrawer';

interface SalesCustomerRef {
  id: string;
  name: string;
  discountPercent?: number;
}


interface OrderProduct {
  productId: string;
  variantId?: string;
  name: string;
  priceNet: number;
  quantity: number;
  vehicle: string;
}

type DeliveryType = 'shipping' | 'pickup' | 'uber';
type PaymentMethod = 'cod' | 'transfer';
type PackagingType = 'karton' | 'tuba';

interface KartonDimensions {
  length: number;
  width: number;
  height: number;
}

interface TubaDimensions {
  length: number;
  diameter: number;
}

export interface OrderPackage {
  id: string;
  shippingMethod: DeliveryType;
  packagingType?: PackagingType;
  dimensions?: KartonDimensions | TubaDimensions;
  productKeys: string[];
}

const VAT_RATE = 0.23;

const formatCurrency = (value: number) =>
  value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

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
}

interface AddSalesOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: SalesOrder[];
  initialCustomer?: { id: string; name: string; discountPercent?: number } | null;
  editOrder?: EditOrderData | null;
  onOrderCreated?: () => void;
}

/* ─── PackageCard ─── */

interface PackageCardProps {
  pkg: OrderPackage;
  index: number;
  products: OrderProduct[];
  getItemKey: (p: OrderProduct) => string;
  availableProducts: OrderProduct[];
  onRemove: () => void;
  onShippingMethodChange: (method: DeliveryType) => void;
  onPackagingTypeChange: (type: PackagingType) => void;
  onDimensionChange: (field: string, value: number) => void;
  onToggleProduct: (productKey: string) => void;
}

const PackageCard = ({
  pkg,
  index,
  products,
  getItemKey,
  availableProducts,
  onRemove,
  onShippingMethodChange,
  onPackagingTypeChange,
  onDimensionChange,
  onToggleProduct,
}: PackageCardProps) => {
  return (
    <div className="bg-card border border-border rounded-md p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Paczka #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shipping method toggle */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sposób wysyłki</Label>
        <ToggleGroup
          type="single"
          value={pkg.shippingMethod}
          onValueChange={(v) => { if (v) onShippingMethodChange(v as DeliveryType); }}
          variant="outline"
          size="sm"
          className="justify-start"
        >
          <ToggleGroupItem value="shipping" className="text-xs px-3">Wysyłka</ToggleGroupItem>
          <ToggleGroupItem value="pickup" className="text-xs px-3">Odbiór osobisty</ToggleGroupItem>
          <ToggleGroupItem value="uber" className="text-xs px-3">Uber</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Conditional: packaging fields (only for "shipping") */}
      {pkg.shippingMethod === 'shipping' && (
        <div className="space-y-2 pl-1">
          <RadioGroup
            value={pkg.packagingType || 'karton'}
            onValueChange={(v) => onPackagingTypeChange(v as PackagingType)}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="karton" id={`pkg-${pkg.id}-karton`} />
              <Label htmlFor={`pkg-${pkg.id}-karton`} className="text-sm font-normal cursor-pointer">
                Karton
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="tuba" id={`pkg-${pkg.id}-tuba`} />
              <Label htmlFor={`pkg-${pkg.id}-tuba`} className="text-sm font-normal cursor-pointer">
                Tuba
              </Label>
            </div>
          </RadioGroup>

          {pkg.packagingType === 'tuba' ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Długość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as TubaDimensions)?.length || ''}
                  onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Średnica (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as TubaDimensions)?.diameter || ''}
                  onChange={(e) => onDimensionChange('diameter', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Długość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as KartonDimensions)?.length || ''}
                  onChange={(e) => onDimensionChange('length', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Szerokość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as KartonDimensions)?.width || ''}
                  onChange={(e) => onDimensionChange('width', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Wysokość (cm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={(pkg.dimensions as KartonDimensions)?.height || ''}
                  onChange={(e) => onDimensionChange('height', parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Products in package - multiselect */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Produkty w paczce</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-sm font-normal h-auto min-h-[2rem] py-1.5"
            >
              {pkg.productKeys.length === 0 ? (
                <span className="text-muted-foreground">Wybierz produkty...</span>
              ) : (
                <span className="truncate">
                  {pkg.productKeys.length} {pkg.productKeys.length === 1 ? 'produkt' : pkg.productKeys.length < 5 ? 'produkty' : 'produktów'}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
            {availableProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Brak dostępnych produktów
              </p>
            ) : (
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {availableProducts.map(product => {
                  const key = getItemKey(product);
                  const isChecked = pkg.productKeys.includes(key);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => onToggleProduct(key)}
                      />
                      <span className="text-sm truncate flex-1">{product.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({product.quantity} szt.)
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Tags for assigned products */}
        {pkg.productKeys.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pkg.productKeys.map(key => {
              const product = products.find(p => getItemKey(p) === key);
              if (!product) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 bg-muted/40 border border-border rounded px-1.5 py-0.5 text-xs"
                >
                  {product.name}
                  <button
                    type="button"
                    onClick={() => onToggleProduct(key)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Drawer ─── */

const AddSalesOrderDrawer = ({ open, onOpenChange, orders, initialCustomer, editOrder, onOrderCreated }: AddSalesOrderDrawerProps) => {
  const { roles } = useAuth();
  const instanceId = roles.find(r => r.instance_id)?.instance_id || null;
  const { data: instanceData } = useInstanceData(instanceId);
  const bankAccounts: string[] = (instanceData?.bank_accounts as string[] | null) || [];

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomerRef | null>(null);
  const [searchResults, setSearchResults] = useState<SalesCustomerRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add customer drawer state
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [addCustomerInitialQuery, setAddCustomerInitialQuery] = useState('');

  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [packages, setPackages] = useState<OrderPackage[]>([]);

  const [applyDiscount, setApplyDiscount] = useState(true);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [sendEmail, setSendEmail] = useState(false);
  const [comment, setComment] = useState('');

  const isEdit = !!editOrder;

  // Set initial data when opening
  useEffect(() => {
    if (open && editOrder) {
      setSelectedCustomer({
        id: editOrder.customerId,
        name: editOrder.customerName,
        discountPercent: editOrder.customerDiscount,
      });
      setProducts(editOrder.products);
      setPackages(editOrder.packages || []);
      setDeliveryType(editOrder.deliveryType);
      setPaymentMethod(editOrder.paymentMethod || 'cod');
      setBankAccountNumber(editOrder.bankAccountNumber || '');
      setComment(editOrder.comment);
      setSendEmail(editOrder.sendEmail);
    } else if (open && initialCustomer) {
      setSelectedCustomer({
        id: initialCustomer.id,
        name: initialCustomer.name,
        discountPercent: initialCustomer.discountPercent,
      });
    }
    if (!open) {
      setSelectedCustomer(null);
    }
  }, [open, initialCustomer, editOrder]);

  // Set default bank account when instance data loads
  useEffect(() => {
    if (bankAccounts.length > 0 && !bankAccountNumber) {
      setBankAccountNumber(bankAccounts[0]);
    }
  }, [bankAccounts]);

  // Search customers from DB
  const searchCustomers = useCallback(async (q: string) => {
    if (!instanceId || q.length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    const { data } = await (supabase
      .from('customers')
      .select('id, name, discount_percent')
      .eq('instance_id', instanceId)
      .eq('source', 'sales')
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(10) as any);

    const results: SalesCustomerRef[] = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      discountPercent: c.discount_percent ?? undefined,
    }));
    setSearchResults(results);
    setDropdownOpen(true);
    setActiveIndex(-1);
    setSearching(false);
  }, [instanceId]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchCustomers(customerSearch), 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [customerSearch, searchCustomers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen) return;
    const totalItems = searchResults.length + (searchResults.length === 0 && customerSearch.length >= 2 ? 1 : 0);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < searchResults.length) {
          handleSelectCustomer(searchResults[activeIndex]);
        }
        break;
      case 'Escape':
        setDropdownOpen(false);
        break;
    }
  };

  const handleSelectCustomer = (c: SalesCustomerRef) => {
    setSelectedCustomer(c);
    setCustomerSearch('');
    setDropdownOpen(false);
    setSearchResults([]);
  };

  const handleAddNewCustomer = () => {
    setAddCustomerInitialQuery(customerSearch);
    setDropdownOpen(false);
    setAddCustomerOpen(true);
  };

  const handleCustomerSaved = () => {
    // Re-search to find the newly created customer
    if (customerSearch.length >= 2) {
      searchCustomers(customerSearch);
    }
  };

  const nextOrderNumber = useMemo(() => getNextOrderNumber(orders), [orders]);

  const getItemKey = (p: OrderProduct) => p.variantId || p.productId;

  const handleProductsConfirm = (selected: SelectedProductItem[]) => {
    setProducts(prev => {
      const existingMap = new Map(prev.map(p => [getItemKey(p), p]));
      return selected.map(s => {
        const key = s.variantId || s.productId;
        const existing = existingMap.get(key);
        if (existing) return existing;

        const displayName = s.variantName
          ? `${s.shortName || s.fullName} - ${s.variantName}`
          : s.shortName || s.fullName;

        return {
          productId: s.productId,
          variantId: s.variantId,
          name: displayName,
          priceNet: s.priceNet,
          quantity: 1,
          vehicle: '',
        };
      });
    });
  };

  const removeProduct = (key: string) => {
    setProducts((prev) => prev.filter((p) => getItemKey(p) !== key));
    // Also remove from any package assignments
    setPackages((prev) =>
      prev.map(pkg => ({
        ...pkg,
        productKeys: pkg.productKeys.filter(k => k !== key),
      }))
    );
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity < 1) return;
    setProducts((prev) =>
      prev.map((p) => (getItemKey(p) === key ? { ...p, quantity } : p))
    );
  };

  const updateVehicle = (key: string, vehicle: string) => {
    setProducts((prev) =>
      prev.map((p) => (getItemKey(p) === key ? { ...p, vehicle } : p))
    );
  };

  // Clean orphaned product keys from packages when products change
  useEffect(() => {
    const currentKeys = new Set(products.map(getItemKey));
    setPackages(prev => {
      const cleaned = prev.map(pkg => ({
        ...pkg,
        productKeys: pkg.productKeys.filter(k => currentKeys.has(k)),
      }));
      if (JSON.stringify(cleaned) !== JSON.stringify(prev)) return cleaned;
      return prev;
    });
  }, [products]);

  /* ── Package handlers ── */

  const addPackage = () => {
    setPackages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        shippingMethod: 'shipping',
        packagingType: 'karton',
        dimensions: { length: 0, width: 0, height: 0 },
        productKeys: [],
      },
    ]);
  };

  const removePackage = (packageId: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  const updatePackageShippingMethod = (packageId: string, method: DeliveryType) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId) return pkg;
        if (method === 'shipping') {
          return {
            ...pkg,
            shippingMethod: method,
            packagingType: pkg.packagingType || 'karton',
            dimensions: pkg.dimensions || { length: 0, width: 0, height: 0 },
          };
        }
        return { ...pkg, shippingMethod: method, packagingType: undefined, dimensions: undefined };
      })
    );
  };

  const updatePackagePackagingType = (packageId: string, type: PackagingType) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId) return pkg;
        const dimensions = type === 'karton'
          ? { length: 0, width: 0, height: 0 }
          : { length: 0, diameter: 0 };
        return { ...pkg, packagingType: type, dimensions };
      })
    );
  };

  const updatePackageDimension = (packageId: string, field: string, value: number) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId || !pkg.dimensions) return pkg;
        return { ...pkg, dimensions: { ...pkg.dimensions, [field]: value } };
      })
    );
  };

  const toggleProductInPackage = (packageId: string, productKey: string) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== packageId) return pkg;
        const keys = pkg.productKeys.includes(productKey)
          ? pkg.productKeys.filter(k => k !== productKey)
          : [...pkg.productKeys, productKey];
        return { ...pkg, productKeys: keys };
      })
    );
  };

  /* ── Derived: unassigned products ── */

  const assignedProductKeys = useMemo(() => {
    const assigned = new Set<string>();
    packages.forEach(pkg => pkg.productKeys.forEach(key => assigned.add(key)));
    return assigned;
  }, [packages]);

  const unassignedProducts = useMemo(() => {
    return products.filter(p => !assignedProductKeys.has(getItemKey(p)));
  }, [products, assignedProductKeys]);

  const getAvailableProductsForPackage = useCallback((packageId: string) => {
    const otherPackagesKeys = new Set<string>();
    packages.forEach(pkg => {
      if (pkg.id !== packageId) {
        pkg.productKeys.forEach(key => otherPackagesKeys.add(key));
      }
    });
    return products.filter(p => !otherPackagesKeys.has(getItemKey(p)));
  }, [packages, products]);

  /* ── Totals ── */

  const subtotalNet = useMemo(
    () => products.reduce((sum, p) => sum + p.priceNet * p.quantity, 0),
    [products]
  );

  const customerDiscount = selectedCustomer?.discountPercent || 0;
  const discountAmount = applyDiscount && customerDiscount > 0
    ? subtotalNet * (customerDiscount / 100)
    : 0;

  const totalNet = Math.max(0, subtotalNet - discountAmount);
  const totalGross = totalNet * (1 + VAT_RATE);

  const handleClose = () => {
    onOpenChange(false);
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!instanceId) { toast.error('Brak instancji'); return; }
    if (!selectedCustomer) { toast.error('Wybierz klienta'); return; }
    if (products.length === 0) { toast.error('Dodaj przynajmniej jeden produkt'); return; }
    if (packages.length > 0 && unassignedProducts.length > 0) {
      toast.error('Przypisz wszystkie produkty do paczek');
      return;
    }

    setSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const packagesPayload = packages.length > 0 ? packages : null;
      const effectiveDeliveryType = packages.length > 0 ? packages[0].shippingMethod : deliveryType;

      if (isEdit && editOrder) {
        // Update existing order
        const { error } = await (supabase
          .from('sales_orders')
          .update({
            customer_id: selectedCustomer.id,
            customer_name: selectedCustomer.name,
            total_net: totalNet,
            total_gross: totalGross,
            comment: comment || null,
            delivery_type: effectiveDeliveryType,
            payment_method: paymentMethod,
            bank_account_number: bankAccountNumber || null,
            packages: packagesPayload,
          })
          .eq('id', editOrder.id) as any);

        if (error) throw error;

        // Delete old items and re-insert
        await (supabase.from('sales_order_items').delete().eq('order_id', editOrder.id) as any);
        if (products.length > 0) {
          const items = products.map((p, idx) => ({
            order_id: editOrder.id,
            product_id: p.productId || null,
            variant_id: p.variantId || null,
            name: p.name,
            quantity: p.quantity,
            price_net: p.priceNet,
            vehicle: p.vehicle || null,
            sort_order: idx,
          }));
          await (supabase.from('sales_order_items').insert(items) as any);
        }

        toast.success('Zamówienie zaktualizowane');
      } else {
        // Create new order
        const { data: order, error } = await (supabase
          .from('sales_orders')
          .insert({
            instance_id: instanceId,
            customer_id: selectedCustomer.id,
            order_number: nextOrderNumber,
            customer_name: selectedCustomer.name,
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
          })
          .select('id')
          .single() as any);

        if (error) throw error;

        // Insert order items
        if (order?.id && products.length > 0) {
          const items = products.map((p, idx) => ({
            order_id: order.id,
            product_id: p.productId || null,
            variant_id: p.variantId || null,
            name: p.name,
            quantity: p.quantity,
            price_net: p.priceNet,
            vehicle: p.vehicle || null,
            sort_order: idx,
          }));
          await (supabase.from('sales_order_items').insert(items) as any);
        }

        toast.success('Zamówienie zostało dodane');

        // Send confirmation email if checkbox is checked
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

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setProducts([]);
    setPackages([]);
    setApplyDiscount(true);
    setDeliveryType('shipping');
    setPaymentMethod('cod');
    setBankAccountNumber(bankAccounts.length > 0 ? bankAccounts[0] : '');
    setSendEmail(false);
    setComment('');
  };

  return (
    <>
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
        onOpenChange(false);
      }
    }} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[27rem] flex flex-col h-full p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60"
        hideOverlay
        hideCloseButton
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Fixed Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
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
          <div className="space-y-4">
            {/* Customer selection */}
            <div className="space-y-2">
              <Label>Klient</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-muted/20 border border-border rounded-md px-3 py-2">
                  <span className="text-sm font-medium">{selectedCustomer.name}</span>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div ref={containerRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Wyszukaj klienta..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => { if (customerSearch.length >= 2 && searchResults.length > 0) setDropdownOpen(true); }}
                      onKeyDown={handleCustomerKeyDown}
                      className="pl-9 pr-9"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {dropdownOpen && customerSearch.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border border-border rounded-lg overflow-hidden bg-card shadow-lg z-[9999]">
                      {searchResults.length > 0 ? (
                        searchResults.map((c, i) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`w-full px-4 py-3 text-left transition-colors border-b border-border last:border-0 ${
                              i === activeIndex ? 'bg-accent' : 'hover:bg-hover'
                            }`}
                            onClick={() => handleSelectCustomer(c)}
                            onMouseEnter={() => setActiveIndex(i)}
                          >
                            <span className="text-sm font-medium">{c.name}</span>
                          </button>
                        ))
                      ) : !searching ? (
                        <div className="p-4 text-center space-y-3">
                          <p className="text-sm text-muted-foreground">Nie znaleziono klientów</p>
                          <Button type="button" className="w-full" onClick={handleAddNewCustomer}>
                            <Plus className="w-4 h-4 mr-1" />
                            Dodaj klienta
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Products */}
            <div className="space-y-2">
              <Label>Produkty</Label>
              {products.length > 0 && (
                <div className="space-y-2">
                  {products.map((p) => {
                    const itemKey = getItemKey(p);
                    return (
                      <div
                        key={itemKey}
                        className="bg-card border border-border rounded-md p-3 space-y-2"
                      >
                        {/* Row 1: Name + Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(p.priceNet)} netto/szt.
                            </p>
                          </div>
                          <button
                            onClick={() => removeProduct(itemKey)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Row 2: Quantity + Vehicle */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(itemKey, p.quantity - 1)}
                              disabled={p.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={p.quantity}
                              onChange={(e) =>
                                updateQuantity(itemKey, parseInt(e.target.value) || 1)
                              }
                              className="w-14 h-7 text-center text-sm px-1"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(itemKey, p.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Pojazd"
                            value={p.vehicle}
                            onChange={(e) => updateVehicle(itemKey, e.target.value)}
                            className="h-7 text-sm flex-1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setProductDrawerOpen(true)}>
                <Plus className="w-4 h-4" />
                {products.length > 0 ? 'Zmień produkty' : 'Dodaj produkt'}
              </Button>
            </div>

            {/* Packages */}
            <div className="space-y-2">
              <Label>Paczki</Label>

              {/* Unassigned products warning */}
              {products.length > 0 && packages.length > 0 && unassignedProducts.length > 0 && (
                <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Nieprzypisane produkty: {unassignedProducts.map(p => p.name).join(', ')}.
                    Każdy produkt musi być w paczce.
                  </AlertDescription>
                </Alert>
              )}

              {packages.length > 0 && (
                <div className="space-y-3">
                  {packages.map((pkg, index) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      index={index}
                      products={products}
                      getItemKey={getItemKey}
                      availableProducts={getAvailableProductsForPackage(pkg.id)}
                      onRemove={() => removePackage(pkg.id)}
                      onShippingMethodChange={(method) => updatePackageShippingMethod(pkg.id, method)}
                      onPackagingTypeChange={(type) => updatePackagePackagingType(pkg.id, type)}
                      onDimensionChange={(field, value) => updatePackageDimension(pkg.id, field, value)}
                      onToggleProduct={(productKey) => toggleProductInPackage(pkg.id, productKey)}
                    />
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full gap-2" onClick={addPackage}>
                <Plus className="w-4 h-4" />
                Dodaj paczkę
              </Button>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Sposób płatności</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cod">Za pobraniem</SelectItem>
                  <SelectItem value="transfer">Przelew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank account selection */}
            {bankAccounts.length > 0 && (
              <Select value={bankAccountNumber} onValueChange={setBankAccountNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz konto" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account, idx) => (
                    <SelectItem key={idx} value={account}>
                      {account}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Summary */}
            {products.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Podsumowanie</Label>

                  {/* Customer discount info */}
                  {selectedCustomer && customerDiscount > 0 && (
                    <div className="flex items-center justify-between bg-muted/20 border border-border rounded-md px-3 py-2">
                      <span className="text-sm">Rabat: {customerDiscount}%</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="apply-discount" className="text-xs text-muted-foreground font-normal">
                          Zastosuj
                        </Label>
                        <Switch
                          id="apply-discount"
                          checked={applyDiscount}
                          onCheckedChange={setApplyDiscount}
                        />
                      </div>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="bg-card border border-border rounded-md p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suma netto</span>
                      <span className="tabular-nums">{formatCurrency(subtotalNet)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Rabat ({customerDiscount}%)</span>
                        <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Netto po rabacie</span>
                        <span className="tabular-nums font-medium">{formatCurrency(totalNet)}</span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-semibold">
                      <span>Brutto (23% VAT)</span>
                      <span className="tabular-nums">{formatCurrency(totalGross)}</span>
                    </div>
                  </div>

                </div>
              </>
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
          </div>
        </div>

        {/* Fixed Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex gap-3 w-full">
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
          open={productDrawerOpen}
          onClose={() => setProductDrawerOpen(false)}
          instanceId={instanceId}
          selectedProductIds={products.filter(p => !p.variantId).map(p => p.productId)}
          selectedVariantIds={products.filter(p => p.variantId).map(p => p.variantId!)}
          onConfirm={handleProductsConfirm}
        />
      </>
    )}
    </>
  );
};

export default AddSalesOrderDrawer;
