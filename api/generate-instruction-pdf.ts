import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import {
  registerFonts,
  InstructionPdfDocument,
  prefetchInstructionImages,
  type TiptapDocument,
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
    type InstanceShape = {
      name?: string;
      logo_url?: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
      contact_person?: string;
    };
    type ContentShape = TiptapDocument;
    type PreviewBody = { title: string; content: ContentShape; instance: InstanceShape };

    // Body can be either { publicToken } (production: fetch via RPC) or
    // { preview: { title, content, instance } } (admin preview: render directly).
    let publicToken: string | null = null;
    let preview: PreviewBody | null = null;

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
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
      const url = new URL(req.url ?? '/', 'http://x');
      publicToken = url.searchParams.get('token');
    }

    if (!publicToken && !preview) {
      sendJson(res, 400, { error: 'Missing publicToken or preview body' });
      return;
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
        sendJson(res, 500, { error: 'Failed to fetch instruction data' });
        return;
      }

      if (!rpcData) {
        sendJson(res, 404, { error: 'Instruction not found' });
        return;
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
