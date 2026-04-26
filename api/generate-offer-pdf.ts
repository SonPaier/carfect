import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import {
  registerFonts,
  OfferPdfDocument,
  transformOfferData,
  transformInstanceData,
  type PdfConfig,
} from '../libs/pdf/dist/index.mjs';

export const maxDuration = 30;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Expose-Headers': 'Content-Disposition',
};

async function fetchLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

function setCors(res: ServerResponse): void {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  setCors(res);
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 200;
    res.end('ok');
    return;
  }

  try {
    // Parse token from POST body or GET query
    let publicToken: string | null = null;

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      publicToken = typeof body.publicToken === 'string' ? body.publicToken : null;
    } else if (req.method === 'GET') {
      const url = new URL(req.url ?? '/', 'http://x');
      publicToken = url.searchParams.get('token');
    }

    if (!publicToken) {
      sendJson(res, 400, { error: 'Missing publicToken' });
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch offer data using the same RPC as PublicOfferView
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_offer', {
      p_token: publicToken,
      p_skip_mark_viewed: true,
    });

    if (rpcError) {
      console.error('RPC error:', rpcError.message);
      sendJson(res, 500, { error: 'Failed to fetch offer data' });
      return;
    }

    if (!rpcData) {
      sendJson(res, 404, { error: 'Offer not found' });
      return;
    }

    const data = rpcData as Record<string, unknown>;

    // PDF generation only supports v2 offers
    if (data.offer_format !== 'v2') {
      sendJson(res, 400, { error: 'PDF generation is only available for v2 offers' });
      return;
    }

    const instanceId = data.instance_id as string;

    // Fetch instance data for branding
    const { data: instanceData, error: instanceError } = await supabase
      .from('instances')
      .select(
        'id, name, logo_url, phone, email, address, website, contact_person, offer_primary_color, offer_bank_company_name, offer_bank_account_number, offer_bank_name, offer_trust_tiles, offer_trust_header_title, offer_trust_description',
      )
      .eq('id', instanceId)
      .single();

    if (instanceError || !instanceData) {
      console.error('Instance fetch error:', instanceError?.message);
      sendJson(res, 500, { error: 'Failed to fetch instance data' });
      return;
    }

    // Enrich offer_option_items with product descriptions (same as PublicOfferView)
    const productDescriptions = (data.product_descriptions || {}) as Record<
      string,
      { description?: string; photo_urls?: string[] | null }
    >;

    const enrichedData = {
      ...data,
      offer_options: (
        (data.offer_options || []) as { offer_option_items?: { product_id?: string }[] }[]
      ).map((opt) => ({
        ...opt,
        offer_option_items: ((opt.offer_option_items || []) as { product_id?: string }[]).map(
          (item) => ({
            ...item,
            unified_services:
              item.product_id && productDescriptions[item.product_id]
                ? productDescriptions[item.product_id]
                : null,
          }),
        ),
      })),
    };

    // Transform DB data into clean PDF types
    const offerPdfData = transformOfferData(
      enrichedData as Parameters<typeof transformOfferData>[0],
    );
    const instancePdfData = transformInstanceData(instanceData);

    // Build PdfConfig from instance data
    const config: PdfConfig = {
      accentColor: instancePdfData.accentColor ?? '#2563eb',
      companyName: instancePdfData.name,
      companyPhone: instancePdfData.phone,
      companyEmail: instancePdfData.email,
      companyAddress: instancePdfData.address,
      logoUrl: instancePdfData.logoUrl,
      showTrustTiles: Boolean(instancePdfData.trustTiles && instancePdfData.trustTiles.length > 0),
      showBankAccount: Boolean(instancePdfData.bankAccountNumber),
      showExpertContact: Boolean(
        instancePdfData.contactPerson || instancePdfData.phone || instancePdfData.email,
      ),
    };

    // Fetch logo as buffer if available
    let logoBuffer: Buffer | null = null;
    if (instancePdfData.logoUrl) {
      logoBuffer = await fetchLogoBuffer(instancePdfData.logoUrl);
    }

    // Register fonts and render PDF
    registerFonts();

    const pdfBuffer = await renderToBuffer(
      React.createElement(OfferPdfDocument, {
        offer: offerPdfData,
        instance: instancePdfData,
        config,
        logoBuffer,
      }),
    );

    // ASCII-safe filename — HTTP Content-Disposition rejects non-ASCII bytes,
    // so transliterate Polish diacritics first.
    const PL_DIACRITICS: Record<string, string> = {
      ą: 'a',
      ć: 'c',
      ę: 'e',
      ł: 'l',
      ń: 'n',
      ó: 'o',
      ś: 's',
      ź: 'z',
      ż: 'z',
      Ą: 'A',
      Ć: 'C',
      Ę: 'E',
      Ł: 'L',
      Ń: 'N',
      Ó: 'O',
      Ś: 'S',
      Ź: 'Z',
      Ż: 'Z',
    };
    const safeName = (s: string) =>
      s
        .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => PL_DIACRITICS[ch] ?? ch)
        .replace(/[^a-zA-Z0-9 \-_]/g, '')
        .trim()
        .replace(/\s+/g, '-');
    const filenameParts = [
      offerPdfData.offerNumber,
      offerPdfData.customerData?.name,
      offerPdfData.vehicleData?.brand,
      offerPdfData.vehicleData?.model,
    ]
      .filter(Boolean)
      .map(safeName);
    const filename = `Oferta-${filenameParts.join('-')}.pdf`;

    setCors(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdfBuffer.length));
    res.end(pdfBuffer);
  } catch (err: unknown) {
    console.error('PDF generation error:', err);
    sendJson(res, 500, { error: (err as Error).message || 'Internal server error' });
  }
}
