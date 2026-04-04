import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Pencil, Search, Loader2 } from 'lucide-react';
import { Sheet, SheetContent } from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Badge } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { Collapsible, CollapsibleContent } from '@shared/ui';
import { NumericInput } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@shared/ui';
import { useGusLookup } from './hooks/useGusLookup';
import { useUnsavedChanges, UnsavedChangesDialog } from './hooks/useUnsavedChanges';
import { COUNTRIES } from './constants';

interface OrderItem {
  name: string;
  quantity: number;
  price_net: number;
  price_unit: string;
}

interface Invoice {
  id: string;
  sales_order_id: string;
  invoice_number: string;
  pdf_url: string | null;
}

interface RollUsage {
  order_id: string;
  used_m2: number | null;
  used_mb: number | null;
  sales_rolls: {
    product_name: string | null;
    product_code: string | null;
    width_mm: number | null;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_net: number | null;
  currency: string;
  status: string;
  delivery_type: string | null;
  payment_method: string | null;
  tracking_number: string | null;
  apaczka_tracking_url: string | null;
  items: OrderItem[];
  invoice: Invoice | null;
  rolls: RollUsage[];
}

interface SalesCustomer {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  default_currency: string | null;
  discount_percent: number | null;
  is_net_payer: boolean;
  sales_notes: string | null;
  shipping_addressee: string | null;
  shipping_country_code: string | null;
  shipping_street: string | null;
  shipping_street_line2: string | null;
  shipping_postal_code: string | null;
  shipping_city: string | null;
  nip: string | null;
  company: string | null;
  billing_street: string | null;
  billing_postal_code: string | null;
  billing_city: string | null;
  billing_country_code: string | null;
  billing_street_line2: string | null;
  shipping_same_as_billing: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: SalesCustomer | null;
  instanceId: string;
  onSaved: () => void;
  initialEditMode?: boolean;
}

const CURRENCIES = [
  { value: 'PLN', label: 'PLN (zł)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
] as const;

const emptyForm = {
  name: '',
  nip: '',
  phone: '',
  email: '',
  contactPerson: '',
  currency: 'PLN',
  discountEnabled: false,
  discountPercent: 0,
  isNetPayer: false,
  billingCountry: 'PL',
  billingStreet: '',
  billingStreetLine2: '',
  billingPostalCode: '',
  billingCity: '',
  shippingSameAsBilling: false,
  shippingAddressee: '',
  shippingCountry: 'PL',
  shippingStreet: '',
  shippingStreetLine2: '',
  shippingPostalCode: '',
  shippingCity: '',
  notes: '',
};

const AddEditSalesCustomerDrawer = ({
  open,
  onOpenChange,
  customer,
  instanceId,
  onSaved,
  initialEditMode = false,
}: Props) => {
  const isMobile = useIsMobile();
  const isEdit = !!customer;
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { markDirty, resetDirty, handleClose: guardedClose, dialogProps } = useUnsavedChanges();

  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const { lookupNip, loading: gusLoading } = useGusLookup();

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) return;
    setOrdersLoading(true);
    const { data } = await supabase
      .from('sales_orders')
      .select(
        'id, order_number, created_at, total_net, currency, status, delivery_type, payment_method, tracking_number, apaczka_tracking_url, sales_order_items(name, quantity, price_net, price_unit)',
      )
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    type OrderRow = NonNullable<typeof data>[number];
    const orderIds = (data || []).map((o: OrderRow) => o.id);
    const invoiceMap: Record<string, Invoice> = {};
    const rollMap: Record<string, RollUsage[]> = {};
    if (orderIds.length > 0) {
      const [invRes, rollRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, sales_order_id, invoice_number, pdf_url')
          .in('sales_order_id', orderIds),
        supabase
          .from('sales_roll_usages')
          .select('order_id, used_m2, used_mb, sales_rolls(product_name, product_code, width_mm)')
          .in('order_id', orderIds),
      ]);
      for (const inv of invRes.data || []) {
        invoiceMap[inv.sales_order_id] = inv as Invoice;
      }
      for (const ru of rollRes.data || []) {
        if (!rollMap[ru.order_id]) rollMap[ru.order_id] = [];
        rollMap[ru.order_id].push(ru as unknown as RollUsage);
      }
    }

