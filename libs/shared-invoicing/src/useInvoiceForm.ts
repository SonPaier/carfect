import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { useInvoicingSettings } from './useInvoicingSettings';
import type { InvoicePosition, DocumentKind, PaymentType } from './invoicing.types';

export type PriceMode = 'netto' | 'brutto';

export interface UseInvoiceFormOptions {
  instanceId: string;
  calendarItemId?: string;
  salesOrderId?: string;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerNip?: string | null;
  positions?: InvoicePosition[];
  onSuccess?: () => void;
  onClose?: () => void;
  supabaseClient: any; // SupabaseClient
  /** Table to query/update customer data. Defaults to 'customers'. */
  customerTable?: string;
  /** Available bank accounts from instance config */
  bankAccounts?: { name: string; number: string }[];
}

export function useInvoiceForm(open: boolean, options: UseInvoiceFormOptions) {
  const {
    instanceId,
    calendarItemId,
    salesOrderId,
    customerId,
    customerName,
    customerEmail,
    customerNip,
    positions: initialPositions,
    onSuccess,
    onClose,
    supabaseClient,
    customerTable = 'customers',
    bankAccounts = [],
  } = options;

  const { settings } = useInvoicingSettings(instanceId, supabaseClient);
  const [submitting, setSubmitting] = useState(false);

  const [kind, setKind] = useState<DocumentKind>('vat');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sellDate, setSellDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentDays, setPaymentDays] = useState(14);
  const [priceMode, setPriceMode] = useState<PriceMode>('netto');
  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxNo, setBuyerTaxNo] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerStreet, setBuyerStreet] = useState('');
  const [buyerPostCode, setBuyerPostCode] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerCountry, setBuyerCountry] = useState('PL');
  const [paymentType, setPaymentType] = useState<PaymentType>('transfer');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [positions, setPositions] = useState<InvoicePosition[]>([
    { name: '', quantity: 1, unit_price_gross: 0, vat_rate: 23, unit: 'szt.', discount: 0 },
  ]);

  // Initialize from props/settings
  useEffect(() => {
    if (!open) return;
    if (settings) {
      setKind((settings.default_document_kind as DocumentKind) || 'vat');
      setPaymentDays(settings.default_payment_days || 14);
      setPaymentType((settings.default_payment_type as PaymentType) || 'transfer');
    }
    setBuyerName(customerName || '');
    setBuyerEmail(customerEmail || '');
    setBuyerTaxNo(customerNip || '');
    setBuyerStreet('');
    setBuyerPostCode('');
    setBuyerCity('');
    setBuyerCountry('PL');
    setAutoSendEmail(settings?.auto_send_email ?? false);
    setSelectedBankAccount(bankAccounts[0]?.number || '');
    if (initialPositions?.length) {
      setPositions(initialPositions);
    }
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setSellDate(format(new Date(), 'yyyy-MM-dd'));
  }, [open]);

  // Fetch customer billing data if not provided
  useEffect(() => {
    if (!open || !customerId) return;
    supabaseClient
      .from(customerTable)
      .select('nip, email, company, billing_city, billing_postal_code, billing_street')
      .eq('id', customerId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          if (data.nip) setBuyerTaxNo(data.nip);
          if (data.email) setBuyerEmail(data.email);
          if (data.company) setBuyerName(data.company);
          if (data.billing_street) setBuyerStreet(data.billing_street);
          if (data.billing_postal_code) setBuyerPostCode(data.billing_postal_code);
          if (data.billing_city) setBuyerCity(data.billing_city);
        }
      });
  }, [open, customerId]);

  // Fetch service address from calendar item as fallback for buyer address
  useEffect(() => {
    if (!open || !calendarItemId) return;
    // If customer is linked, billing address comes from customer effect — skip
    if (customerId) return;
    const fetchAddress = async () => {
      // Only fetch if no billing address was set
      if (buyerCity || buyerPostCode || buyerStreet) return;
      const { data: item } = await supabaseClient
        .from('calendar_items')
        .select('customer_address_id')
        .eq('id', calendarItemId)
        .single();
      if (item?.customer_address_id) {
        const { data: addr } = await supabaseClient
          .from('customer_addresses')
          .select('city, postal_code, street')
          .eq('id', item.customer_address_id)
          .single();
        if (addr) {
          if (addr.street && !buyerStreet) setBuyerStreet(addr.street);
          if (addr.postal_code && !buyerPostCode) setBuyerPostCode(addr.postal_code);
          if (addr.city && !buyerCity) setBuyerCity(addr.city);
        }
      }
    };
    fetchAddress();
  }, [open, calendarItemId, buyerCity, buyerPostCode, buyerStreet]);

  // Fetch services for calendar item if no initial positions
  useEffect(() => {
    if (!open || !calendarItemId || initialPositions?.length) return;
    const fetch = async () => {
      const { data } = await supabaseClient
        .from('calendar_item_services')
        .select('custom_price, quantity, service_id, unified_services(name, price, unit)')
        .eq('calendar_item_id', calendarItemId);
      if (data?.length) {
        const pos: InvoicePosition[] = data.map((s: any) => ({
          name: s.unified_services?.name || 'Usluga',
          quantity: s.quantity != null ? Number(s.quantity) : 1,
          unit_price_gross:
            Math.round((s.custom_price ?? s.unified_services?.price ?? 0) * 100) / 100,
          vat_rate: settings?.default_vat_rate ?? 23,
          unit: s.unified_services?.unit || 'szt.',
        }));
        setPositions(pos);
      }
    };
    fetch();
  }, [open, calendarItemId]);

  const paymentTo = useMemo(() => {
    try {
      return format(addDays(new Date(issueDate), paymentDays), 'yyyy-MM-dd');
    } catch {
      return issueDate;
    }
  }, [issueDate, paymentDays]);

  // Calculate totals based on price mode (round per-line to avoid floating point drift)
  const { totalNetto, totalVat, totalGross } = useMemo(() => {
    const r = (v: number) => Math.round(v * 100) / 100;
    let netto = 0;
    let brutto = 0;
    for (const p of positions) {
      const discountMultiplier = 1 - (p.discount || 0) / 100;
      const lineTotal = r(p.unit_price_gross * p.quantity * discountMultiplier);
      // vat_rate -1 means "zwolniony" (exempt) — netto equals brutto
      if (p.vat_rate === -1) {
        netto += lineTotal;
        brutto += lineTotal;
        continue;
      }
      const rate = p.vat_rate / 100;
      if (priceMode === 'netto') {
        netto += lineTotal;
        brutto += r(lineTotal * (1 + rate));
      } else {
        brutto += lineTotal;
        netto += r(lineTotal / (1 + rate));
      }
    }
    return { totalNetto: r(netto), totalVat: r(brutto - netto), totalGross: r(brutto) };
  }, [positions, priceMode]);

  const addPosition = () => {
    setPositions([
      ...positions,
      {
        name: '',
        quantity: 1,
        unit_price_gross: 0,
        vat_rate: settings?.default_vat_rate ?? 23,
        unit: 'szt.',
        discount: 0,
      },
    ]);
  };

  const removePosition = (idx: number) => {
    if (positions.length <= 1) return;
    setPositions(positions.filter((_, i) => i !== idx));
  };

  const updatePosition = (idx: number, field: keyof InvoicePosition, value: any) => {
    const updated = [...positions];
    updated[idx] = { ...updated[idx], [field]: value };
    setPositions(updated);
  };

  const [autoSendEmail, setAutoSendEmail] = useState(false);

  const handleSubmit = async () => {
    if (!buyerName.trim()) {
      toast.error('Podaj nazwe nabywcy');
      return;
    }
    if (positions.some((p) => !p.name.trim())) {
      toast.error('Uzupelnij nazwy pozycji');
      return;
    }
    if (positions.some((p) => p.quantity <= 0)) {
      toast.error('Ilość musi być większa od 0');
      return;
    }
    if (positions.some((p) => p.unit_price_gross < 0)) {
      toast.error('Cena nie może być ujemna');
      return;
    }
    if (paymentDays < 1) {
      toast.error('Termin płatności musi wynosić min. 1 dzień');
      return;
    }

    // Always convert positions to brutto for the API, applying discount
    const grossPositions = positions.map((p) => {
      const discountMultiplier = 1 - (p.discount || 0) / 100;
      const discountedPrice = Math.round(p.unit_price_gross * discountMultiplier * 100) / 100;
      if (priceMode === 'netto') {
        if (p.vat_rate === -1) return { ...p, unit_price_gross: discountedPrice, discount: 0 };
        const rate = p.vat_rate / 100;
        return {
          ...p,
          unit_price_gross: Math.round(discountedPrice * (1 + rate) * 100) / 100,
          discount: 0,
        };
      }
      return { ...p, unit_price_gross: discountedPrice, discount: 0 };
    });

    setSubmitting(true);
    try {
      const { data, error } = await supabaseClient.functions.invoke('invoicing-api', {
        body: {
          action: 'create_invoice',
          instanceId,
          calendarItemId,
          salesOrderId,
          customerId,
          autoSendEmail,
          invoiceData: {
            kind,
            issue_date: issueDate,
            sell_date: sellDate,
            payment_to: paymentTo,
            payment_type: paymentType,
            buyer_name: buyerName,
            buyer_tax_no: buyerTaxNo,
            buyer_email: buyerEmail,
            buyer_street: buyerStreet,
            buyer_post_code: buyerPostCode,
            buyer_city: buyerCity,
            buyer_country: buyerCountry || 'PL',
            place: settings?.default_place || undefined,
            seller_person: settings?.default_seller_person || undefined,
            bank_account: selectedBankAccount || undefined,
            currency: 'PLN',
            positions: grossPositions,
            oid: calendarItemId,
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Nadpisz cene zlecenia kwota netto z faktury
      if (calendarItemId) {
        await supabaseClient
          .from('calendar_items')
          .update({ price: totalNetto })
          .eq('id', calendarItemId);
      }

      // Zapisz dane fakturowe do klienta (NIP, adres rozliczeniowy)
      if (customerId && buyerTaxNo) {
        const updateData: Record<string, string> = {
          nip: buyerTaxNo,
        };
        if (buyerName) updateData.company = buyerName;
        if (buyerStreet) updateData.billing_street = buyerStreet;
        if (buyerPostCode) updateData.billing_postal_code = buyerPostCode;
        if (buyerCity) updateData.billing_city = buyerCity;
        await supabaseClient.from(customerTable).update(updateData).eq('id', customerId);
      }

      toast.success(
        data?.invoice?.invoice_number
          ? `Faktura ${data.invoice.invoice_number} wystawiona`
          : 'Faktura wystawiona',
      );
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      console.error('Invoice creation error:', err);
      toast.error(err.message || 'Blad wystawiania faktury');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    settings,
    submitting,
    kind,
    setKind,
    issueDate,
    setIssueDate,
    sellDate,
    setSellDate,
    paymentDays,
    setPaymentDays,
    priceMode,
    setPriceMode,
    buyerName,
    setBuyerName,
    buyerTaxNo,
    setBuyerTaxNo,
    buyerEmail,
    setBuyerEmail,
    buyerStreet,
    setBuyerStreet,
    buyerPostCode,
    setBuyerPostCode,
    buyerCity,
    setBuyerCity,
    buyerCountry,
    setBuyerCountry,
    paymentType,
    setPaymentType,
    positions,
    paymentTo,
    totalNetto,
    totalVat,
    totalGross,
    autoSendEmail,
    setAutoSendEmail,
    bankAccounts,
    selectedBankAccount,
    setSelectedBankAccount,
    addPosition,
    removePosition,
    updatePosition,
    handleSubmit,
  };
}
