import { useState } from 'react';
import { Trash2, Search, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Checkbox } from '@shared/ui';
import { toast } from 'sonner';
import {
  DOCUMENT_KINDS,
  PAYMENT_TYPES,
  type InvoicePosition,
  type DocumentKind,
  type PaymentType,
} from './invoicing.types';

type PriceMode = 'netto' | 'brutto';

interface InvoiceFormProps {
  kind: DocumentKind;
  onKindChange: (v: DocumentKind) => void;
  issueDate: string;
  onIssueDateChange: (v: string) => void;
  sellDate: string;
  onSellDateChange: (v: string) => void;
  paymentDays: number;
  onPaymentDaysChange: (v: number) => void;
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
  positions: InvoicePosition[];
  onAddPosition: () => void;
  onRemovePosition: (idx: number) => void;
  onUpdatePosition: (idx: number, field: keyof InvoicePosition, value: any) => void;
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
  positions,
  onAddPosition,
  onRemovePosition,
  onUpdatePosition,
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
  const priceLabel = priceMode === 'netto' ? 'Cena netto' : 'Cena brutto';

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

  return (
    <div className="space-y-5">
      {settingsActive === false && (
        <p className="text-sm text-destructive">
          Skonfiguruj integracje fakturowania w Ustawieniach → Integracje
        </p>
      )}

      {/* Document type & dates */}
      <div className="space-y-1.5">
        <Label className="text-xs">Typ dokumentu</Label>
        <Select value={kind} onValueChange={(v) => onKindChange(v as DocumentKind)}>
          <SelectTrigger className="bg-white h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_KINDS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Data wystawienia</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
            className="bg-white h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data sprzedazy</Label>
          <Input
            type="date"
            value={sellDate}
            onChange={(e) => onSellDateChange(e.target.value)}
            className="bg-white h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Termin (dni)</Label>
          <Input
            type="number"
            min={1}
            value={paymentDays}
            onChange={(e) => onPaymentDaysChange(Number(e.target.value))}
            className="bg-white h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Metoda platnosci</Label>
          <Select value={paymentType} onValueChange={(v) => onPaymentTypeChange(v as PaymentType)}>
            <SelectTrigger className="bg-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>
                  {pt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {bankAccounts.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs">Konto bankowe</Label>
          <Select value={selectedBankAccount} onValueChange={(v) => onBankAccountChange?.(v)}>
            <SelectTrigger className="bg-white h-9">
              <SelectValue placeholder="Wybierz konto" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((acc) => (
                <SelectItem key={acc.number} value={acc.number}>
                  {acc.name ? `${acc.name} — ${acc.number}` : acc.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* Buyer */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Nabywca</h3>
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">NIP</Label>
              <Input
                value={buyerTaxNo}
                onChange={(e) => onBuyerTaxNoChange(e.target.value)}
                placeholder="0000000000"
                className="bg-white h-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleNipLookup}
              disabled={nipLoading}
            >
              {nipLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-1" />
              )}
              {nipLoading ? '...' : 'GUS'}
            </Button>
          </div>
          <Input
            value={buyerName}
            onChange={(e) => onBuyerNameChange(e.target.value)}
            placeholder="Nazwa nabywcy *"
            className="bg-white h-9"
          />
          <Input
            value={buyerEmail}
            onChange={(e) => onBuyerEmailChange(e.target.value)}
            placeholder="Email"
            className="bg-white h-9"
          />
          <Input
            value={buyerStreet}
            onChange={(e) => onBuyerStreetChange(e.target.value)}
            placeholder="Ulica"
            className="bg-white h-9"
          />
          <div className="grid grid-cols-4 gap-2">
            <Input
              value={buyerPostCode}
              onChange={(e) => onBuyerPostCodeChange(e.target.value)}
              placeholder="Kod pocztowy"
              className="bg-white h-9"
            />
            <Input
              value={buyerCity}
              onChange={(e) => onBuyerCityChange(e.target.value)}
              placeholder="Miasto"
              className="bg-white h-9 col-span-2"
            />
            <Input
              value={buyerCountry}
              onChange={(e) => onBuyerCountryChange(e.target.value)}
              placeholder="Kraj"
              className="bg-white h-9"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Positions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Pozycje</h3>
        {positions.map((pos, idx) => (
          <div key={idx} className="space-y-2 p-3 rounded-lg border border-border bg-white">
            <div className="flex items-center gap-2">
              <Input
                value={pos.name}
                onChange={(e) => onUpdatePosition(idx, 'name', e.target.value)}
                placeholder="Nazwa uslugi / produktu"
                className="bg-white h-8 text-sm flex-1"
              />
              {positions.length > 1 && (
                <button
                  onClick={() => onRemovePosition(idx)}
                  className="p-1 rounded hover:bg-primary/5"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="space-y-1 w-14 shrink-0">
                  <Label className="text-[10px] text-muted-foreground">Ilość</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pos.quantity}
                    onChange={(e) => onUpdatePosition(idx, 'quantity', Number(e.target.value))}
                    className="bg-white h-8 text-sm"
                  />
                </div>
                <div className="space-y-1 w-20 shrink-0">
                  <Label className="text-[10px] text-muted-foreground">Jednostka</Label>
                  <Select
                    value={
                      pos.unit === 'meter' || pos.unit === 'm2' || pos.unit === 'm²' ? 'm2' : 'szt.'
                    }
                    onValueChange={(v) => onUpdatePosition(idx, 'unit', v)}
                  >
                    <SelectTrigger className="bg-white h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="szt.">szt.</SelectItem>
                      <SelectItem value="m2">m2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] text-muted-foreground">{priceLabel}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={pos.unit_price_gross}
                    onChange={(e) =>
                      onUpdatePosition(idx, 'unit_price_gross', Number(e.target.value))
                    }
                    className="bg-white h-8 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Wartość całkowita netto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue=""
                    key={`total-${idx}-${pos.unit_price_gross}-${pos.quantity}-${pos.discount}`}
                    placeholder={(pos.unit_price_gross * pos.quantity * (1 - (pos.discount ?? 0) / 100)).toFixed(2)}
                    onFocus={(e) => {
                      if (!e.target.value) e.target.value = (pos.unit_price_gross * pos.quantity * (1 - (pos.discount ?? 0) / 100)).toFixed(2);
                      e.target.select();
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (!val) return;
                      const total = Number(val);
                      if (isNaN(total) || total < 0) return;
                      const discountFactor = 1 - (pos.discount ?? 0) / 100;
                      const unitPrice = pos.quantity > 0 ? total / pos.quantity / (discountFactor || 1) : 0;
                      onUpdatePosition(idx, 'unit_price_gross', parseFloat(unitPrice.toFixed(6)));
                      e.target.value = '';
                    }}
                    className="bg-white h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Rabat %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="1"
                    value={pos.discount || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdatePosition(idx, 'discount', val === '' ? 0 : Number(val));
                    }}
                    placeholder="0"
                    className="bg-white h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Summary */}
      <div className="bg-white rounded-lg border border-border p-4 space-y-2">
        <div className="flex justify-between text-xs text-foreground">
          <span>Razem netto</span>
          <span>{totalNetto.toFixed(2)} PLN</span>
        </div>
        <div className="flex justify-between text-xs text-foreground">
          <span>VAT</span>
          <span>{totalVat.toFixed(2)} PLN</span>
        </div>
        <Separator />
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-foreground">Razem brutto</span>
          <span className="text-lg font-bold text-foreground">{totalGross.toFixed(2)} PLN</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-foreground">Termin platnosci</span>
          <span className="text-foreground">{paymentTo}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="auto-send-email"
            checked={autoSendEmail}
            onCheckedChange={(v) => onAutoSendEmailChange(!!v)}
          />
          <Label htmlFor="auto-send-email" className="text-xs text-muted-foreground cursor-pointer">
            Wyslij automatycznie na email nabywcy
          </Label>
        </div>
      </div>
    </div>
  );
}