    setOrders(
      (data || []).map((o: OrderRow) => ({
        ...o,
        items: (o.sales_order_items || []) as OrderItem[],
        invoice: invoiceMap[o.id] || null,
        rolls: rollMap[o.id] || [],
      })) as Order[],
    );
    setOrdersLoading(false);
  }, [customer?.id]);

  useEffect(() => {
    if (open && customer?.id && activeTab === 'orders') {
      fetchOrders();
    }
  }, [open, customer?.id, activeTab, fetchOrders]);

  const isFormMode = !isEdit || editMode;

  useEffect(() => {
    if (!open) {
      setEditMode(false);
      setActiveTab('orders');
      return;
    }
    if (initialEditMode && isEdit) {
      setEditMode(true);
    }
    if (customer) {
      setForm({
        name: customer.name || '',
        nip: customer.nip || '',
        phone: customer.phone || '',
        email: customer.email || '',
        contactPerson: customer.contact_person || '',
        currency: customer.default_currency || 'PLN',
        discountEnabled: (customer.discount_percent ?? 0) > 0,
        discountPercent: customer.discount_percent ?? 0,
        isNetPayer: customer.is_net_payer ?? false,
        billingCountry: customer.billing_country_code || 'PL',
        billingStreet: customer.billing_street || '',
        billingStreetLine2: customer.billing_street_line2 || '',
        billingPostalCode: customer.billing_postal_code || '',
        billingCity: customer.billing_city || '',
        shippingSameAsBilling: customer.shipping_same_as_billing ?? false,
        shippingAddressee: customer.shipping_addressee || '',
        shippingCountry: customer.shipping_country_code || 'PL',
        shippingStreet: customer.shipping_street || '',
        shippingStreetLine2: customer.shipping_street_line2 || '',
        shippingPostalCode: customer.shipping_postal_code || '',
        shippingCity: customer.shipping_city || '',
        notes: customer.sales_notes || '',
      });
    } else {
      setForm(emptyForm);
      resetDirty();
      setEditMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  const handleGusLookup = async () => {
    const result = await lookupNip(form.nip);
    if (result) {
      setForm({
        ...form,
        name: result.name,
        billingStreet: result.street,
        billingPostalCode: result.postalCode,
        billingCity: result.city,
      });
      markDirty();
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nazwa jest wymagana');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Telefon jest wymagany');
      return;
    }
    if (form.discountPercent < 0 || form.discountPercent > 100) {
      toast.error('Rabat musi być między 0 a 100%');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | number | boolean | null> = {
        instance_id: instanceId,
        name: form.name.trim(),
        contact_person: form.contactPerson.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        default_currency: form.currency || 'PLN',
        discount_percent: form.discountEnabled ? form.discountPercent : null,
        is_net_payer: form.isNetPayer,
        sales_notes: form.notes.trim() || null,
        nip: form.nip.trim() || null,
        company: form.name.trim() || null,
        billing_country_code: form.billingCountry || 'PL',
        billing_street: form.billingStreet.trim() || null,
        billing_street_line2: form.billingStreetLine2.trim() || null,
        billing_postal_code: form.billingPostalCode.trim() || null,
        billing_city: form.billingCity.trim() || null,
        shipping_same_as_billing: form.shippingSameAsBilling,
        shipping_addressee: form.shippingAddressee.trim() || null,
        shipping_country_code: form.shippingCountry || 'PL',
        shipping_street: form.shippingStreet.trim() || null,
        shipping_street_line2: form.shippingStreetLine2.trim() || null,
        shipping_postal_code: form.shippingPostalCode.trim() || null,
        shipping_city: form.shippingCity.trim() || null,
      };

      if (form.shippingSameAsBilling) {
        payload.shipping_country_code = payload.billing_country_code;
        payload.shipping_street = payload.billing_street;
        payload.shipping_street_line2 = payload.billing_street_line2;
        payload.shipping_postal_code = payload.billing_postal_code;
        payload.shipping_city = payload.billing_city;
      }

      if (customer?.id) {
        const { error } = await supabase
          .from('sales_customers')
          .update(payload)
          .eq('id', customer.id);
        if (error) throw error;
        toast.success('Klient zaktualizowany');
      } else {
        const { error } = await supabase.from('sales_customers').insert(payload);
        if (error) throw error;
        toast.success('Klient dodany');
      }

      onSaved();
      resetDirty();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Błąd zapisu: ' + ((err as Error).message || 'Nieznany błąd'));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDrawer = () => {
    guardedClose(handleSave, () => {
      resetDirty();
      onOpenChange(false);
    });
  };

  const renderViewMode = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
      <TabsList className="w-full">
        <TabsTrigger value="orders">Zamówienia</TabsTrigger>
        <TabsTrigger value="data">Dane</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="space-y-3 text-sm">
          <ViewField label="Nazwa" value={form.name} />
          <ViewField label="NIP" value={form.nip} />
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <ViewField label="Telefon" value={form.phone} isPhone />
          <ViewField label="Email" value={form.email} isEmail />
          <ViewField label="Osoba kontaktowa" value={form.contactPerson} />
          <ViewField
            label="Waluta"
            value={CURRENCIES.find((c) => c.value === form.currency)?.label || form.currency}
          />
          {form.discountEnabled && <ViewField label="Rabat" value={`${form.discountPercent}%`} />}
          <ViewField label="Płatnik" value={form.isNetPayer ? 'netto' : 'brutto'} />
        </div>

        {(form.billingStreet || form.billingCity) && (
          <>
            <Separator />
            <div className="space-y-3 text-sm">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Adres firmy
              </h4>
              <ViewField
                label="Kraj"
                value={
                  COUNTRIES.find((c) => c.code === form.billingCountry)?.name || form.billingCountry
                }
              />
              <ViewField
                label="Adres"
                value={[
                  form.billingStreet,
                  form.billingStreetLine2,
                  `${form.billingPostalCode} ${form.billingCity}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
            </div>
          </>
        )}

        <Separator />
        <div className="space-y-3 text-sm">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Adres dostawy
          </h4>
          {form.shippingSameAsBilling ? (
            <p className="text-sm text-muted-foreground italic">Taki sam jak adres firmy</p>
          ) : (
            <>
              {form.shippingAddressee && (
                <ViewField label="Adresat" value={form.shippingAddressee} />
              )}
              <ViewField
                label="Kraj"
                value={
                  COUNTRIES.find((c) => c.code === form.shippingCountry)?.name ||
                  form.shippingCountry
                }
              />
              <ViewField
                label="Adres"
                value={[
                  form.shippingStreet,
                  form.shippingStreetLine2,
                  `${form.shippingPostalCode} ${form.shippingCity}`,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
            </>
          )}
        </div>

        {form.notes && (
          <>
            <Separator />
            <div className="space-y-3 text-sm">
              <ViewField label="Notatki" value={form.notes} />
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="orders" className="flex-1 overflow-y-auto">
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Brak zamówień</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-md p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(o.created_at), 'dd.MM.yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        o.status === 'wysłany'
                          ? 'bg-emerald-600 text-white'
                          : o.status === 'anulowany'
                            ? 'border border-red-500 text-red-600'
                            : 'border border-amber-500 text-amber-600'
                      }`}
                    >
                      {o.status === 'nowy'
                        ? 'Nowy'
                        : o.status === 'wysłany'
                          ? 'Wysłany'
                          : o.status === 'anulowany'
                            ? 'Anulowany'
                            : o.status}
                    </span>
                    {o.delivery_type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {o.delivery_type === 'shipping'
                          ? 'Wysyłka'
                          : o.delivery_type === 'pickup'
                            ? 'Odbiór'
                            : o.delivery_type === 'uber'
                              ? 'Uber'
                              : o.delivery_type}
                      </Badge>
                    )}
                    {o.payment_method && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {{ cod: 'Pobranie', transfer: 'Przelew', free: 'Bezpłatne' }[
                          o.payment_method
                        ] ?? o.payment_method}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {o.total_net?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}{' '}
                    {o.currency === 'EUR' ? '€' : 'zł'}
                  </span>
                </div>

                {/* Products */}
                {o.items.length > 0 && (
                  <div className="text-xs space-y-0.5 mt-1">
                    {o.items.map((item, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate mr-2">
                          {item.quantity > 1 ? `${item.quantity}× ` : ''}
                          {item.name}
                        </span>
                        <span className="shrink-0">
                          {(Number(item.price_net) * item.quantity).toLocaleString('pl-PL', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          zł
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rolls */}
                {o.rolls.length > 0 && (
                  <div className="text-xs mt-1">
                    {o.rolls.map((r, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {r.sales_rolls?.product_name || r.sales_rolls?.product_code || 'Rolka'}
                        </span>
                        <span>
                          {r.used_m2 ? `${r.used_m2} m²` : ''}
                          {r.sales_rolls?.width_mm ? ` / ${r.sales_rolls.width_mm} mm` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tracking + Invoice */}
                {o.tracking_number && (
                  <div className="text-xs mt-1">
                    <span>List przewozowy: </span>
                    <a
                      href={o.apaczka_tracking_url || '#'}
                      target={o.apaczka_tracking_url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => {
                        if (!o.apaczka_tracking_url) {
                          e.preventDefault();
                          navigator.clipboard.writeText(o.tracking_number);
                          toast.info('Numer listu skopiowany');
                        }
                      }}
                    >
                      {o.tracking_number}
                    </a>
                  </div>
                )}
                {o.invoice && (
                  <div className="text-xs mt-1">
                    <span>Faktura: </span>
                    <a
                      href="#"
                      className="text-primary hover:underline"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
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
                                invoiceId: o.invoice.id,
                              }),
                            },
                          );
                          if (!res.ok) throw new Error();
                          const contentType = res.headers.get('content-type') || '';
                          if (contentType.includes('application/pdf')) {
                            const blob = await res.blob();
                            window.open(URL.createObjectURL(blob), '_blank');
                          } else {
                            const json = await res.json();
                            if (json.pdf_url) window.open(json.pdf_url, '_blank');
                            else toast.error('PDF niedostępny');
                          }
                        } catch {
                          toast.error('Nie udało się pobrać PDF');
                        }
                      }}
                    >
                      {o.invoice.invoice_number || 'Pobierz'}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  const renderFormMode = () => (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      {/* Section 1: Identyfikacja */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nazwa *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              markDirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="nip">NIP</Label>
          <div className="flex gap-2">
            <Input
              id="nip"
              value={form.nip}
              onChange={(e) => {
                setForm({ ...form, nip: e.target.value });
                markDirty();
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGusLookup}
              disabled={gusLoading || !form.nip.trim()}
              className="shrink-0"
            >
              {gusLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Search className="w-4 h-4 mr-1" />
              )}
              Pobierz dane z GUS
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Section 2: Kontakt i warunki */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              markDirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              markDirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="contact-person">Osoba kontaktowa</Label>
          <Input
            id="contact-person"
            value={form.contactPerson}
            onChange={(e) => {
              setForm({ ...form, contactPerson: e.target.value });
              markDirty();
            }}
          />
        </div>
        <div>
          <Label htmlFor="currency">Waluta</Label>
          <Select
            value={form.currency}
            onValueChange={(value) => {
              setForm({ ...form, currency: value });
              markDirty();
            }}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="discount-toggle">Rabat</Label>
          <Switch
            size="sm"
            id="discount-toggle"
            checked={form.discountEnabled}
            onCheckedChange={(checked) => {
              setForm({ ...form, discountEnabled: checked });
              markDirty();
            }}
          />
        </div>
        {form.discountEnabled && (
          <div className="flex items-center gap-2">
            <NumericInput
              min={0}
              max={100}
              className="w-20"
              value={form.discountPercent ?? undefined}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, discountPercent: v ?? 0 }));
                markDirty();
              }}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="net-payer-toggle">Płatnik netto</Label>
          <Switch
            size="sm"
            id="net-payer-toggle"
            checked={form.isNetPayer}
            onCheckedChange={(checked) => {
              setForm({ ...form, isNetPayer: checked });
              markDirty();
            }}
          />
        </div>
      </div>

      <Separator />

      {/* Section 3: Adres firmy */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Adres firmy
        </h4>
        <AddressFields
          prefix="billing"
          country={form.billingCountry}
          street={form.billingStreet}
          streetLine2={form.billingStreetLine2}
          postalCode={form.billingPostalCode}
          city={form.billingCity}
          onCountryChange={(value) => {
            setForm({
              ...form,
              billingCountry: value,
              ...(value === 'PL' ? { billingStreetLine2: '' } : {}),
            });
            markDirty();
          }}
          onStreetChange={(value) => {
            setForm({ ...form, billingStreet: value });
            markDirty();
          }}
          onStreetLine2Change={(value) => {
            setForm({ ...form, billingStreetLine2: value });
            markDirty();
          }}
          onPostalCodeChange={(value) => {
            setForm({ ...form, billingPostalCode: value });
            markDirty();
          }}
          onCityChange={(value) => {
            setForm({ ...form, billingCity: value });
            markDirty();
          }}
        />
      </div>

      <Separator />

      {/* Section 4: Adres dostawy */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Adres dostawy
        </h4>
        <div className="flex items-center gap-2">
          <Checkbox
            id="same-as-billing"
            checked={form.shippingSameAsBilling}
            onCheckedChange={(checked) => {
              setForm({ ...form, shippingSameAsBilling: !!checked });
              markDirty();
            }}
          />
          <Label htmlFor="same-as-billing" className="text-sm font-normal cursor-pointer">
            Taki sam jak adres firmy
          </Label>
        </div>
        <Collapsible open={!form.shippingSameAsBilling}>
          <CollapsibleContent className="space-y-3">
            <div>
              <Label htmlFor="ship-addressee">Adresat</Label>
              <Input
                id="ship-addressee"
                value={form.shippingAddressee}
                onChange={(e) => {
                  setForm({ ...form, shippingAddressee: e.target.value });
                  markDirty();
                }}
              />
            </div>
            <AddressFields
              prefix="ship"
              country={form.shippingCountry}
              street={form.shippingStreet}
              streetLine2={form.shippingStreetLine2}
              postalCode={form.shippingPostalCode}
              city={form.shippingCity}
              onCountryChange={(value) => {
                setForm({
                  ...form,
                  shippingCountry: value,
                  ...(value === 'PL' ? { shippingStreetLine2: '' } : {}),
                });
                markDirty();
              }}
              onStreetChange={(value) => {
                setForm({ ...form, shippingStreet: value });
                markDirty();
              }}
              onStreetLine2Change={(value) => {
                setForm({ ...form, shippingStreetLine2: value });
                markDirty();
              }}
              onPostalCodeChange={(value) => {
                setForm({ ...form, shippingPostalCode: value });
                markDirty();
              }}
              onCityChange={(value) => {
                setForm({ ...form, shippingCity: value });
                markDirty();
              }}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Notatki — bottom */}
      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => {
            setForm({ ...form, notes: e.target.value });
            markDirty();
          }}
        />
      </div>
    </div>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (editMode) {
            handleCloseDrawer();
          } else {
            onOpenChange(false);
          }
        }
      }}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[var(--drawer-width)] flex flex-col p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white"
        hideCloseButton
        hideOverlay
        onInteractOutside={(e) => {
          e.preventDefault();
          if (editMode) {
            handleCloseDrawer();
          } else {
            onOpenChange(false);
          }
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          if (editMode) {
            handleCloseDrawer();
          } else {
            onOpenChange(false);
          }
        }}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-semibold text-lg">
            {isEdit ? form.name || 'Klient' : 'Nowy klient'}
          </h2>
          <div className="flex items-center gap-1">
            {isEdit && !editMode && (
              <Button variant="ghost" size="icon" onClick={() => setEditMode(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => (editMode ? handleCloseDrawer() : onOpenChange(false))}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 px-5 py-4">
          {isFormMode ? renderFormMode() : renderViewMode()}
        </div>

        {/* Sticky footer */}
        {isFormMode && (
          <div className="flex items-center gap-2 px-5 py-3 border-t shrink-0 bg-white justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (isEdit) {
                  if (customer) {
                    setForm({
                      name: customer.name || '',
                      nip: customer.nip || '',
                      phone: customer.phone || '',
                      email: customer.email || '',
                      contactPerson: customer.contact_person || '',
                      currency: customer.default_currency || 'PLN',
                      discountEnabled: (customer.discount_percent ?? 0) > 0,
                      discountPercent: customer.discount_percent ?? 0,
                      isNetPayer: customer.is_net_payer ?? false,
                      billingCountry: customer.billing_country_code || 'PL',
                      billingStreet: customer.billing_street || '',
                      billingStreetLine2: customer.billing_street_line2 || '',
                      billingPostalCode: customer.billing_postal_code || '',
                      billingCity: customer.billing_city || '',
                      shippingSameAsBilling: customer.shipping_same_as_billing ?? false,
                      shippingAddressee: customer.shipping_addressee || '',
                      shippingCountry: customer.shipping_country_code || 'PL',
                      shippingStreet: customer.shipping_street || '',
                      shippingStreetLine2: customer.shipping_street_line2 || '',
                      shippingPostalCode: customer.shipping_postal_code || '',
                      shippingCity: customer.shipping_city || '',
                      notes: customer.sales_notes || '',
                    });
                  }
                  resetDirty();
                  setEditMode(false);
                } else {
                  resetDirty();
                  onOpenChange(false);
                }
              }}
            >
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        )}
      </SheetContent>
      <UnsavedChangesDialog {...dialogProps} />
    </Sheet>
  );
};

const AddressFields = ({
  prefix,
  country,
  street,
  streetLine2,
  postalCode,
  city,
  onCountryChange,
  onStreetChange,
  onStreetLine2Change,
  onPostalCodeChange,
  onCityChange,
}: {
  prefix: string;
  country: string;
  street: string;
  streetLine2: string;
  postalCode: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStreetChange: (value: string) => void;
  onStreetLine2Change: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) => (
  <>
    <div>
      <Label htmlFor={`${prefix}-country`}>Kraj</Label>
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger id={`${prefix}-country`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label htmlFor={`${prefix}-street`}>Ulica</Label>
      <Input
        id={`${prefix}-street`}
        placeholder="Linia 1"
        value={street}
        onChange={(e) => onStreetChange(e.target.value)}
      />
      {country !== 'PL' && (
        <Input
          id={`${prefix}-street-line2`}
          className="mt-1"
          placeholder="Linia 2"
          value={streetLine2}
          onChange={(e) => onStreetLine2Change(e.target.value)}
        />
      )}
    </div>
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <div>
        <Label htmlFor={`${prefix}-postal`}>Kod pocztowy</Label>
        <Input
          id={`${prefix}-postal`}
          placeholder="00-000"
          value={postalCode}
          onChange={(e) => onPostalCodeChange(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-city`}>Miasto</Label>
        <Input id={`${prefix}-city`} value={city} onChange={(e) => onCityChange(e.target.value)} />
      </div>
    </div>
  </>
);

const ViewField = ({
  label,
  value,
  isPhone,
  isEmail,
}: {
  label: string;
  value?: string | null;
  isPhone?: boolean;
  isEmail?: boolean;
}) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isPhone ? (
        <a
          href={`tel:${value.replace(/\s/g, '')}`}
          className="text-primary hover:underline font-medium"
        >
          {value}
        </a>
      ) : isEmail ? (
        <a href={`mailto:${value}`} className="text-primary hover:underline font-medium">
          {value}
        </a>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  );
};

export default AddEditSalesCustomerDrawer;
