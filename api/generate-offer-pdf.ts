import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Expose-Headers': 'Content-Disposition',
};

// Trick to prevent Vercel/ncc bundler from converting dynamic import() to require()
// The bundler statically analyzes import() calls and replaces them with require(),
// which breaks ESM-only packages like @react-pdf/renderer.
// Using Function constructor hides the import from static analysis.
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<Record<string, unknown>>;

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

export default async function handler(req: Request) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Dynamic imports hidden from bundler for ESM-only packages
    const [reactPdf, React, pdfLib] = await Promise.all([
      dynamicImport('@react-pdf/renderer') as Promise<typeof import('@react-pdf/renderer')>,
      dynamicImport('react') as Promise<typeof import('react')>,
      dynamicImport('../libs/pdf/src/index.js') as Promise<
        typeof import('../libs/pdf/src/index.js')
      >,
    ]);

    const { renderToBuffer } = reactPdf;
    const { registerFonts, OfferPdfDocument, transformOfferData, transformInstanceData } = pdfLib;
    type PdfConfig = import('../libs/pdf/src/styles').PdfConfig;

    // Parse token from POST body or GET query
    let publicToken: string | null = null;

    if (req.method === 'POST') {
      const body = (await req.json()) as { publicToken?: unknown };
      publicToken = typeof body.publicToken === 'string' ? body.publicToken : null;
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      publicToken = url.searchParams.get('token');
    }

    if (!publicToken) {
      return Response.json(
        { error: 'Missing publicToken' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch offer data using the same RPC as PublicOfferView
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_offer', {
      p_token: publicToken,
      p_skip_mark_viewed: true,
    });

    if (rpcError) {
      console.error('RPC error:', rpcError.message);
      return Response.json(
        { error: 'Failed to fetch offer data' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    if (!rpcData) {
      return Response.json({ error: 'Offer not found' }, { status: 404, headers: CORS_HEADERS });
    }

    const data = rpcData as Record<string, unknown>;

    // PDF generation only supports v2 offers
    if (data.offer_format !== 'v2') {
      return Response.json(
        { error: 'PDF generation is only available for v2 offers' },
        { status: 400, headers: CORS_HEADERS },
      );
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
      return Response.json(
        { error: 'Failed to fetch instance data' },
        { status: 500, headers: CORS_HEADERS },
      );
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

    const safeName = (s: string) =>
      s
        .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ \-_]/g, '')
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

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err: unknown) {
    console.error('PDF generation error:', err);
    return Response.json(
      { error: (err as Error).message || 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
