// Mapowanie wewnętrznego invoiceData (taki jaki wysyła useInvoiceForm
// z apps/carfect) do typów Fakturowni 1:1 z dokumentacją.
// Wszystkie historyczne pułapki nazewnictwa są łapane TUTAJ:
// - bank_account → seller_bank_account
// - unit → quantity_unit
// - vat_rate -1 → tax: 'disabled'
// - puste defaulty są pomijane (spread warunkowy)

import {
  FakturowniaClientCreate,
  FakturowniaInvoice,
  FakturowniaInvoiceCreate,
  FakturowniaInvoiceKind,
  FakturowniaInvoicePositionCreate,
  FakturowniaInvoiceUpdate,
  FakturowniaPaymentType,
} from './types.ts';

export interface InternalInvoicePosition {
  name: string;
  quantity: number;
  unit_price_gross: number;
  vat_rate: number;
  unit?: string;
  discount?: number;
  /** Fakturownia position id — set when row exists in Fakturownia. */
  external_id?: string;
}

export interface InternalInvoiceData {
  kind?: string;
  number?: string | null;
  issue_date?: string;
  sell_date?: string;
  payment_to?: string;
  payment_type?: string;
  currency?: string;

  buyer_name?: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_city?: string;
  buyer_street?: string;
  buyer_post_code?: string;
  buyer_country?: string;

  place?: string;
  seller_person?: string;
  seller_name?: string;
  seller_tax_no?: string;
  seller_email?: string;
  /** Free-form address. Will be parsed into seller_street/post_code/city when shaped like "ul. X 1, 00-000 City". */
  seller_address?: string;
  bank_account?: string;
  oid?: string | null;

  positions: InternalInvoicePosition[];
}

/**
 * Parses "ul. Nowa 1, 00-001 Warszawa" into { street, postCode, city }.
 * Returns the raw string as `street` (with empty postCode/city) when unparseable.
 */
function parseAddress(address: string): { street: string; postCode: string; city: string } {
  const trimmed = address.trim();
  const match = trimmed.match(/^(.+),\s*(\d{2}-\d{3})\s+(.+)$/);
  if (match) {
    return { street: match[1].trim(), postCode: match[2].trim(), city: match[3].trim() };
  }
  return { street: trimmed, postCode: '', city: '' };
}

function mapPosition(p: InternalInvoicePosition): FakturowniaInvoicePositionCreate {
  const total = Math.round(Number(p.unit_price_gross) * Number(p.quantity) * 100) / 100;

  const pos: FakturowniaInvoicePositionCreate = {
    name: p.name,
    quantity: Number(p.quantity),
    quantity_unit: p.unit?.trim() || 'szt.',
    tax: p.vat_rate === -1 ? 'disabled' : String(p.vat_rate),
    total_price_gross: total,
  };

  if (p.discount && p.discount > 0) {
    pos.discount_percent = Number(p.discount);
  }

  return pos;
}

export function mapInternalInvoiceToFakturownia(
  data: InternalInvoiceData,
  options: { clientId?: number } = {},
): FakturowniaInvoiceCreate {
  const out: FakturowniaInvoiceCreate = {
    kind: (data.kind as FakturowniaInvoiceKind) || 'vat',
    positions: data.positions.map(mapPosition),
  };

  if (data.issue_date) out.issue_date = data.issue_date;
  if (data.sell_date) out.sell_date = data.sell_date;
  if (data.payment_to) out.payment_to = data.payment_to;
  if (data.payment_type) out.payment_type = data.payment_type as FakturowniaPaymentType;
  if (data.currency) out.currency = data.currency;
  if (data.place) out.place = data.place;
  if (data.seller_person) out.seller_person = data.seller_person;
  // Don't send seller_name / seller_tax_no / seller_address / seller_bank_account.
  // Fakturownia's Department is identified by the (name, address, NIP, bank) tuple;
  // if anything we send doesn't EXACTLY match an existing Department, Fakturownia
  // tries to auto-create a new one and the security level blocks that with
  // "Poziom zabezpieczenia przed zmianą konta bankowego nie pozwala na utworzenie działu".
  // Let Fakturownia use the default Department configured in their settings.

  if (data.oid) {
    out.oid = data.oid;
    out.oid_unique = 'yes';
  }

  if (data.buyer_name) out.buyer_name = data.buyer_name;
  if (data.buyer_tax_no) out.buyer_tax_no = data.buyer_tax_no;
  if (data.buyer_email) out.buyer_email = data.buyer_email;
  if (data.buyer_city) out.buyer_city = data.buyer_city;
  if (data.buyer_street) out.buyer_street = data.buyer_street;
  if (data.buyer_post_code) out.buyer_post_code = data.buyer_post_code;
  if (data.buyer_country) out.buyer_country = data.buyer_country;

  if (options.clientId !== undefined) {
    out.client_id = options.clientId;
  }

  if (data.positions.some((p) => p.discount && p.discount > 0)) {
    out.show_discount = '1';
    out.discount_kind = 'percent_unit';
  }

  return out;
}

/** Z naszego buyer_* tworzy payload do `clients.create` jeśli klienta nie ma w Fakturowni. */
export function mapBuyerToClient(data: InternalInvoiceData): FakturowniaClientCreate | null {
  if (!data.buyer_name) return null;

  const out: FakturowniaClientCreate = {
    name: data.buyer_name,
    kind: 'buyer',
    company: data.buyer_tax_no ? '1' : '0',
  };

  if (data.buyer_tax_no) out.tax_no = data.buyer_tax_no;
  if (data.buyer_email) out.email = data.buyer_email;
  if (data.buyer_city) out.city = data.buyer_city;
  if (data.buyer_street) out.street = data.buyer_street;
  if (data.buyer_post_code) out.post_code = data.buyer_post_code;
  if (data.buyer_country) out.country = data.buyer_country;

  return out;
}

