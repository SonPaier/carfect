// Fakturownia HTTP client — używać tylko po stronie serwera (edge functions).
// Z przeglądarki → CORS. Mapowanie do/z naszych typów: w mappers.ts.

import {
  FakturowniaApiError,
  FakturowniaCancelInvoicePayload,
  FakturowniaClient as FakturowniaClientResource,
  FakturowniaClientCreate,
  FakturowniaClientSearch,
  FakturowniaInvoice,
  FakturowniaInvoiceCreate,
  FakturowniaInvoiceUpdate,
  FakturowniaProduct,
  FakturowniaProductCreate,
  FakturowniaWebhook,
  FakturowniaWebhookCreate,
} from './types.ts';

interface FakturowniaConfig {
  domain: string;
  api_token: string;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string; // np. '/invoices.json'
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined>;
  /**
   * Dla części wywołań Fakturownia chce api_token w body
   * (POST/PUT). Dla GET/DELETE — w query. Domyślnie: zgadnij po metodzie.
   */
  tokenInQuery?: boolean;
  /** Dla pobierania binarnych odpowiedzi (PDF). */
  responseType?: 'json' | 'arrayBuffer';
}

export class FakturowniaClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(config: FakturowniaConfig) {
    this.baseUrl = `https://${config.domain}.fakturownia.pl`;
    this.apiToken = config.api_token;
  }

  // ---- Invoices ----
  invoices = {
    create: (invoice: FakturowniaInvoiceCreate): Promise<FakturowniaInvoice> =>
      this.request({
        method: 'POST',
        path: '/invoices.json',
        body: { invoice },
      }),

    get: (id: number | string): Promise<FakturowniaInvoice> =>
      this.request({
        method: 'GET',
        path: `/invoices/${id}.json`,
      }),

    list: (
      params: { period?: string; page?: number; per_page?: number } = {},
    ): Promise<FakturowniaInvoice[]> =>
      this.request({
        method: 'GET',
        path: '/invoices.json',
        query: params,
      }),

    update: (id: number | string, invoice: FakturowniaInvoiceUpdate): Promise<FakturowniaInvoice> =>
      this.request({
        method: 'PUT',
        path: `/invoices/${id}.json`,
        body: { invoice },
      }),

    delete: (id: number | string): Promise<void> =>
      this.request({
        method: 'DELETE',
        path: `/invoices/${id}.json`,
      }),

    cancel: (payload: FakturowniaCancelInvoicePayload): Promise<{ status: string }> =>
      this.request({
        method: 'POST',
        path: '/invoices/cancel.json',
        body: payload as unknown as Record<string, unknown>,
      }),

    sendByEmail: (id: number | string): Promise<{ status: string }> =>
      this.request({
        method: 'POST',
        path: `/invoices/${id}/send_by_email.json`,
        body: {},
      }),

    getPdf: (id: number | string): Promise<ArrayBuffer> =>
      this.request({
        method: 'GET',
        path: `/invoices/${id}.pdf`,
        tokenInQuery: true,
        responseType: 'arrayBuffer',
      }),
  };

  // ---- Clients ----
  clients = {
    create: (client: FakturowniaClientCreate): Promise<FakturowniaClientResource> =>
      this.request({
        method: 'POST',
        path: '/clients.json',
        body: { client },
      }),

    list: (search: FakturowniaClientSearch = {}): Promise<FakturowniaClientResource[]> =>
      this.request({
        method: 'GET',
        path: '/clients.json',
        query: search as Record<string, string | number | undefined>,
      }),

    get: (id: number | string): Promise<FakturowniaClientResource> =>
      this.request({
        method: 'GET',
        path: `/clients/${id}.json`,
      }),

    update: (
      id: number | string,
      client: Partial<FakturowniaClientCreate>,
    ): Promise<FakturowniaClientResource> =>
      this.request({
        method: 'PUT',
        path: `/clients/${id}.json`,
        body: { client },
      }),

    findByTaxNo: async (taxNo: string): Promise<FakturowniaClientResource | null> => {
      const sanitized = taxNo.replace(/[^0-9]/g, '');
      if (!sanitized) return null;
      const list = await this.clients.list({ tax_no: sanitized });
      return list.find((c) => (c.tax_no || '').replace(/[^0-9]/g, '') === sanitized) ?? null;
    },
  };

  // ---- Products ----
  products = {
    create: (product: FakturowniaProductCreate): Promise<FakturowniaProduct> =>
      this.request({
        method: 'POST',
        path: '/products.json',
        body: { product },
      }),

    list: (
      params: { name?: string; code?: string; page?: number } = {},
    ): Promise<FakturowniaProduct[]> =>
      this.request({
        method: 'GET',
        path: '/products.json',
        query: params,
      }),

    update: (
      id: number | string,
      product: Partial<FakturowniaProductCreate>,
    ): Promise<FakturowniaProduct> =>
      this.request({
        method: 'PUT',
        path: `/products/${id}.json`,
        body: { product },
      }),

    findByCode: async (code: string): Promise<FakturowniaProduct | null> => {
      if (!code) return null;
      const list = await this.products.list({ code });
      return list.find((p) => p.code === code) ?? null;
    },
  };

  // ---- Webhooks ----
  webhooks = {
    create: (webhook: FakturowniaWebhookCreate): Promise<FakturowniaWebhook> =>
      this.request({
        method: 'POST',
        path: '/webhooks.json',
        body: { webhook },
      }),

    list: (): Promise<FakturowniaWebhook[]> =>
      this.request({
        method: 'GET',
        path: '/webhooks.json',
      }),

    delete: (id: number | string): Promise<void> =>
      this.request({
        method: 'DELETE',
        path: `/webhooks/${id}.json`,
      }),
  };

  // ---- Test connection ----
  async testConnection(): Promise<boolean> {
    try {
      await this.invoices.list({ period: 'last_5', page: 1, per_page: 1 });
      return true;
    } catch {
      return false;
    }
  }

  // ---- Internal request helper ----
  private async request<T = unknown>(opts: RequestOptions): Promise<T> {
    const { method, path, body, query, responseType = 'json' } = opts;
    const tokenInQuery = opts.tokenInQuery ?? (method === 'GET' || method === 'DELETE');

    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }
    if (tokenInQuery) {
      url.searchParams.set('api_token', this.apiToken);
    }

    const init: RequestInit = { method };
    if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      init.body = JSON.stringify({ api_token: this.apiToken, ...body });
    } else if (!tokenInQuery) {
      // POST bez body — token w body
      init.headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
      init.body = JSON.stringify({ api_token: this.apiToken });
    }

    const res = await fetch(url.toString(), init);

    if (!res.ok) {
      const text = await res.text();
      throw new FakturowniaApiError(res.status, text, `${method} ${path}`);
    }

    if (responseType === 'arrayBuffer') {
      return (await res.arrayBuffer()) as unknown as T;
    }

    // DELETE może zwrócić 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    const text = await res.text();
    if (!text) return undefined as unknown as T;
    return JSON.parse(text) as T;
  }
}
