export async function ifirmaHmac(hexKey: string, message: string): Promise<string> {
  if (!hexKey || !/^[0-9A-Fa-f]+$/.test(hexKey)) {
    throw new Error('IFIRMA_API_KEY is not valid hex');
  }
  const matches = hexKey.match(/.{1,2}/g)!;
  const keyData = new Uint8Array(matches.map((b) => parseInt(b, 16)));
  const msgData = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface IfirmaConfig {
  invoice_api_user: string;
  invoice_api_key: string;
}

export interface IfirmaInvoiceData {
  issue_date: string;
  sell_date: string;
  payment_to: string;
  payment_type?: string;
  buyer_name: string;
  buyer_tax_no?: string;
  buyer_email?: string;
  buyer_street?: string;
  buyer_post_code?: string;
  buyer_city?: string;
  buyer_country?: string;
  place?: string;
  seller_person?: string;
  positions: Array<{
    name: string;
    quantity: number;
    unit_price_net: number;
    vat_rate: number;
    unit?: string;
  }>;
}

export interface IfirmaInvoiceResult {
  external_invoice_id: string;
  invoice_number: string | null;
}

export async function ifirmaCreateInvoice(
  config: IfirmaConfig,
  invoiceData: IfirmaInvoiceData,
): Promise<IfirmaInvoiceResult> {
  const url = 'https://www.ifirma.pl/iapi/fakturakraj.json';

  const positions = invoiceData.positions.map((p) => ({
    StawkaVat: p.vat_rate / 100,
    Ilosc: p.quantity,
    CenaJednostkowa: p.unit_price_net,
    NazwaPelna: p.name,
    Jednostka: p.unit || 'szt',
    TypStawkiVat: 'PRC',
    RodzajCeny: 'NET',
  }));

  const kontrahent: Record<string, string> = {
    Nazwa: invoiceData.buyer_name,
    KodPocztowy: invoiceData.buyer_post_code || '00-000',
    Miejscowosc: invoiceData.buyer_city || '-',
  };

  if (invoiceData.buyer_tax_no) kontrahent.NIP = invoiceData.buyer_tax_no;
  if (invoiceData.buyer_email) kontrahent.Email = invoiceData.buyer_email;
  if (invoiceData.buyer_street) kontrahent.Ulica = invoiceData.buyer_street;
  if (invoiceData.buyer_country) kontrahent.Kraj = invoiceData.buyer_country;

  const body: Record<string, unknown> = {
    Zaplacono: 0,
    LiczOd: 'NET',
    RodzajPodpisuOdbiorcy: 'BPO',
    DataWystawienia: invoiceData.issue_date,
    DataSprzedazy: invoiceData.sell_date,
    FormatDatySprzedazy: 'DZN',
    SposobZaplaty: 'PRZ',
    TerminPlatnosci: invoiceData.payment_to,
    Pozycje: positions,
    Kontrahent: kontrahent,
  };

  if (invoiceData.place) body.MiejsceWystawienia = invoiceData.place;
  if (invoiceData.seller_person) body.PodpisWystawcy = invoiceData.seller_person;

  const bodyStr = JSON.stringify(body);
  const messageToSign = `${url}${config.invoice_api_user}faktura${bodyStr}`;
  const hmacHash = await ifirmaHmac(config.invoice_api_key, messageToSign);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authentication: `IAPIS user=${config.invoice_api_user}, hmac-sha1=${hmacHash}`,
    },
    body: bodyStr,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`iFirma API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (!data?.response?.Identyfikator) {
    throw new Error(`iFirma create_invoice failed: ${JSON.stringify(data)}`);
  }

  return {
    external_invoice_id: String(data.response.Identyfikator),
    invoice_number: data.response?.NumerPelny || null,
  };
}
