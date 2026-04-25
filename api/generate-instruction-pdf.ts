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

const safeName = (s: string) =>
  s
    .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ \-_]/g, '')
    .trim()
    .replace(/\s+/g, '-');

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
    const { registerFonts, InstructionPdfDocument } = pdfLib as typeof import('../libs/pdf/src/index.js') & {
      InstructionPdfDocument: (typeof import('../libs/pdf/src/InstructionPdfDocument'))['InstructionPdfDocument'];
    };

    // Parse token from POST body or GET query
    let publicToken: string | null = null;

    if (req.method === 'POST') {
      const body = (await req.json()) as { publicToken?: unknown; token?: unknown };
      publicToken =
        typeof body.publicToken === 'string'
          ? body.publicToken
          : typeof body.token === 'string'
            ? body.token
            : null;
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

    // Fetch instruction data via public RPC (no skip-mark-viewed needed — WHERE viewed_at IS NULL
    // makes repeated calls idempotent; add a p_skip_mark_viewed param here if admin preview is needed in future)
    // TODO: add p_skip_mark_viewed to get_public_instruction RPC if admin-preview behaviour is required
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_instruction', {
      p_token: publicToken,
    });

    if (rpcError) {
      console.error('RPC error:', rpcError.message);
      return Response.json(
        { error: 'Failed to fetch instruction data' },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    if (!rpcData) {
      return Response.json(
        { error: 'Instruction not found' },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // Extract typed fields from the JSONB result (spec section 3.3)
    const data = rpcData as {
      title: string;
      content: import('../libs/pdf/src/InstructionPdfDocument').TiptapDocument;
      instance: {
        name?: string;
        logo_url?: string;
        phone?: string;
        email?: string;
        address?: string;
        website?: string;
        contact_person?: string;
      };
    };

    const { title, content, instance } = data;

    // Fetch logo as buffer if available
    let logoBuffer: Buffer | null = null;
    if (instance.logo_url) {
      logoBuffer = await fetchLogoBuffer(instance.logo_url);
    }

    // Register fonts and render PDF
    registerFonts();

    const pdfBuffer = await renderToBuffer(
      React.createElement(InstructionPdfDocument, {
        title,
        content,
        instance,
        logoBuffer,
      }),
    );

    const filename = `Instrukcja-${safeName(title)}.pdf`;

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
