// Frontend mirror of the reverse mapper from
// supabase/functions/_shared/fakturownia/mappers.ts.
// Lives here because Vite can't resolve Deno paths.
// Source of truth is the Deno copy; keep these two in sync.
//
// Used by useInvoiceForm in edit mode to convert Fakturownia API responses
// into our internal invoice shape.

import type { InvoicePosition, PaymentType, DocumentKind } from './invoicing.types';

/** Stripped subset of the FakturowniaInvoice response we actually consume. */
export interface FakturowniaInvoiceResponse {
  id: number | string;
  number: string;
  kind?: string;
  issue_date?: string;
  sell_date?: string;
  payment_to?: string;
  payment_type?: string;
  currency?: string;
  place?: string;
  buyer_name?: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_post_code?: string;
  buyer_city?: string;
  buyer_street?: string;
  buyer_country?: string;
  seller_name?: string;
  seller_tax_no?: string;
  seller_email?: string;
  seller_post_code?: string;
  seller_city?: string;
  seller_street?: string;
  seller_country?: string;
  paid?: number | string;
  positions?: Array<{
    id?: number | string;
    name: string;
    quantity: number | string;
    quantity_unit?: string;
    tax?: string;
    price_gross?: number | string;
    discount_percent?: number | string;
  }>;
  // KSeF
  gov_status?: string;
  gov_id?: string;
  gov_send_date?: string;
  gov_error_messages?: string[];
  gov_verification_link?: string;
}

export interface InvoicePositionFromApi extends InvoicePosition {
  /** Fakturownia position id — used to mark this row as "existing" for updates. */
  external_id: string;
}

export interface KsefStatusInfo {
  status: string | null;
  govId: string | null;
  sendDate: string | null;
  errorMessages: string[];
  verificationLink: string | null;
}

export interface InternalInvoiceFromFakturownia {
  externalInvoiceId: string;
  invoiceNumber: string;
  kind: DocumentKind;
  issueDate: string;
  sellDate: string;
  paymentTo: string;
  paymentType: PaymentType;
  currency: string;
  place: string;
  buyerName: string;
  buyerTaxNo: string;
  buyerEmail: string;
  buyerPostCode: string;
  buyerCity: string;
  buyerStreet: string;
  buyerCountry: string;
  sellerName: string;
  sellerTaxNo: string;
  sellerEmail: string;
  sellerAddress: string;
  paidAmount: number;
  positions: InvoicePositionFromApi[];
  ksef: KsefStatusInfo;
}

const TAX_TEXTUALS: ReadonlySet<string> = new Set(['zw', 'np', 'oo', 'disabled']);

function parseTax(rawTax: string | undefined): number {
  const t = String(rawTax ?? '23');
  if (TAX_TEXTUALS.has(t)) return -1;
  const n = Number(t);
  return Number.isFinite(n) ? n : 23;
}

function isDocumentKind(value: string | undefined): value is DocumentKind {
  return value === 'vat' || value === 'proforma' || value === 'receipt';
}

function isPaymentType(value: string | undefined): value is PaymentType {
  return value === 'transfer' || value === 'cod' || value === 'card' || value === 'cash';
}

export function mapFakturowniaToInternal(
  fv: FakturowniaInvoiceResponse,
): InternalInvoiceFromFakturownia {
  const positions: InvoicePositionFromApi[] = (fv.positions ?? []).map((p) => {
    const vatRate = parseTax(p.tax);
    const priceGross = Number(p.price_gross) || 0;
    // Convert Fakturownia's price_gross back to net so the form's default
    // priceMode='netto' interprets the stored unit_price_gross correctly.
    // Without this, every save round-trip would multiply the price by (1 + VAT).
    const rate = vatRate === -1 ? 0 : vatRate / 100;
    const priceNet = rate > 0 ? priceGross / (1 + rate) : priceGross;
    return {
      external_id: String(p.id ?? ''),
      name: p.name,
      quantity: Number(p.quantity) || 0,
      unit_price_gross: priceNet,
      vat_rate: vatRate,
      unit:
        typeof p.quantity_unit === 'string' && p.quantity_unit.length > 0
          ? p.quantity_unit
          : 'szt.',
      discount: Number(p.discount_percent) || 0,
    };
  });

  return {
    externalInvoiceId: String(fv.id),
    invoiceNumber: fv.number,
    kind: isDocumentKind(fv.kind) ? fv.kind : 'vat',
    issueDate: fv.issue_date ?? '',
    sellDate: fv.sell_date ?? '',
    paymentTo: fv.payment_to ?? '',
    paymentType: isPaymentType(fv.payment_type) ? fv.payment_type : 'transfer',
    currency: fv.currency ?? 'PLN',
    place: fv.place ?? '',
    buyerName: fv.buyer_name ?? '',
    buyerTaxNo: fv.buyer_tax_no ?? '',
    buyerEmail: fv.buyer_email ?? '',
    buyerPostCode: fv.buyer_post_code ?? '',
    buyerCity: fv.buyer_city ?? '',
    buyerStreet: fv.buyer_street ?? '',
    buyerCountry: fv.buyer_country ?? 'PL',
    sellerName: fv.seller_name ?? '',
    sellerTaxNo: fv.seller_tax_no ?? '',
    sellerEmail: fv.seller_email ?? '',
    sellerAddress: [fv.seller_street, fv.seller_post_code, fv.seller_city]
      .filter(Boolean)
      .join(' ')
      .trim()
      .replace(/^(.+) (\d{2}-\d{3}) (.+)$/, '$1, $2 $3'),
    paidAmount: Number(fv.paid) || 0,
    positions,
    ksef: {
      status: fv.gov_status ?? null,
      govId: fv.gov_id ?? null,
      sendDate: fv.gov_send_date ?? null,
      errorMessages: Array.isArray(fv.gov_error_messages) ? fv.gov_error_messages : [],
      verificationLink: fv.gov_verification_link ?? null,
    },
  };
}
