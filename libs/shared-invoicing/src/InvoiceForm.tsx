import { useEffect, useState } from 'react';
import { Trash2, Search, Loader2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { toast } from 'sonner';
import {
  DOCUMENT_KINDS,
  PAYMENT_TYPES,
  CURRENCIES,
  type InvoicePosition,
  type DocumentKind,
  type PaymentType,
} from './invoicing.types';

type PriceMode = 'netto' | 'brutto';

const VAT_OPTIONS: { value: number; label: string }[] = [
  { value: 23, label: '23' },
  { value: 8, label: '8' },
  { value: 5, label: '5' },
  { value: 0, label: '0' },
  { value: -1, label: 'zw' },
];

const UNIT_OPTIONS = ['szt.', 'm', 'm2', 'm3', 'kg', 'l', 'h', 'usł.'];

const PAYMENT_TERM_OPTIONS: { value: number | 'month'; label: string }[] = [
  { value: 0, label: 'natychmiast' },
  { value: 1, label: '1 dzień' },
  { value: 3, label: '3 dni' },
  { value: 5, label: '5 dni' },
  { value: 7, label: '7 dni' },
  { value: 14, label: '14 dni' },
  { value: 21, label: '21 dni' },
  { value: 30, label: '30 dni' },
  { value: 45, label: '45 dni' },
  { value: 60, label: '60 dni' },
  { value: 75, label: '75 dni' },
  { value: 90, label: '90 dni' },
  { value: 'month', label: '1 miesiąc' },
];

interface InvoiceFormProps {
  kind: DocumentKind;
  onKindChange: (v: DocumentKind) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  sellDate: string;
  onSellDateChange: (v: string) => void;
  paymentDays: number | 'month';
  onPaymentDaysChange: (v: number | 'month') => void;
  paidAmount?: number;
  onPaidAmountChange?: (v: number) => void;
  buyerName: string;
  onBuyerNameChange: (v: string) => void;
  buyerTaxNo: string;
  onBuyerTaxNoChange: (v: string) => void;
  buyerEmail: string;
  onBuyerEmailChange: (v: string) => void;
  buyerStreet: string;
  onBuyerStreetChange: (v: string) => void;
  buyerPostCode: string;
  onBuyerPostCodeChange: (v: string) => void;
  buyerCity: string;
  onBuyerCityChange: (v: string) => void;
  buyerCountry: string;
  onBuyerCountryChange: (v: string) => void;
  paymentType: PaymentType;
  onPaymentTypeChange: (v: PaymentType) => void;
  splitPayment?: boolean;
  onSplitPaymentChange?: (v: boolean) => void;
  sellerName?: string;
  onSellerNameChange?: (v: string) => void;
  sellerTaxNo?: string;
  onSellerTaxNoChange?: (v: string) => void;
  sellerAddress?: string;
  onSellerAddressChange?: (v: string) => void;
  sellerEmail?: string;
  onSellerEmailChange?: (v: string) => void;
  sellerPhone?: string;
  onSellerPhoneChange?: (v: string) => void;
  positions: InvoicePosition[];
  onAddPosition: () => void;
  onRemovePosition: (idx: number) => void;
  onUpdatePosition: (idx: number, field: keyof InvoicePosition, value: any) => void;
  onMovePosition?: (from: number, to: number) => void;
  /**
   * Optional per-row diff status. When provided, rows are highlighted:
   * - 'added' → green background (newly proposed)
   * - 'removed' → red background + strikethrough (will be deleted on save)
   * - 'unchanged' / undefined → no highlight
   */
  positionDiffStatus?: ('added' | 'removed' | 'unchanged' | undefined)[];
  priceMode: PriceMode;
  onPriceModeChange: (v: PriceMode) => void;
  totalNetto: number;
  totalVat: number;
  totalGross: number;
  paymentTo: string;
  autoSendEmail: boolean;
  onAutoSendEmailChange: (v: boolean) => void;
  settingsActive?: boolean;
  bankAccounts?: { name: string; number: string }[];
  selectedBankAccount?: string;
  onBankAccountChange?: (v: string) => void;
}

const fmt = (n: number) =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Parse a Polish-formatted money string ("10 000,00") to a JS number. */
const parsePLN = (s: string): number => {
  const cleaned = s.replace(/\s/g, '').replace(/ /g, '').replace(',', '.');
  const n = Number(cleaned);
  return isNaN(n) ? NaN : n;
};

export function InvoiceForm({
  kind,
  onKindChange,
  issueDate,
  onIssueDateChange,
  sellDate,
  onSellDateChange,
  paymentDays,
  onPaymentDaysChange,
  buyerName,
  onBuyerNameChange,
  buyerTaxNo,
  onBuyerTaxNoChange,
  buyerEmail,
  onBuyerEmailChange,
  buyerStreet,
  onBuyerStreetChange,
  buyerPostCode,
  onBuyerPostCodeChange,
  buyerCity,
  onBuyerCityChange,
  buyerCountry,
  onBuyerCountryChange,
  paymentType,
  onPaymentTypeChange,
  splitPayment = false,
  onSplitPaymentChange,
  paidAmount = 0,
  onPaidAmountChange,
  sellerName = '',
  onSellerNameChange,
  sellerTaxNo = '',
  onSellerTaxNoChange,
  sellerAddress = '',
  onSellerAddressChange,
  sellerEmail = '',
  onSellerEmailChange,
  sellerPhone = '',
  onSellerPhoneChange,
  positions,
  onAddPosition,
  onRemovePosition,
  onUpdatePosition,
  onMovePosition,
  positionDiffStatus,
  priceMode,
  onPriceModeChange,
  totalNetto,
  totalVat,
  totalGross,
  paymentTo,
  autoSendEmail,
  onAutoSendEmailChange,
  settingsActive,
  bankAccounts = [],
  selectedBankAccount = '',
  onBankAccountChange,
}: InvoiceFormProps) {
  const [nipLoading, setNipLoading] = useState(false);
  const [buyerKind, setBuyerKind] = useState<'company' | 'person'>(
    buyerTaxNo ? 'company' : 'person',
  );
  // Auto-switch to "Firma" when NIP appears (e.g. after edit-mode load or GUS lookup)
  useEffect(() => {
    if (buyerTaxNo && buyerTaxNo.replace(/\D/g, '').length >= 10) {
      setBuyerKind('company');
    }
  }, [buyerTaxNo]);
  const [showDiscount, setShowDiscount] = useState(positions.some((p) => (p.discount ?? 0) > 0));
  // Auto-show Rabat column when ANY position has a discount (e.g. after edit-mode load).
  useEffect(() => {
    if (positions.some((p) => (p.discount ?? 0) > 0)) {
      setShowDiscount(true);
    }
  }, [positions]);

  const handleNipLookup = async () => {
    const nip = buyerTaxNo.replace(/[^0-9]/g, '');
    if (!nip || nip.length !== 10) {
      toast.error('Wprowadz poprawny NIP (10 cyfr)');
      return;
    }
    setNipLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`);
      if (!response.ok) throw new Error('Nie znaleziono firmy');
      const data = await response.json();
      if (data.result?.subject) {
        const subject = data.result.subject;
        const addr = subject.workingAddress || subject.residenceAddress || '';
        const match = addr.match(/^(.+),\s*(\d{2}-\d{3})\s+(.+)$/);
        onBuyerNameChange(subject.name || '');
        if (match) {
          onBuyerStreetChange(match[1].trim());
          onBuyerPostCodeChange(match[2].trim());
          onBuyerCityChange(match[3].trim());
        }
        toast.success('Pobrano dane firmy z GUS');
      } else {
        toast.error('Nie znaleziono firmy o podanym NIP');
      }
    } catch {
      toast.error('Nie udalo sie pobrac danych firmy');
    } finally {
      setNipLoading(false);
    }
  };

  const computeRowValues = (pos: InvoicePosition) => {
    const entered = Number(pos.unit_price_gross) || 0;
    const qty = Number(pos.quantity) || 0;
    const discount = Number(pos.discount) || 0;
    const rate = pos.vat_rate === -1 ? 0 : pos.vat_rate / 100;

    const unitNet = priceMode === 'netto' ? entered : entered / (1 + rate);
    const unitNetAfterDisc = unitNet * (1 - discount / 100);
    const valueNet = unitNetAfterDisc * qty;
    const valueVat = valueNet * rate;
    const valueGross = valueNet + valueVat;

    return {
      unitNet,
      unitNetAfterDisc,
      valueNet,
      valueVat,
      valueGross,
    };
  };

  const movePosition = (from: number, to: number) => {
    if (!onMovePosition) return;
    onMovePosition(from, to);
  };

  return (
    <div className="space-y-6">
      {settingsActive === false && (
        <p className="text-sm text-destructive">
          Skonfiguruj integracje fakturowania w Ustawieniach → Integracje
        </p>
      )}

      {/* Top row: Typ | Numer | Data wystawienia | Miejsce | Data sprzedazy */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Typ</Label>
          <Select value={kind} onValueChange={(v) => onKindChange(v as DocumentKind)}>
            <SelectTrigger className="bg-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {DOCUMENT_KINDS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Numer</Label>
          <Input value="auto" readOnly className="bg-gray-50 h-9 cursor-default" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data wystawienia</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
            className="bg-white h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Miejsce wystawienia</Label>
          <Input
            value=""
            placeholder="(domyślne z Fakturowni)"
            readOnly
            className="bg-gray-50 h-9 cursor-default"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data sprzedaży</Label>
          <Input
            type="date"
            value={sellDate}
            onChange={(e) => onSellDateChange(e.target.value)}
            className="bg-white h-9"
          />
        </div>
      </div>

      {/* Sprzedawca | Nabywca */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-x-[100px]">
        {/* Sprzedawca */}
        <section className="space-y-3">
          <h3 className="text-base italic text-muted-foreground">Sprzedawca</h3>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Nazwa</Label>
              <Input
                value={sellerName}
                onChange={(e) => onSellerNameChange?.(e.target.value)}
                className="bg-white h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">NIP</Label>
              <Input
                value={sellerTaxNo}
                onChange={(e) => onSellerTaxNoChange?.(e.target.value)}
                className="bg-white h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Adres</Label>
              <Input
                value={sellerAddress}
                onChange={(e) => onSellerAddressChange?.(e.target.value)}
                className="bg-white h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={sellerEmail}
                  onChange={(e) => onSellerEmailChange?.(e.target.value)}
                  className="bg-white h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefon</Label>
                <Input
                  value={sellerPhone}
                  onChange={(e) => onSellerPhoneChange?.(e.target.value)}
                  className="bg-white h-9"
                />
              </div>
            </div>
          </div>
          {bankAccounts.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Rachunek bankowy</Label>
              <Select value={selectedBankAccount} onValueChange={(v) => onBankAccountChange?.(v)}>
                <SelectTrigger className="bg-white h-9">
                  <SelectValue placeholder="Wyszukaj rachunek bankowy" />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.number} value={acc.number}>
                      {acc.name ? `${acc.name} — ${acc.number}` : acc.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        {/* Nabywca */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base italic text-muted-foreground">Nabywca</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleNipLookup}
              disabled={nipLoading}
            >
              {nipLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Search className="w-3 h-3 mr-1" />
              )}
              Zaczytaj dane po NIP
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="buyerKind"
                checked={buyerKind === 'company'}
                onChange={() => setBuyerKind('company')}
                className="accent-primary"
              />
              Firma
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="buyerKind"
                checked={buyerKind === 'person'}
                onChange={() => setBuyerKind('person')}
                className="accent-primary"
              />
              Osoba prywatna
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Nabywca <span className="text-destructive">*</span>
            </Label>
            <Input
              value={buyerName}
              onChange={(e) => onBuyerNameChange(e.target.value)}
              placeholder="Nazwa nabywcy"
              className="bg-white h-9"
            />
          </div>

          {buyerKind === 'company' && (
            <div className="space-y-1">
              <Label className="text-xs">NIP</Label>
              <Input
                value={buyerTaxNo}
                onChange={(e) => onBuyerTaxNoChange(e.target.value)}
                placeholder="0000000000"
                className="bg-white h-9"
              />
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Ulica i nr</Label>
            <Input
              value={buyerStreet}
              onChange={(e) => onBuyerStreetChange(e.target.value)}
              className="bg-white h-9"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Kod pocztowy</Label>
              <Input
                value={buyerPostCode}
                onChange={(e) => onBuyerPostCodeChange(e.target.value)}
                className="bg-white h-9"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Miejscowość</Label>
              <Input
                value={buyerCity}
                onChange={(e) => onBuyerCityChange(e.target.value)}
                className="bg-white h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Kraj</Label>
              <Input
                value={buyerCountry}
                onChange={(e) => onBuyerCountryChange(e.target.value)}
                placeholder="PL"
                className="bg-white h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={buyerEmail}
                onChange={(e) => onBuyerEmailChange(e.target.value)}
                className="bg-white h-9"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Pozycje na fakturze */}
      <section className="rounded border border-border bg-white">
        {positionDiffStatus && positionDiffStatus.some((s) => s === 'added' || s === 'removed') && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs flex items-center gap-4">
            <span className="font-semibold">Zmiany do zatwierdzenia:</span>
            {positionDiffStatus.filter((s) => s === 'added').length > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-green-500 rounded" />
                dodano {positionDiffStatus.filter((s) => s === 'added').length}
              </span>
            )}
            {positionDiffStatus.filter((s) => s === 'removed').length > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-500 rounded" />
                usunięto {positionDiffStatus.filter((s) => s === 'removed').length}
              </span>
            )}
          </div>
        )}
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Pozycje na fakturze</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="priceMode"
                  checked={priceMode === 'netto'}
                  onChange={() => onPriceModeChange('netto')}
                  className="accent-primary"
                />
                Netto
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="priceMode"
                  checked={priceMode === 'brutto'}
                  onChange={() => onPriceModeChange('brutto')}
                  className="accent-primary"
                />
                Brutto
              </label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowDiscount((v) => !v)}
            >
              {showDiscount ? 'ukryj Rabat' : 'dodaj Rabat'}
            </Button>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr>
                <th className="text-left px-2 py-2 w-10"></th>
                <th className="text-left px-2 py-2">Nazwa</th>
                {showDiscount && <th className="text-right px-2 py-2 w-20">Rabat %</th>}
                <th className="text-right px-2 py-2 w-28">Ilość</th>
                <th className="text-left px-2 py-2 w-24">Jednostka</th>
                <th className="text-right px-2 py-2 w-[100px]">
                  Cena {priceMode === 'netto' ? 'netto' : 'brutto'}
                </th>
                <th className="text-right px-2 py-2 w-20">VAT %</th>
                <th className="text-right px-2 py-2 w-32">Wartość netto</th>
                <th className="text-right px-2 py-2 w-32">Wartość brutto</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, idx) => {
                const v = computeRowValues(pos);
                const status = positionDiffStatus?.[idx];
                const rowClass =
                  status === 'added'
                    ? 'border-t border-border align-top bg-green-50 border-l-4 border-l-green-500'
                    : status === 'removed'
                      ? 'border-t border-border align-top bg-red-50 border-l-4 border-l-red-500 line-through opacity-70'
                      : 'border-t border-border align-top';
                return (
                  <tr key={idx} className={rowClass}>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-4 text-center">{idx + 1}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => movePosition(idx, idx - 1)}
                            disabled={idx === 0}
                            className="hover:bg-muted disabled:opacity-30 rounded p-0.5"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePosition(idx, idx + 1)}
                            disabled={idx === positions.length - 1}
                            className="hover:bg-muted disabled:opacity-30 rounded p-0.5"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={pos.name}
                        onChange={(e) => onUpdatePosition(idx, 'name', e.target.value)}
                        placeholder="Nazwa towaru / usługi"
                        className="bg-white h-8 text-sm"
                      />
                    </td>
                    {showDiscount && (
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          value={pos.discount ?? 0}
                          onChange={(e) =>
                            onUpdatePosition(
                              idx,
                              'discount',
                              e.target.value === '' ? 0 : Number(e.target.value),
                            )
                          }
                          className="bg-white h-8 text-sm text-right"
                        />
                      </td>
                    )}
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={pos.quantity}
                        onChange={(e) => onUpdatePosition(idx, 'quantity', Number(e.target.value))}
                        className="bg-white h-8 text-sm text-right"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={pos.unit || 'szt.'}
                        onValueChange={(unit) => onUpdatePosition(idx, 'unit', unit)}
                      >
                        <SelectTrigger className="bg-white h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[1100]">
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        defaultValue=""
                        key={`price-${idx}-${pos.unit_price_gross}`}
                        placeholder={pos.unit_price_gross ? fmt(pos.unit_price_gross) : '0,00'}
                        onFocus={(e) => {
                          if (!e.target.value) e.target.value = fmt(pos.unit_price_gross);
                          e.target.select();
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (!val) return;
                          const num = parsePLN(val);
                          if (!isNaN(num)) onUpdatePosition(idx, 'unit_price_gross', num);
                          e.target.value = '';
                        }}
                        className="bg-white h-8 text-sm text-right placeholder:text-foreground"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Select
                        value={String(pos.vat_rate)}
                        onValueChange={(value) => onUpdatePosition(idx, 'vat_rate', Number(value))}
                      >
                        <SelectTrigger className="bg-white h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[1100]">
                          {VAT_OPTIONS.map((vo) => (
                            <SelectItem key={vo.value} value={String(vo.value)}>
                              {vo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        defaultValue=""
                        key={`vnet-${idx}-${pos.unit_price_gross}-${pos.quantity}-${pos.discount}-${pos.vat_rate}-${priceMode}`}
                        placeholder={fmt(v.valueNet)}
                        onFocus={(e) => {
                          if (!e.target.value) e.target.value = fmt(v.valueNet);
                          e.target.select();
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (!val) return;
                          const valueNet = parsePLN(val);
                          if (isNaN(valueNet) || valueNet < 0) return;
                          const qty = Number(pos.quantity) || 1;
                          const disc = Number(pos.discount) || 0;
                          const rate = pos.vat_rate === -1 ? 0 : pos.vat_rate / 100;
                          const unitNetAfterDisc = valueNet / qty;
                          const unitNet = unitNetAfterDisc / (1 - disc / 100);
                          const newPrice = priceMode === 'netto' ? unitNet : unitNet * (1 + rate);
                          onUpdatePosition(idx, 'unit_price_gross', newPrice);
                          e.target.value = '';
                        }}
                        className="bg-white h-8 text-sm text-right placeholder:text-foreground"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        defaultValue=""
                        key={`vgross-${idx}-${pos.unit_price_gross}-${pos.quantity}-${pos.discount}-${pos.vat_rate}-${priceMode}`}
                        placeholder={fmt(v.valueGross)}
                        onFocus={(e) => {
                          if (!e.target.value) e.target.value = fmt(v.valueGross);
                          e.target.select();
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (!val) return;
                          const valueGross = parsePLN(val);
                          if (isNaN(valueGross) || valueGross < 0) return;
                          const qty = Number(pos.quantity) || 1;
                          const disc = Number(pos.discount) || 0;
                          const rate = pos.vat_rate === -1 ? 0 : pos.vat_rate / 100;
                          const valueNet = valueGross / (1 + rate);
                          const unitNetAfterDisc = valueNet / qty;
                          const unitNet = unitNetAfterDisc / (1 - disc / 100);
                          const newPrice = priceMode === 'netto' ? unitNet : unitNet * (1 + rate);
                          onUpdatePosition(idx, 'unit_price_gross', newPrice);
                          e.target.value = '';
                        }}
                        className="bg-white h-8 text-sm text-right font-medium placeholder:text-foreground"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => onRemovePosition(idx)}
                        disabled={positions.length <= 1}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onAddPosition}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Nowa pozycja
          </Button>
        </div>
      </section>

      {/* Sumy */}
      <div className="flex justify-end">
        <div className="w-full md:w-80 space-y-1.5 text-sm">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <span className="font-semibold">Suma netto</span>
            <span className="tabular-nums text-right">{fmt(totalNetto)}</span>
            <span className="text-xs text-muted-foreground">PLN</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <span className="font-semibold">Suma VAT</span>
            <span className="tabular-nums text-right">{fmt(totalVat)}</span>
            <span className="text-xs text-muted-foreground">PLN</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center pt-1 border-t border-border">
            <span className="font-semibold">Suma brutto</span>
            <span className="tabular-nums text-right text-base">{fmt(totalGross)}</span>
            <span className="text-xs text-muted-foreground">PLN</span>
          </div>
        </div>
      </div>

      {/* Płatność */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Płatność</Label>
          <Select value={paymentType} onValueChange={(v) => onPaymentTypeChange(v as PaymentType)}>
            <SelectTrigger className="bg-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {PAYMENT_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <Checkbox
              id="split-payment"
              checked={splitPayment}
              onCheckedChange={(v) => onSplitPaymentChange?.(!!v)}
            />
            <span className="text-xs text-foreground">Mechanizm podzielonej płatności</span>
          </label>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Termin płatności</Label>
          <Select
            value={paymentDays === 'month' ? 'month' : String(paymentDays)}
            onValueChange={(v) => onPaymentDaysChange(v === 'month' ? 'month' : Number(v))}
          >
            <SelectTrigger className="bg-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {PAYMENT_TERM_OPTIONS.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data płatności</Label>
          <Input value={paymentTo} readOnly className="bg-gray-50 h-9 cursor-default" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Kwota opłacona</Label>
          <Input
            type="text"
            inputMode="decimal"
            defaultValue=""
            key={`paid-${paidAmount}`}
            placeholder={fmt(paidAmount)}
            onFocus={(e) => {
              if (!e.target.value) e.target.value = fmt(paidAmount);
              e.target.select();
            }}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (!val) {
                onPaidAmountChange?.(0);
                return;
              }
              const num = parsePLN(val);
              if (!isNaN(num) && num >= 0) onPaidAmountChange?.(num);
              e.target.value = '';
            }}
            className="bg-white h-9 text-right placeholder:text-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Waluta</Label>
          <Select value="PLN" onValueChange={() => undefined}>
            <SelectTrigger className="bg-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1100]">
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="auto-send-email"
          checked={autoSendEmail}
          onCheckedChange={(v) => onAutoSendEmailChange(!!v)}
        />
        <Label htmlFor="auto-send-email" className="text-sm cursor-pointer">
          Wyślij automatycznie na email nabywcy
        </Label>
      </div>
    </div>
  );
}
