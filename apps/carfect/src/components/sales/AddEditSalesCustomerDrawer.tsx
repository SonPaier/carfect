import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Pencil } from 'lucide-react';
import {
  Sheet,
  SheetContent,
} from '@shared/ui';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Switch } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@shared/ui';
import NipLookupForm from './NipLookupForm';

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

const COUNTRIES = [
  { code: 'PL', name: 'Polska' },
  { code: 'DE', name: 'Niemcy' },
  { code: 'CZ', name: 'Czechy' },
  { code: 'SK', name: 'Słowacja' },
  { code: 'UA', name: 'Ukraina' },
  { code: 'LT', name: 'Litwa' },
  { code: 'FR', name: 'Francja' },
  { code: 'GB', name: 'Wielka Brytania' },
  { code: 'IT', name: 'Włochy' },
  { code: 'ES', name: 'Hiszpania' },
  { code: 'NL', name: 'Holandia' },
  { code: 'BE', name: 'Belgia' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Szwajcaria' },
  { code: 'SE', name: 'Szwecja' },
  { code: 'NO', name: 'Norwegia' },
  { code: 'DK', name: 'Dania' },
  { code: 'FI', name: 'Finlandia' },
  { code: 'PT', name: 'Portugalia' },
  { code: 'IE', name: 'Irlandia' },
  { code: 'HU', name: 'Węgry' },
  { code: 'RO', name: 'Rumunia' },
  { code: 'BG', name: 'Bułgaria' },
  { code: 'HR', name: 'Chorwacja' },
  { code: 'SI', name: 'Słowenia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Łotwa' },
  { code: 'GR', name: 'Grecja' },
  { code: 'US', name: 'Stany Zjednoczone' },
  { code: 'CA', name: 'Kanada' },
  { code: 'CN', name: 'Chiny' },
  { code: 'JP', name: 'Japonia' },
  { code: 'KR', name: 'Korea Południowa' },
  { code: 'AU', name: 'Australia' },
  { code: 'BY', name: 'Białoruś' },
  { code: 'TR', name: 'Turcja' },
  { code: 'RU', name: 'Rosja' },
] as const;

const emptyForm = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  currency: 'PLN',
  discountEnabled: false,
  discountPercent: 0,
  isNetPayer: false,
  notes: '',
  shippingAddressee: '',
  shippingCountry: 'PL',
  shippingStreet: '',
  shippingStreetLine2: '',
  shippingPostalCode: '',
  shippingCity: '',
  nip: '',
  company: '',
  billingStreet: '',
  billingPostalCode: '',
  billingCity: '',
};

