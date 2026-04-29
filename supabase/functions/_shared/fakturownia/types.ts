// Fakturownia API types — 1:1 z dokumentacją https://github.com/fakturownia/api
// Source of truth dla nazw pól. Nie używać tych typów w UI — UI ma swoje typy w
// libs/shared-invoicing/src/invoicing.types.ts. Mapowanie odbywa się w mappers.ts.

export type FakturowniaInvoiceKind =
  | 'vat'
  | 'proforma'
  | 'bill'
  | 'receipt'
  | 'advance'
  | 'correction'
  | 'vat_mp'
  | 'invoice_other'
  | 'vat_margin'
  | 'kp'
  | 'kw'
  | 'final'
  | 'estimate';

export type FakturowniaTax =
  | string // '23', '8', '5', '0' itd.
  | 'zw' // zwolnione
  | 'np' // nie podlega
  | 'oo' // odwrotne obciążenie
  | 'disabled'; // nie wyświetlaj VAT

export type FakturowniaPaymentType = 'transfer' | 'card' | 'cash' | 'cod' | string;

export interface FakturowniaInvoicePositionCreate {
  name: string;
  quantity: number;
  quantity_unit?: string;
  tax: FakturowniaTax;
  // Jedno z poniższych wystarczy (reszta wyliczona po stronie Fakturowni):
  price_net?: number | string;
  price_gross?: number | string;
  total_price_net?: number | string;
  total_price_gross?: number | string;
  discount_percent?: number | string;
  discount?: number | string;
  description?: string;
  code?: string;
  gtu_code?: string;
  additional_info?: string;
  // Tylko dla pozycji w fakturze korygującej:
  kind?: 'correction';
}

export interface FakturowniaInvoiceCreate {
  kind?: FakturowniaInvoiceKind;
  income?: '0' | '1';
  issue_date?: string;
  sell_date?: string;
  payment_to?: string;
  payment_to_kind?: string | number;
  payment_type?: FakturowniaPaymentType;
  place?: string;
  currency?: string;
  lang?: string;
  oid?: string;
  oid_unique?: 'yes';
  status?: string;

  department_id?: string | number;

  seller_name?: string;
  seller_tax_no?: string;
  seller_email?: string;
  seller_post_code?: string;
  seller_city?: string;
  seller_street?: string;
  seller_country?: string;
  seller_bank_account?: string;
  seller_bank?: string;
  seller_person?: string;

  client_id?: number;
  buyer_name?: string;
  buyer_tax_no?: string;
  buyer_tax_no_kind?: string;
  buyer_email?: string;
  buyer_post_code?: string;
  buyer_city?: string;
  buyer_street?: string;
  buyer_country?: string;
  buyer_company?: '0' | '1';
  buyer_person?: string;
  buyer_first_name?: string;
  buyer_last_name?: string;

  show_discount?: '0' | '1';
  discount_kind?: 'percent_unit' | 'amount';
  description?: string;
  description_footer?: string;
  description_long?: string;
  internal_note?: string;
  split_payment?: '0' | '1';
  use_oss?: '0' | '1';

  // Korekty:
  from_invoice_id?: string | number;
  invoice_id?: string | number;
  correction_reason?: string;

  positions: FakturowniaInvoicePositionCreate[];
}

export interface FakturowniaInvoice extends FakturowniaInvoiceCreate {
  id: number;
  number: string;
  view_url: string;
  token?: string;
  created_at: string;
  updated_at: string;
}

export interface FakturowniaInvoiceUpdate {
  buyer_name?: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_post_code?: string;
  buyer_city?: string;
  buyer_street?: string;
  buyer_country?: string;
  payment_to?: string;
  payment_type?: FakturowniaPaymentType;
  place?: string;
  description?: string;
  internal_note?: string;
  show_discount?: '0' | '1';
  discount_kind?: 'percent_unit' | 'amount';
  positions?: FakturowniaInvoicePositionCreate[];
}

export interface FakturowniaCancelInvoicePayload {
  cancel_invoice_id: number;
  cancel_reason?: string;
}

export interface FakturowniaClientCreate {
  name: string;
  shortcut?: string;
  tax_no?: string;
  tax_no_kind?: string;
  register_number?: string;
  post_code?: string;
  city?: string;
  street?: string;
  country?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  www?: string;
  note?: string;
  company?: '0' | '1';
  kind?: 'buyer' | 'seller' | 'both';
  bank?: string;
  bank_account?: string;
  external_id?: string;
}

export interface FakturowniaClient extends FakturowniaClientCreate {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FakturowniaClientSearch {
  name?: string;
  email?: string;
  shortcut?: string;
  tax_no?: string;
  external_id?: string;
  page?: number;
}

export interface FakturowniaProductCreate {
  name: string;
  code?: string;
  ean_code?: string;
  description?: string;
  price_net?: number | string;
  price_gross?: number | string;
  tax?: FakturowniaTax;
  currency?: string;
  category_id?: string | number;
  tag_list?: string[];
  service?: '0' | '1';
  electronic_service?: '0' | '1';
  gtu_codes?: string[];
  limited?: '0' | '1';
  stock_level?: number | string;
  purchase_price_net?: number | string;
  purchase_tax?: FakturowniaTax;
  purchase_price_gross?: number | string;
  package?: '0' | '1';
  quantity_unit?: string;
  quantity?: number | string;
  additional_info?: string;
  supplier_code?: string;
  accounting_id?: string;
  disabled?: '0' | '1';
  use_moss?: '0' | '1';
  size?: string;
  weight?: string;
}

export interface FakturowniaProduct extends FakturowniaProductCreate {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FakturowniaWebhookCreate {
  url: string;
  kind: string; // 'invoice:create' | 'invoice:update' | 'invoice:paid' | 'invoice:delete' | itp.
  enabled: boolean;
}

export interface FakturowniaWebhook extends FakturowniaWebhookCreate {
  id: number;
}

export class FakturowniaApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly endpoint: string,
  ) {
    super(`Fakturownia API error ${status} (${endpoint}): ${body}`);
    this.name = 'FakturowniaApiError';
  }
}
