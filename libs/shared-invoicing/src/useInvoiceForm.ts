import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addDays, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { useInvoicingSettings } from './useInvoicingSettings';
import type { InvoicePosition, DocumentKind, PaymentType } from './invoicing.types';
import { mapFakturowniaToInternal, type KsefStatusInfo } from './fakturowniaMappers';
import { positionDiff, type DiffStatus } from './positionDiff';

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
  /**
   * When set, the form opens in EDIT mode: it fetches the current state of the
   * invoice from Fakturownia (via get_invoice action), populates the form, and
   * snapshots positions for the diff/update logic. handleSubmit then dispatches
   * update_invoice instead of create_invoice.
   */
  existingInvoiceId?: string;
  /**
   * Optional positions coming from a sales order whose products changed.
   * When provided alongside `existingInvoiceId`, the form merges Fakturownia
   * positions with these via positionDiff and exposes diffStatus[] for UI
   * highlighting (added=green, removed=red).
   */
  incomingPositions?: InvoicePosition[];
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
    existingInvoiceId,
    incomingPositions,
  } = options;
  const mode: 'create' | 'edit' = existingInvoiceId ? 'edit' : 'create';

  const { settings } = useInvoicingSettings(instanceId, supabaseClient);
  const [submitting, setSubmitting] = useState(false);

  const [kind, setKind] = useState<DocumentKind>('vat');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sellDate, setSellDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentDays, setPaymentDays] = useState<number | 'month'>(14);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [priceMode, setPriceMode] = useState<PriceMode>('netto');
  const [buyerName, setBuyerName] = useState('');
  const [buyerTaxNo, setBuyerTaxNo] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerStreet, setBuyerStreet] = useState('');
  const [buyerPostCode, setBuyerPostCode] = useState('');
  const [buyerCity, setBuyerCity] = useState('');
  const [buyerCountry, setBuyerCountry] = useState('PL');
  const [paymentType, setPaymentType] = useState<PaymentType>('transfer');
  const [splitPayment, setSplitPayment] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerTaxNo, setSellerTaxNo] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [positions, setPositions] = useState<InvoicePosition[]>([
    { name: '', quantity: 1, unit_price_gross: 0, vat_rate: 23, unit: 'szt.', discount: 0 },
  ]);

  // ---- Edit-mode state ----
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [ksef, setKsef] = useState<KsefStatusInfo | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  /** Snapshot of positions at edit-load time. Used to compute removed positions for update_invoice. */
  const originalPositionsRef = useRef<InvoicePosition[]>([]);
  /** Per-row diff status when invoking edit-with-diff (incoming order positions). */
  const [positionDiffStatus, setPositionDiffStatus] = useState<DiffStatus[] | undefined>(undefined);

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
    setSplitPayment(false);
    setPaidAmount(0);
    if (initialPositions?.length) {
      setPositions(initialPositions);
    }
    setIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setSellDate(format(new Date(), 'yyyy-MM-dd'));
  }, [open]);

  // EDIT mode: fetch fresh invoice state from Fakturownia and populate form.
  useEffect(() => {
    if (!open || !existingInvoiceId) return;
    let cancelled = false;
    setLoadingExisting(true);
    (async () => {
      try {
        const { data, error } = await supabaseClient.functions.invoke('invoicing-api', {
          body: { action: 'get_invoice', instanceId, invoiceId: existingInvoiceId },
        });
        if (cancelled) return;
        if (error || data?.error) {
          toast.error(data?.error || 'Nie udało się wczytać faktury z Fakturowni');
          return;
        }
        const fv = data?.fakturownia;
        if (!fv) return;
        const mapped = mapFakturowniaToInternal(fv);
        setInvoiceNumber(mapped.invoiceNumber);
        setKsef(mapped.ksef);
        setKind(mapped.kind);
        setIssueDate(mapped.issueDate);
        setSellDate(mapped.sellDate);
        setPaymentType(mapped.paymentType);
        setBuyerName(mapped.buyerName);
        setBuyerTaxNo(mapped.buyerTaxNo);
        setBuyerEmail(mapped.buyerEmail);
        setBuyerStreet(mapped.buyerStreet);
        setBuyerPostCode(mapped.buyerPostCode);
        setBuyerCity(mapped.buyerCity);
        setBuyerCountry(mapped.buyerCountry);
        if (mapped.sellerName) setSellerName(mapped.sellerName);
        if (mapped.sellerTaxNo) setSellerTaxNo(mapped.sellerTaxNo);
        if (mapped.sellerEmail) setSellerEmail(mapped.sellerEmail);
        if (mapped.sellerAddress) setSellerAddress(mapped.sellerAddress);
        setPaidAmount(mapped.paidAmount);
        originalPositionsRef.current = mapped.positions.map((p) => ({ ...p }));
        if (incomingPositions && incomingPositions.length > 0) {
          const { merged, statuses } = positionDiff(mapped.positions, incomingPositions);
          setPositions(merged);
          setPositionDiffStatus(statuses);
        } else {
          setPositions(mapped.positions);
          setPositionDiffStatus(undefined);
        }
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, existingInvoiceId, instanceId]);

  // Fetch sales-CRM seller settings (company shown on the invoice)
  useEffect(() => {
    if (!open || !instanceId) return;
    supabaseClient
      .from('sales_instance_settings')
      .select('name, short_name, nip, address, email, phone, invoice_company_name')
      .eq('instance_id', instanceId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!data) return;
        setSellerName(data.invoice_company_name || data.name || data.short_name || '');
        setSellerTaxNo(data.nip || '');
        setSellerAddress(data.address || '');
        setSellerEmail(data.email || '');
        setSellerPhone(data.phone || '');
      });
  }, [open, instanceId]);

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
      const base = new Date(issueDate);
      const target = paymentDays === 'month' ? addMonths(base, 1) : addDays(base, paymentDays);
      return format(target, 'yyyy-MM-dd');
    } catch {
      return issueDate;
    }
  }, [issueDate, paymentDays]);

  // Calculate totals based on price mode (round per-line to avoid floating point drift)
  const { totalNetto, totalVat, totalGross } = useMemo(() => {
    // Sum raw (no per-line rounding) to stay consistent with sales-CRM totals.
    // Rounding only at the very end for display.
    const r = (v: number) => Math.round(v * 100) / 100;
    let netto = 0;
    let brutto = 0;
    for (const p of positions) {
      const discountMultiplier = 1 - (Number(p.discount) || 0) / 100;
      const lineTotal = Number(p.unit_price_gross) * Number(p.quantity) * discountMultiplier;
      if (p.vat_rate === -1) {
        netto += lineTotal;
        brutto += lineTotal;
        continue;
      }
      const rate = p.vat_rate / 100;
      if (priceMode === 'netto') {
        netto += lineTotal;
        brutto += lineTotal * (1 + rate);
      } else {
        brutto += lineTotal;
        netto += lineTotal / (1 + rate);
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

  const movePosition = (from: number, to: number) => {
    if (from === to) return;
    if (from < 0 || from >= positions.length) return;
    if (to < 0 || to >= positions.length) return;
    const updated = [...positions];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
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

    // Convert positions to brutto for the API, keeping discount visible on invoice
    // Skip rows marked as 'removed' in the diff — they will be sent as _destroy:1
    // by the update mapper based on originalPositionsRef.
    const submittablePositions =
      positionDiffStatus && positionDiffStatus.length === positions.length
        ? positions.filter((_, i) => positionDiffStatus[i] !== 'removed')
        : positions;
    const grossPositions = submittablePositions.map((p) => {
      if (priceMode === 'netto') {
        if (p.vat_rate === -1) return { ...p };
        const rate = p.vat_rate / 100;
        return {
          ...p,
          unit_price_gross: Math.round(p.unit_price_gross * (1 + rate) * 100) / 100,
        };
      }
      return { ...p };
    });

    const invoiceData = {
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
      seller_name: sellerName || undefined,
      seller_tax_no: sellerTaxNo || undefined,
      seller_email: sellerEmail || undefined,
      seller_address: sellerAddress || undefined,
      seller_phone: sellerPhone || undefined,
      bank_account: selectedBankAccount || undefined,
      split_payment: splitPayment,
      paid: paidAmount > 0 ? paidAmount : undefined,
      payment_to_kind: paymentDays === 'month' ? '30' : String(paymentDays),
      currency: 'PLN',
      positions: grossPositions,
      oid: calendarItemId,
    };

    setSubmitting(true);
    try {
      const requestBody =
        mode === 'edit'
          ? {
              action: 'update_invoice',
              instanceId,
              invoiceId: existingInvoiceId,
              invoiceData,
              originalPositions: originalPositionsRef.current,
              autoSendEmail,
            }
          : {
              action: 'create_invoice',
              instanceId,
              calendarItemId,
              salesOrderId,
              customerId,
              autoSendEmail,
              invoiceData,
            };

      const { data, error } = await supabaseClient.functions.invoke('invoicing-api', {
        body: requestBody,
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

      const successMsg =
        mode === 'edit'
          ? `Faktura ${data?.invoice?.invoice_number || invoiceNumber || ''} zaktualizowana`
          : data?.invoice?.invoice_number
            ? `Faktura ${data.invoice.invoice_number} wystawiona`
            : 'Faktura wystawiona';
      toast.success(successMsg.trim());
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      console.error(mode === 'edit' ? 'Invoice update error:' : 'Invoice creation error:', err);
      toast.error(
        err.message || (mode === 'edit' ? 'Błąd aktualizacji faktury' : 'Blad wystawiania faktury'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    settings,
    submitting,
    mode,
    loadingExisting,
    invoiceNumber,
    ksef,
    positionDiffStatus,
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
    splitPayment,
    setSplitPayment,
    paidAmount,
    setPaidAmount,
    sellerName,
    setSellerName,
    sellerTaxNo,
    setSellerTaxNo,
    sellerAddress,
    setSellerAddress,
    sellerEmail,
    setSellerEmail,
    sellerPhone,
    setSellerPhone,
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
    movePosition,
    handleSubmit,
  };
}