const AddEditSalesCustomerDrawer = ({ open, onOpenChange, customer, instanceId, onSaved, initialEditMode = false }: Props) => {
  const isMobile = useIsMobile();
  const isEdit = !!customer;
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!customer?.id) return;
    setOrdersLoading(true);
    const { data } = await (supabase
      .from('sales_orders')
      .select('id, order_number, created_at, total_net, currency, status, delivery_type, payment_method')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false }) as any);
    setOrders((data as any[]) || []);
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
        contactPerson: customer.contact_person || '',
        phone: customer.phone || '',
        email: customer.email || '',
        currency: customer.default_currency || 'PLN',
        discountEnabled: (customer.discount_percent ?? 0) > 0,
        discountPercent: customer.discount_percent ?? 0,
        isNetPayer: customer.is_net_payer ?? false,
        notes: customer.sales_notes || '',
        shippingAddressee: customer.shipping_addressee || '',
        shippingCountry: customer.shipping_country_code || 'PL',
        shippingStreet: customer.shipping_street || '',
        shippingStreetLine2: customer.shipping_street_line2 || '',
        shippingPostalCode: customer.shipping_postal_code || '',
        shippingCity: customer.shipping_city || '',
        nip: customer.nip || '',
        company: customer.company || '',
        billingStreet: customer.billing_street || '',
        billingPostalCode: customer.billing_postal_code || '',
        billingCity: customer.billing_city || '',
      });
    } else {
      setForm(emptyForm);
      setEditMode(true);
    }
  }, [open, customer]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nazwa jest wymagana');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Telefon jest wymagany');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        instance_id: instanceId,
        name: form.name.trim(),
        contact_person: form.contactPerson.trim() || null,
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        default_currency: form.currency || 'PLN',
        discount_percent: form.discountEnabled ? form.discountPercent : null,
        is_net_payer: form.isNetPayer,
        sales_notes: form.notes.trim() || null,
        shipping_addressee: form.shippingAddressee.trim() || null,
        shipping_country_code: form.shippingCountry || 'PL',
        shipping_street: form.shippingStreet.trim() || null,
        shipping_street_line2: form.shippingStreetLine2.trim() || null,
        shipping_postal_code: form.shippingPostalCode.trim() || null,
        shipping_city: form.shippingCity.trim() || null,
        nip: form.nip.trim() || null,
        company: form.company.trim() || null,
        billing_street: form.billingStreet.trim() || null,
        billing_postal_code: form.billingPostalCode.trim() || null,
        billing_city: form.billingCity.trim() || null,
      };

      if (customer?.id) {
        const { error } = await (supabase
          .from('customers')
          .update(payload)
          .eq('id', customer.id) as any);
        if (error) throw error;
        toast.success('Klient zaktualizowany');
      } else {
        const { error } = await (supabase
          .from('customers')
          .insert(payload as any) as any);
        if (error) throw error;
        toast.success('Klient dodany');
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Błąd zapisu: ' + (err.message || 'Nieznany błąd'));
    } finally {
      setSaving(false);
    }
  };

  const renderViewMode = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
      <TabsList variant="underline" className="w-full">
        <TabsTrigger value="orders">Zamówienia</TabsTrigger>
        <TabsTrigger value="data">Dane</TabsTrigger>
      </TabsList>

      <TabsContent value="data" className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="space-y-3 text-sm">
          <ViewField label="Nazwa" value={form.name} />
          <ViewField label="Osoba kontaktowa" value={form.contactPerson} />
          <ViewField label="Telefon" value={form.phone} isPhone />
          <ViewField label="Email" value={form.email} isEmail />
          <ViewField label="Waluta" value={CURRENCIES.find(c => c.value === form.currency)?.label || form.currency} />
          {form.discountEnabled && (
            <ViewField label="Rabat" value={`${form.discountPercent}%`} />
          )}
          <ViewField label="Płatnik" value={form.isNetPayer ? 'netto' : 'brutto'} />
          <ViewField label="Notatki" value={form.notes} />
        </div>

        {(form.shippingStreet || form.shippingCity || form.shippingAddressee) && (
          <>
            <Separator />
            <div className="space-y-3 text-sm">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adres wysyłki</h4>
              {form.shippingAddressee && <ViewField label="Adresat" value={form.shippingAddressee} />}
              <ViewField label="Kraj" value={COUNTRIES.find(c => c.code === form.shippingCountry)?.name || form.shippingCountry} />
              <ViewField label="Adres" value={[form.shippingStreet, form.shippingStreetLine2, `${form.shippingPostalCode} ${form.shippingCity}`].filter(Boolean).join(', ')} />
            </div>
          </>
        )}

        <Separator />
        <NipLookupForm
          readOnly
          value={{
            nip: form.nip,
            company: form.company,
            billingStreet: form.billingStreet,
            billingPostalCode: form.billingPostalCode,
            billingCity: form.billingCity,
          }}
          onChange={() => {}}
        />
      </TabsContent>

      <TabsContent value="orders" className="flex-1 overflow-y-auto">
        {ordersLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Ładowanie...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Brak zamówień</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="border rounded-md p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(o.created_at), 'dd.MM.yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.status === 'wysłany' ? 'bg-emerald-600 text-white' : 'border border-amber-500 text-amber-600'}`}>
                      {o.status === 'nowy' ? 'Nowy' : o.status === 'wysłany' ? 'Wysłany' : o.status}
                    </span>
                    {o.delivery_type && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {o.delivery_type === 'shipping' ? 'Wysyłka' : o.delivery_type === 'pickup' ? 'Odbiór osobisty' : o.delivery_type === 'uber' ? 'Uber' : o.delivery_type}
                      </span>
                    )}
                    {o.payment_method && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {o.payment_method === 'cod' ? 'Za pobraniem' : o.payment_method === 'transfer' ? 'Przelew' : o.payment_method}
                      </span>
                    )}
                  </div>
                  <span>
                    {o.total_net?.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} {o.currency === 'EUR' ? '€' : 'zł'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  const renderFormMode = () => (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
      <div className="space-y-3">
        <div>
          <Label htmlFor="name">Nazwa *</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="contact-person">Osoba kontaktowa</Label>
          <Input id="contact-person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="currency">Waluta</Label>
          <Select value={form.currency} onValueChange={(value) => setForm({ ...form, currency: value })}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="discount-toggle">Rabat</Label>
          <Switch
            id="discount-toggle"
            checked={form.discountEnabled}
            onCheckedChange={(checked) => setForm({ ...form, discountEnabled: checked })}
          />
        </div>
        {form.discountEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              className="w-24"
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="net-payer-toggle">Płatnik netto</Label>
          <Switch
            id="net-payer-toggle"
            checked={form.isNetPayer}
            onCheckedChange={(checked) => setForm({ ...form, isNetPayer: checked })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notatki</Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adres wysyłki</h4>
        <div>
          <Label htmlFor="ship-addressee">Adresat</Label>
          <Input id="ship-addressee" value={form.shippingAddressee} onChange={(e) => setForm({ ...form, shippingAddressee: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="ship-country">Kraj</Label>
          <Select value={form.shippingCountry} onValueChange={(value) => setForm({ ...form, shippingCountry: value })}>
            <SelectTrigger id="ship-country">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ship-street">Adres</Label>
          <Input id="ship-street" value={form.shippingStreet} onChange={(e) => setForm({ ...form, shippingStreet: e.target.value })} />
          <Input id="ship-street-line2" className="mt-1" placeholder="Linia 2 (opcjonalne)" value={form.shippingStreetLine2} onChange={(e) => setForm({ ...form, shippingStreetLine2: e.target.value })} />
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <div>
            <Label htmlFor="ship-postal">Kod pocztowy</Label>
            <Input id="ship-postal" placeholder="00-000" value={form.shippingPostalCode} onChange={(e) => setForm({ ...form, shippingPostalCode: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="ship-city">Miasto</Label>
            <Input id="ship-city" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
          </div>
        </div>
      </div>

      <Separator />

      <NipLookupForm
        value={{
          nip: form.nip,
          company: form.company,
          billingStreet: form.billingStreet,
          billingPostalCode: form.billingPostalCode,
          billingCity: form.billingCity,
        }}
        onChange={(nipData) =>
          setForm({
            ...form,
            nip: nipData.nip,
            company: nipData.company,
            billingStreet: nipData.billingStreet,
            billingPostalCode: nipData.billingPostalCode,
            billingCity: nipData.billingCity,
          })
        }
      />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[var(--drawer-width)] flex flex-col p-0 gap-0 shadow-[-8px_0_30px_-12px_rgba(0,0,0,0.15)] bg-white [&_input]:border-foreground/60 [&_textarea]:border-foreground/60 [&_select]:border-foreground/60"
        hideCloseButton
        hideOverlay
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
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
          <div className="flex items-center gap-2 px-5 py-3 border-t shrink-0 bg-white">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (isEdit) setEditMode(false);
                else onOpenChange(false);
              }}
            >
              Anuluj
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const ViewField = ({ label, value, isPhone, isEmail }: { label: string; value?: string | null; isPhone?: boolean; isEmail?: boolean }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {isPhone ? (
        <a href={`tel:${value.replace(/\s/g, '')}`} className="text-primary hover:underline font-medium">{value}</a>
      ) : isEmail ? (
        <a href={`mailto:${value}`} className="text-primary hover:underline font-medium">{value}</a>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  );
};

export default AddEditSalesCustomerDrawer;
