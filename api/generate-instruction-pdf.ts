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

/**
 * Fetch an image to embed in the PDF. Restricted to https URLs to prevent
 * SSRF — without the guard the preview path lets the caller point logo_url
 * at internal services (e.g. cloud metadata endpoints) since the body is
 * unauthenticated and we run inside the Vercel network.
 */
async function fetchLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  if (!/^https:\/\//i.test(logoUrl)) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// Build a Content-Disposition-safe ASCII filename. HTTP headers reject
// non-ASCII bytes, so transliterate Polish diacritics first instead of
// quoting the original UTF-8 with RFC 5987.
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
    const { registerFonts, InstructionPdfDocument, prefetchInstructionImages } =
      pdfLib as typeof import('../libs/pdf/src/index.js') & {
        InstructionPdfDocument: (typeof import('../libs/pdf/src/InstructionPdfDocument'))['InstructionPdfDocument'];
        prefetchInstructionImages: (typeof import('../libs/pdf/src/prefetchImages'))['prefetchInstructionImages'];
      };

    type InstanceShape = {
      name?: string;
      logo_url?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      contact_person?: string;
    };
    type ContentShape = import('../libs/pdf/src/InstructionPdfDocument').TiptapDocument;
    type PreviewBody = { title: string; content: ContentShape; instance: InstanceShape };

    // Body can be either { publicToken } (production: fetch via RPC) or
    // { preview: { title, content, instance } } (admin preview: render directly).
    let publicToken: string | null = null;
    let preview: PreviewBody | null = null;

    if (req.method === 'POST') {
      const body = (await req.json()) as {
        publicToken?: unknown;
        token?: unknown;
        preview?: unknown;
      };
      publicToken =
        typeof body.publicToken === 'string'
          ? body.publicToken
          : typeof body.token === 'string'
            ? body.token
            : null;
      if (
        body.preview &&
        typeof body.preview === 'object' &&
        typeof (body.preview as PreviewBody).title === 'string' &&
        (body.preview as PreviewBody).content?.type === 'doc'
      ) {
        preview = body.preview as PreviewBody;
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      publicToken = url.searchParams.get('token');
    }

    if (!publicToken && !preview) {
      return Response.json(
        { error: 'Missing publicToken or preview body' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    let title: string;
    let content: ContentShape;
    let instance: InstanceShape;

    if (preview) {
      title = preview.title;
      content = preview.content;
      instance = preview.instance ?? {};
    } else {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

      const data = rpcData as { title: string; content: ContentShape; instance: InstanceShape };
      title = data.title;
      content = data.content;
      instance = data.instance ?? {};
    }

    let logoBuffer: Buffer | null = null;
    if (instance.logo_url) {
      logoBuffer = await fetchLogoBuffer(instance.logo_url);
    }

    const imageBuffers = await prefetchInstructionImages(content);

    registerFonts();

    const pdfBuffer = await renderToBuffer(
      React.createElement(InstructionPdfDocument, {
        title,
        content,
        instance,
        logoBuffer,
        imageBuffers,
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
