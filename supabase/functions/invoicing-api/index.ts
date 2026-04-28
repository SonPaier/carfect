import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  FakturowniaApiError,
  FakturowniaClient,
  mapFakturowniaToInternal,
  mapInternalInvoiceToFakturownia,
  mapInternalInvoiceToFakturowniaUpdate,
} from '../_shared/fakturownia/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ---- iFirma Strategy (legacy, separate refactor) ----

async function ifirmaHmac(hexKey: string, message: string): Promise<string> {
  const keyData = new Uint8Array(hexKey.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const msgData = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const byteArray = new Uint8Array(signature);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function ifirmaCreateInvoice(
  config: { invoice_api_user: string; invoice_api_key: string },
  invoiceData: any,
) {
  const url = 'https://www.ifirma.pl/iapi/fakturakraj.json';

  const positions = invoiceData.positions.map((p: any) => ({
    StawkaVat: p.vat_rate === -1 ? 0 : Number(p.vat_rate) / 100,
    Ilosc: Number(p.quantity),
    CenaJednostkowa: Number(p.unit_price_gross),
    NazwaPelna: p.name,
    Jednostka: p.unit || 'szt',
    TypStawkiVat: p.vat_rate === -1 ? 'ZW' : 'PRC',
  }));

  const kontrahent: Record<string, any> = {
    Nazwa: invoiceData.buyer_name,
    KodPocztowy: invoiceData.buyer_post_code || '00-000',
    Miejscowosc: invoiceData.buyer_city || '-',
  };

  if (invoiceData.buyer_tax_no) kontrahent.NIP = invoiceData.buyer_tax_no;
  if (invoiceData.buyer_email) kontrahent.Email = invoiceData.buyer_email;
  if (invoiceData.buyer_street) kontrahent.Ulica = invoiceData.buyer_street;
  if (invoiceData.buyer_country) kontrahent.Kraj = invoiceData.buyer_country;

  const body: Record<string, any> = {
    Zaplacono: 0,
    LiczOd: 'BRT',
    RodzajPodpisuOdbiorcy: 'BPO',
    DataWystawienia: invoiceData.issue_date,
    DataSprzedazy: invoiceData.sell_date,
    FormatDatySprzedazy: 'DZN',
    SposobZaplaty: (() => {
      const map: Record<string, string> = { transfer: 'PRZ', cod: 'POB', card: 'KAR', cash: 'GTK' };
      return map[invoiceData.payment_type] || 'PRZ';
    })(),
    Pozycje: positions,
    Kontrahent: kontrahent,
  };

  if (invoiceData.payment_to) body.TerminPlatnosci = invoiceData.payment_to;
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
    throw new Error(`iFirma create_invoice validation failed: ${JSON.stringify(data)}`);
  }

  return {
    external_invoice_id: String(data.response.Identyfikator),
    external_client_id: null,
    invoice_number: data.response?.NumerPelny || null,
    pdf_url: null,
  };
}

async function ifirmaSendEmail(
  config: { invoice_api_user: string; invoice_api_key: string },
  externalId: string,
  buyerEmail?: string,
) {
  const url = `https://www.ifirma.pl/iapi/fakturakraj/send/${externalId}.json`;
  const body: Record<string, any> = {};
  if (buyerEmail) body.SkrzynkaEmailOdbiorcy = buyerEmail;
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
    throw new Error(`iFirma send email error ${res.status}: ${text}`);
  }
  return true;
}