// ---- UPDATE mapper (with position diff: keep / add / destroy) ----

type FakturowniaPositionForUpdate =
  | (FakturowniaInvoicePositionCreate & { id?: number | string })
  | { id: number | string; _destroy: 1 };

/**
 * Maps internal invoice data to a Fakturownia update payload.
 * Position semantics:
 *  - existing position (has external_id) → `{ id, ...mapped fields }` (edit in place)
 *  - new position (no external_id) → `{ ...mapped fields }` (added)
 *  - position present in `originalPositions` but missing from `data.positions`
 *    → `{ id, _destroy: 1 }` (removed)
 */
export function mapInternalInvoiceToFakturowniaUpdate(
  data: InternalInvoiceData,
  originalPositions: InternalInvoicePosition[],
): FakturowniaInvoiceUpdate {
  const out: FakturowniaInvoiceUpdate = {};

  if (data.payment_to) out.payment_to = data.payment_to;
  if (data.payment_type) out.payment_type = data.payment_type as FakturowniaPaymentType;
  if (data.place) out.place = data.place;
  if (data.buyer_name) out.buyer_name = data.buyer_name;
  if (data.buyer_tax_no) out.buyer_tax_no = data.buyer_tax_no;
  if (data.buyer_email) out.buyer_email = data.buyer_email;
  if (data.buyer_city) out.buyer_city = data.buyer_city;
  if (data.buyer_street) out.buyer_street = data.buyer_street;
  if (data.buyer_post_code) out.buyer_post_code = data.buyer_post_code;
  if (data.buyer_country) out.buyer_country = data.buyer_country;

  const currentExternalIds = new Set(
    data.positions.filter((p) => p.external_id).map((p) => String(p.external_id)),
  );

  const positions: FakturowniaPositionForUpdate[] = data.positions.map((p) => {
    const total = Math.round(Number(p.unit_price_gross) * Number(p.quantity) * 100) / 100;
    const base: FakturowniaInvoicePositionCreate = {
      name: p.name,
      quantity: Number(p.quantity),
      quantity_unit: p.unit?.trim() || 'szt.',
      tax: p.vat_rate === -1 ? 'disabled' : String(p.vat_rate),
      total_price_gross: total,
    };
    if (p.discount && p.discount > 0) base.discount_percent = Number(p.discount);
    return p.external_id ? { id: p.external_id, ...base } : base;
  });

  for (const orig of originalPositions) {
    if (!orig.external_id) continue;
    if (!currentExternalIds.has(String(orig.external_id))) {
      positions.push({ id: orig.external_id, _destroy: 1 });
    }
  }

  out.positions = positions as FakturowniaInvoicePositionCreate[];

  // Fakturownia ignores discount_percent on a position unless show_discount is enabled at invoice level.
  if (data.positions.some((p) => p.discount && p.discount > 0)) {
    out.show_discount = '1';
    out.discount_kind = 'percent_unit';
  }

  return out;
}

// ---- REVERSE mapper (Fakturownia → internal) ----

export interface InternalInvoiceFromFakturownia extends InternalInvoiceData {
  positions: (InternalInvoicePosition & { external_id: string })[];
  external_invoice_id: string;
  invoice_number: string;
  ksef: {
    status: string | null;
    govId: string | null;
    sendDate: string | null;
    errorMessages: string[];
    verificationLink: string | null;
  };
}

/** Maps a Fakturownia invoice (read response) to our internal invoice shape. */
export function mapFakturowniaToInternal(fv: FakturowniaInvoice): InternalInvoiceFromFakturownia {
  const f = fv as Record<string, unknown> & FakturowniaInvoice;
  const positions = (fv.positions || []).map((p) => {
    const raw = p as Record<string, unknown>;
    const taxValue = String(raw.tax ?? p.tax ?? '23');
    const vatRate =
      taxValue === 'zw' || taxValue === 'np' || taxValue === 'oo' || taxValue === 'disabled'
        ? -1
        : Number(taxValue);
    return {
      external_id: String(raw.id ?? ''),
      name: String(p.name),
      quantity: Number(p.quantity),
      unit_price_gross: Number(raw.price_gross ?? p.price_gross ?? 0),
      vat_rate: Number.isFinite(vatRate) ? vatRate : 23,
      unit: typeof p.quantity_unit === 'string' ? p.quantity_unit : 'szt.',
      discount: Number(raw.discount_percent ?? p.discount_percent ?? 0) || 0,
    };
  });

  return {
    kind: fv.kind,
    issue_date: fv.issue_date,
    sell_date: fv.sell_date,
    payment_to: fv.payment_to,
    payment_type: fv.payment_type,
    currency: fv.currency,
    place: fv.place,
    buyer_name: fv.buyer_name,
    buyer_tax_no: fv.buyer_tax_no,
    buyer_email: fv.buyer_email,
    buyer_city: fv.buyer_city,
    buyer_street: fv.buyer_street,
    buyer_post_code: fv.buyer_post_code,
    buyer_country: fv.buyer_country,
    positions,
    external_invoice_id: String(fv.id),
    invoice_number: fv.number,
    ksef: {
      status: (f.gov_status as string) ?? null,
      govId: (f.gov_id as string) ?? null,
      sendDate: (f.gov_send_date as string) ?? null,
      errorMessages: Array.isArray(f.gov_error_messages) ? (f.gov_error_messages as string[]) : [],
      verificationLink: (f.gov_verification_link as string) ?? null,
    },
  };
}
