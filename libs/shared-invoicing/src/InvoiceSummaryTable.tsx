import { amountToWords } from '@shared/utils';

export interface SummaryLine {
  name: string;
  unit?: string;
  quantity: number;
  /** Cena jednostkowa netto */
  pricePerUnitNet: number;
  /** Rabat procentowy (0-100) */
  discountPercent?: number;
  /** Stawka VAT w procentach (-1 = "zw") */
  vatRate: number;
}

interface ExtraLine {
  label: string;
  netValue: number;
  vatRate: number;
}

interface InvoiceSummaryTableProps {
  lines: SummaryLine[];
  /** Dodatkowe linie wyświetlane jako kolejne pozycje (np. wysyłka, dostawa) */
  extraLines?: ExtraLine[];
  currency?: string;
  /** Nadpisanie podsumowania "Do zapłaty" (np. "GRATIS"). Domyślnie wyświetla kwotę brutto. */
  toPayLabel?: string;
  /** Wyświetlać linię "Słownie:" (default true) */
  showAmountInWords?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const vatLabel = (rate: number) => (rate === -1 ? 'zw' : String(rate));

interface ComputedRow {
  index: number;
  name: string;
  unit?: string;
  quantity: number;
  discountPercent: number;
  pricePerUnitNet: number;
  pricePerUnitNetAfterDiscount: number;
  valueNet: number;
  vatRate: number;
  valueVat: number;
  valueGross: number;
}

function computeRows(lines: SummaryLine[]): ComputedRow[] {
  return lines.map((l, idx) => {
    const discountPercent = Number(l.discountPercent ?? 0);
    const pricePerUnitNetAfterDiscount = l.pricePerUnitNet * (1 - discountPercent / 100);
    const valueNet = pricePerUnitNetAfterDiscount * l.quantity;
    const rate = l.vatRate === -1 ? 0 : l.vatRate / 100;
    const valueVat = valueNet * rate;
    const valueGross = valueNet + valueVat;
    return {
      index: idx + 1,
      name: l.name,
      unit: l.unit,
      quantity: l.quantity,
      discountPercent,
      pricePerUnitNet: l.pricePerUnitNet,
      pricePerUnitNetAfterDiscount,
      valueNet,
      vatRate: l.vatRate,
      valueVat,
      valueGross,
    };
  });
}

interface VatGroup {
  rate: number;
  net: number;
  vat: number;
  gross: number;
}

function groupByVat(rows: ComputedRow[], extras: ExtraLine[] = []): VatGroup[] {
  const map = new Map<number, VatGroup>();
  const add = (rate: number, net: number, vat: number, gross: number) => {
    const existing = map.get(rate);
    if (existing) {
      existing.net += net;
      existing.vat += vat;
      existing.gross += gross;
    } else {
      map.set(rate, { rate, net, vat, gross });
    }
  };
  for (const r of rows) add(r.vatRate, r.valueNet, r.valueVat, r.valueGross);
  for (const e of extras) {
    const rate = e.vatRate === -1 ? 0 : e.vatRate / 100;
    const vat = e.netValue * rate;
    add(e.vatRate, e.netValue, vat, e.netValue + vat);
  }
  return Array.from(map.values()).sort((a, b) => b.rate - a.rate);
}

export function InvoiceSummaryTable({
  lines,
  extraLines = [],
  currency = 'PLN',
  toPayLabel,
  showAmountInWords = true,
}: InvoiceSummaryTableProps) {
  const rows = computeRows(lines);
  const vatGroups = groupByVat(rows, extraLines);

  const totalNet =
    rows.reduce((s, r) => s + r.valueNet, 0) + extraLines.reduce((s, e) => s + e.netValue, 0);
  const totalVat = vatGroups.reduce((s, g) => s + g.vat, 0);
  const totalGross = totalNet + totalVat;

  const showDiscountColumn = rows.some((r) => r.discountPercent > 0);

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="text-xs">
            <tr className="bg-muted/50">
              <th className="text-left px-2 py-2 font-semibold w-10 border border-border">LP</th>
              <th className="text-left px-2 py-2 font-semibold border border-border">
                Nazwa towaru / usługi
              </th>
              {showDiscountColumn && (
                <th className="text-right px-2 py-2 font-semibold w-16 border border-border">
                  Rabat
                </th>
              )}
              <th className="text-right px-2 py-2 font-semibold w-28 border border-border">
                Ilość (j.m.)
              </th>
              <th className="text-right px-2 py-2 font-semibold w-24 border border-border">
                Cena netto
              </th>
              {showDiscountColumn && (
                <th className="text-right px-2 py-2 font-semibold w-32 border border-border">
                  Cena netto po rabacie
                </th>
              )}
              <th className="text-right px-2 py-2 font-semibold w-28 border border-border">
                Wartość netto
              </th>
              <th className="text-right px-2 py-2 font-semibold w-16 border border-border">
                VAT %
              </th>
              <th className="text-right px-2 py-2 font-semibold w-28 border border-border">
                Wartość VAT
              </th>
              <th className="text-right px-2 py-2 font-semibold w-28 border border-border">
                Wartość brutto
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.index} className="border border-border">
                <td className="text-center px-2 py-2 border border-border">{r.index}</td>
                <td className="px-2 py-2 border border-border">{r.name}</td>
                {showDiscountColumn && (
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {r.discountPercent > 0 ? `${fmt(r.discountPercent)}%` : ''}
                  </td>
                )}
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {fmt(r.quantity)} ({r.unit || 'brak'})
                </td>
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {fmt(r.pricePerUnitNet)}
                </td>
                {showDiscountColumn && (
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {fmt(r.pricePerUnitNetAfterDiscount)}
                  </td>
                )}
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {fmt(r.valueNet)}
                </td>
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {vatLabel(r.vatRate)}
                </td>
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {fmt(r.valueVat)}
                </td>
                <td className="text-right px-2 py-2 tabular-nums border border-border">
                  {fmt(r.valueGross)}
                </td>
              </tr>
            ))}
            {extraLines.map((e, idx) => {
              const rate = e.vatRate === -1 ? 0 : e.vatRate / 100;
              const vat = e.netValue * rate;
              const gross = e.netValue + vat;
              return (
                <tr key={`extra-${idx}`} className="border border-border">
                  <td className="text-center px-2 py-2 border border-border">
                    {rows.length + idx + 1}
                  </td>
                  <td className="px-2 py-2 border border-border">{e.label}</td>
                  {showDiscountColumn && <td className="border border-border" />}
                  <td className="border border-border" />
                  <td className="border border-border" />
                  {showDiscountColumn && <td className="border border-border" />}
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {fmt(e.netValue)}
                  </td>
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {vatLabel(e.vatRate)}
                  </td>
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {fmt(vat)}
                  </td>
                  <td className="text-right px-2 py-2 tabular-nums border border-border">
                    {fmt(gross)}
                  </td>
                </tr>
              );
            })}

            {/* Razem — "Razem {netto}" merged into Wartość netto cell */}
            <tr>
              <td className="border border-border" />
              <td className="border border-border" />
              {showDiscountColumn && <td className="border border-border" />}
              <td className="border border-border" />
              <td className="border border-border" />
              {showDiscountColumn && <td className="border border-border" />}
              <td className="text-right px-2 py-2 font-bold border border-border">
                <span className="mr-2">Razem</span>
                <span className="tabular-nums">{fmt(totalNet)}</span>
              </td>
              <td className="border border-border" />
              <td className="text-right px-2 py-2 font-bold tabular-nums border border-border">
                {fmt(totalVat)}
              </td>
              <td className="text-right px-2 py-2 font-bold tabular-nums border border-border">
                {fmt(totalGross)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sumy po prawej */}
      <div className="flex justify-end">
        <div className="w-full md:w-96 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold">Wartość netto</span>
            <span className="tabular-nums">
              {fmt(totalNet)} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Wartość VAT</span>
            <span className="tabular-nums">
              {fmt(totalVat)} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Wartość brutto</span>
            <span className="tabular-nums">
              {fmt(totalGross)} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Do zapłaty + słownie */}
      <div className="border-t border-border pt-4">
        <div className="grid grid-cols-[auto_1fr] gap-x-6 text-sm">
          <span className="font-bold">Do zapłaty</span>
          <span className="tabular-nums font-semibold">
            {toPayLabel ?? `${fmt(totalGross)} ${currency}`}
          </span>
          {showAmountInWords && !toPayLabel && (
            <>
              <span />
              <span className="text-muted-foreground">
                Słownie: {amountToWords(totalGross, currency)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