async function ifirmaTestConnection(config: { invoice_api_user: string; invoice_api_key: string }) {
  try {
    const url = 'https://www.ifirma.pl/iapi/abonent/miesiacksiegowy.json';
    const messageToSign = `${url}${config.invoice_api_user}abonent`;
    const hmacHash = await ifirmaHmac(config.invoice_api_key, messageToSign);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authentication: `IAPIS user=${config.invoice_api_user}, hmac-sha1=${hmacHash}`,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Helpers ----

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

interface FakturowniaConfigShape {
  domain: string;
  api_token: string;
}

interface IfirmaConfigShape {
  invoice_api_user: string;
  invoice_api_key: string;
}

function fakturowniaError(e: unknown): { error: string; code: string; status: number } {
  if (e instanceof FakturowniaApiError) {
    if (e.status === 404)
      return {
        error: 'Faktura nie istnieje w Fakturowni',
        code: 'fakturownia_not_found',
        status: 404,
      };
    if (e.status === 422)
      return { error: e.body || 'Operacja niedozwolona', code: 'fakturownia_locked', status: 422 };
    if (e.status >= 500)
      return { error: 'Fakturownia niedostępna', code: 'fakturownia_unreachable', status: 502 };
    return { error: e.body || e.message, code: 'invalid_payload', status: e.status };
  }
  return {
    error: (e as Error).message || 'Internal error',
    code: 'fakturownia_unreachable',
    status: 500,
  };
}

function totalGrossOf(positions: any[]): number {
  return positions.reduce(
    (sum, p) =>
      sum + Number(p.unit_price_gross) * Number(p.quantity) * (1 - (Number(p.discount) || 0) / 100),
    0,
  );
}

/**
 * Require the caller to be super_admin OR admin for the given instance.
 * Edge function uses SERVICE_ROLE_KEY which bypasses RLS, so explicit checks
 * are needed for destructive operations (cancel / delete / update_invoice).
 *
 * Returns null when authorized, or a Response when access is denied.
 */
async function requireAdminRole(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  instanceId: string,
): Promise<Response | null> {
  const { data: superAdminCheck } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'super_admin',
  });
  if (superAdminCheck) return null;
  const { data: adminCheck } = await supabase.rpc('has_instance_role', {
    _user_id: userId,
    _role: 'admin',
    _instance_id: instanceId,
  });
  if (adminCheck) return null;
  return json({ error: 'Brak uprawnień (wymagana rola admin)', code: 'unauthorized' }, 403);
}

// ---- Main Handler ----

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const { action, instanceId, ...params } = await req.json();

    // ---- test_connection (provider + config from request, not DB) ----
    if (action === 'test_connection') {
      const { provider, config } = params;
      let success = false;
      if (provider === 'fakturownia') {
        const client = new FakturowniaClient(config as FakturowniaConfigShape);
        success = await client.testConnection();
      } else if (provider === 'ifirma') {
        success = await ifirmaTestConnection(config as IfirmaConfigShape);
      }
      return json({ success });
    }

    // ---- Load invoicing settings for instance ----
    const { data: settings, error: settingsError } = await supabase
      .from('invoicing_settings')
      .select('*')
      .eq('instance_id', instanceId)
      .single();

    if (settingsError || !settings?.active || !settings.provider) {
      return json({ error: 'Invoicing not configured' }, 400);
    }

    const provider = settings.provider as 'fakturownia' | 'ifirma';
    const config = settings.provider_config as any;
    const fkClient =
      provider === 'fakturownia' ? new FakturowniaClient(config as FakturowniaConfigShape) : null;

    // ===========================================================
    //  CREATE INVOICE
    // ===========================================================
    if (action === 'create_invoice') {
      const { invoiceData, salesOrderId, customerId, autoSendEmail } = params;

      if (!invoiceData?.positions?.length) return json({ error: 'Brak pozycji na fakturze' }, 422);
      if (!invoiceData.buyer_name?.trim()) return json({ error: 'Brak nazwy nabywcy' }, 422);

      let result: {
        external_invoice_id: string;
        external_client_id: string | null;
        invoice_number: string | null;
        pdf_url: string | null;
      };

      if (fkClient) {
        try {
          const fakturowniaPayload = mapInternalInvoiceToFakturownia(invoiceData);
          const created = await fkClient.invoices.create(fakturowniaPayload);
          result = {
            external_invoice_id: String(created.id),
            external_client_id: null,
            invoice_number: created.number || null,
            pdf_url: created.view_url || null,
          };
        } catch (e) {
          const err = fakturowniaError(e);
          return json({ error: err.error, code: err.code }, err.status);
        }
      } else if (provider === 'ifirma') {
        result = await ifirmaCreateInvoice(config, invoiceData);
      } else {
        return json({ error: `Unknown provider: ${provider}` }, 400);
      }

      const { data: invoice, error: insertError } = await supabase
        .from('invoices')
        .insert({
          instance_id: instanceId,
          sales_order_id: salesOrderId || null,
          customer_id: customerId || null,
          provider,
          external_invoice_id: result.external_invoice_id,
          external_client_id: result.external_client_id,
          invoice_number: result.invoice_number,
          kind: invoiceData.kind || 'vat',
          status: 'issued',
          issue_date: invoiceData.issue_date,
          sell_date: invoiceData.sell_date,
          payment_to: invoiceData.payment_to,
          payment_type: invoiceData.payment_type || 'transfer',
          buyer_name: invoiceData.buyer_name,
          buyer_tax_no: invoiceData.buyer_tax_no,
          buyer_email: invoiceData.buyer_email,
          buyer_country: invoiceData.buyer_country || null,
          place: invoiceData.place || null,
          seller_person: invoiceData.seller_person || null,
          positions: invoiceData.positions,
          total_gross: totalGrossOf(invoiceData.positions),
          currency: invoiceData.currency || 'PLN',
          pdf_url: result.pdf_url,
          oid: salesOrderId || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (autoSendEmail && result.external_invoice_id) {
        try {
          if (fkClient) {
            await fkClient.invoices.sendByEmail(result.external_invoice_id);
          } else if (provider === 'ifirma') {
            await ifirmaSendEmail(config, result.external_invoice_id, invoiceData.buyer_email);
          }
          await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoice.id);
        } catch (e) {
          console.error('Auto-send email failed:', e);
        }
      }

      return json({ success: true, invoice });
    }

    // ===========================================================
    //  GET INVOICE (fresh from Fakturownia incl. KSeF gov_*)
    // ===========================================================
    if (action === 'get_invoice') {
      const { invoiceId } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id) return json({ error: 'Invoice not found' }, 404);
      if (!fkClient) return json({ error: 'get_invoice supported only for Fakturownia (v1)' }, 400);

      try {
        const fakturownia = await fkClient.invoices.get(inv.external_invoice_id);
        return json({ success: true, invoice: inv, fakturownia });
      } catch (e) {
        const err = fakturowniaError(e);
        return json({ error: err.error, code: err.code }, err.status);
      }
    }

    // ===========================================================
    //  UPDATE INVOICE
    // ===========================================================
    if (action === 'update_invoice') {
      const { invoiceId, invoiceData, originalPositions, autoSendEmail } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id) return json({ error: 'Invoice not found' }, 404);
      if (!fkClient)
        return json({ error: 'update_invoice supported only for Fakturownia (v1)' }, 400);

      try {
        const updatePayload = mapInternalInvoiceToFakturowniaUpdate(
          invoiceData,
          originalPositions || [],
        );
        const updated = await fkClient.invoices.update(inv.external_invoice_id, updatePayload);

        const { data: invoice } = await supabase
          .from('invoices')
          .update({
            invoice_number: updated.number || inv.invoice_number,
            issue_date: invoiceData.issue_date,
            sell_date: invoiceData.sell_date,
            payment_to: invoiceData.payment_to,
            payment_type: invoiceData.payment_type || inv.payment_type,
            buyer_name: invoiceData.buyer_name,
            buyer_tax_no: invoiceData.buyer_tax_no,
            buyer_email: invoiceData.buyer_email,
            buyer_country: invoiceData.buyer_country || null,
            place: invoiceData.place || null,
            seller_person: invoiceData.seller_person || null,
            positions: invoiceData.positions,
            total_gross: totalGrossOf(invoiceData.positions),
            currency: invoiceData.currency || inv.currency,
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (autoSendEmail && inv.status !== 'sent') {
          try {
            await fkClient.invoices.sendByEmail(inv.external_invoice_id);
            await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);
          } catch (e) {
            console.error('Auto-send after update failed:', e);
          }
        }

        return json({ success: true, invoice });
      } catch (e) {
        const err = fakturowniaError(e);
        return json({ error: err.error, code: err.code }, err.status);
      }
    }

    // ===========================================================
    //  CANCEL INVOICE
    // ===========================================================
    if (action === 'cancel_invoice') {
      const denied = await requireAdminRole(supabase, user.id, instanceId);
      if (denied) return denied;

      const { invoiceId, cancelReason } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id) return json({ error: 'Invoice not found' }, 404);
      if (!fkClient)
        return json({ error: 'cancel_invoice supported only for Fakturownia (v1)' }, 400);

      try {
        await fkClient.invoices.cancel({
          cancel_invoice_id: Number(inv.external_invoice_id),
          cancel_reason: cancelReason,
        });
        await supabase
          .from('invoices')
          .update({
            status: 'cancelled',
            cancel_reason: cancelReason || null,
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        return json({ success: true });
      } catch (e) {
        const err = fakturowniaError(e);
        return json({ error: err.error, code: err.code }, err.status);
      }
    }

    // ===========================================================
    //  DELETE INVOICE (hard delete in both)
    // ===========================================================
    if (action === 'delete_invoice') {
      const denied = await requireAdminRole(supabase, user.id, instanceId);
      if (denied) return denied;

      const { invoiceId } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id) return json({ error: 'Invoice not found' }, 404);
      if (!fkClient)
        return json({ error: 'delete_invoice supported only for Fakturownia (v1)' }, 400);

      try {
        await fkClient.invoices.delete(inv.external_invoice_id);
        await supabase.from('invoices').delete().eq('id', invoiceId);
        return json({ success: true });
      } catch (e) {
        const err = fakturowniaError(e);
        return json({ error: err.error, code: err.code }, err.status);
      }
    }

    // ===========================================================
    //  SEND INVOICE BY EMAIL
    // ===========================================================
    if (action === 'send_invoice') {
      const { invoiceId } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id)
        return json({ error: 'Invoice not found or no external ID' }, 404);

      try {
        if (fkClient) {
          await fkClient.invoices.sendByEmail(inv.external_invoice_id);
        } else if (provider === 'ifirma') {
          await ifirmaSendEmail(config, inv.external_invoice_id, inv.buyer_email);
        }
        await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);
        return json({ success: true });
      } catch (e) {
        const err = fakturowniaError(e);
        return json({ error: err.error, code: err.code }, err.status);
      }
    }

    // ===========================================================
    //  GET PDF (Fakturownia: proxy through edge fn to keep token server-side)
    // ===========================================================
    if (action === 'get_pdf_url' || action === 'get_pdf') {
      const { invoiceId } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv) return json({ error: 'Invoice not found' }, 404);

      if (fkClient && inv.external_invoice_id) {
        try {
          const pdfData = await fkClient.invoices.getPdf(inv.external_invoice_id);
          return new Response(pdfData, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="faktura-${inv.invoice_number || inv.external_invoice_id}.pdf"`,
            },
          });
        } catch (e) {
          const err = fakturowniaError(e);
          return json({ error: err.error, code: err.code }, err.status);
        }
      }

      return json({ pdf_url: inv.pdf_url || null });
    }

    // ---- iFirma PDF (legacy) ----
    if (action === 'get_ifirma_pdf') {
      const { invoiceId } = params;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('instance_id', instanceId)
        .single();

      if (!inv?.external_invoice_id) return json({ error: 'Invoice not found' }, 404);
      if (provider !== 'ifirma') return json({ error: 'Not an iFirma invoice' }, 400);

      const pdfUrl = `https://www.ifirma.pl/iapi/fakturakraj/${inv.external_invoice_id}.pdf`;
      const messageToSign = `${pdfUrl}${config.invoice_api_user}faktura`;
      const hmacHash = await ifirmaHmac(config.invoice_api_key, messageToSign);

      const pdfRes = await fetch(pdfUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
          Authentication: `IAPIS user=${config.invoice_api_user}, hmac-sha1=${hmacHash}`,
        },
      });

      if (!pdfRes.ok) {
        const text = await pdfRes.text();
        throw new Error(`iFirma PDF error ${pdfRes.status}: ${text}`);
      }

      const pdfData = await pdfRes.arrayBuffer();
      return new Response(pdfData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="faktura-${inv.invoice_number || inv.external_invoice_id}.pdf"`,
        },
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('Invoicing API error:', error);
    return json({ error: (error as Error).message || 'Internal error' }, 500);
  }
});

// silence unused-import warning when only Fakturownia path is exercised
void mapFakturowniaToInternal;
