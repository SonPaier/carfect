/**
 * Local dev server for PDF API.
 * Run: SUPABASE_SERVICE_ROLE_KEY=... VITE_SUPABASE_URL=... npx tsx --tsconfig api/tsconfig.json api/server.ts
 */

import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

// Build a Content-Disposition-safe ASCII filename. HTTP headers reject
// non-ASCII bytes, so transliterate Polish diacritics first.
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

const PORT = 3333;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdf: any;

async function loadPdf() {
  if (!pdf) pdf = await import('../libs/pdf/src/index.ts');
}

async function fetchLogo(url: string): Promise<Buffer | null> {
  try {
    const r = await fetch(url);
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

async function handlePdf(body: string) {
  const { publicToken } = JSON.parse(body);
  if (!publicToken) return { s: 400, b: '{"error":"Missing publicToken"}' };

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await sb.rpc('get_public_offer', {
    p_token: publicToken,
    p_skip_mark_viewed: true,
  });
  if (error || !data) return { s: 404, b: '{"error":"Offer not found"}' };
  if (data.offer_format !== 'v2') return { s: 400, b: '{"error":"PDF only for v2"}' };

  const { data: inst } = await sb
    .from('instances')
    .select(
      'id, name, logo_url, phone, email, address, website, contact_person, offer_primary_color, offer_bank_company_name, offer_bank_account_number, offer_bank_name, offer_trust_tiles, offer_trust_header_title, offer_trust_description',
    )
    .eq('id', data.instance_id)
    .single();
  if (!inst) return { s: 500, b: '{"error":"Instance not found"}' };

  const descs = (data.product_descriptions || {}) as Record<string, { description?: string }>;
  const enriched = {
    ...data,
    offer_options: (
      (data.offer_options || []) as { offer_option_items?: { product_id?: string }[] }[]
    ).map((o) => ({
      ...o,
      offer_option_items: ((o.offer_option_items || []) as { product_id?: string }[]).map((i) => ({
        ...i,
        unified_services: i.product_id && descs[i.product_id] ? descs[i.product_id] : null,
      })),
    })),
  };

  await loadPdf();
  const offer = pdf.transformOfferData(enriched);
  const instance = pdf.transformInstanceData(inst);
  const config = {
    accentColor: instance.accentColor ?? '#2563eb',
    companyName: instance.name,
    companyPhone: instance.phone,
    companyEmail: instance.email,
    companyAddress: instance.address,
    logoUrl: instance.logoUrl,
    showTrustTiles: Boolean(instance.trustTiles?.length),
    showBankAccount: Boolean(instance.bankAccountNumber),
    showExpertContact: Boolean(instance.contactPerson || instance.phone || instance.email),
  };

  const logo = instance.logoUrl ? await fetchLogo(instance.logoUrl) : null;
  // Import react-pdf from the same module tree as pdf lib to avoid dual instances
  const reactPdf = await import('@react-pdf/renderer');
  reactPdf.Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Regular.ttf',
        fontWeight: 'normal' as const,
      },
      {
        src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Bold.ttf',
        fontWeight: 'bold' as const,
      },
    ],
  });
  reactPdf.Font.registerHyphenationCallback((word: string) => [word]);
  const buf = await reactPdf.renderToBuffer(
    React.createElement(pdf.OfferPdfDocument, { offer, instance, config, logoBuffer: logo }),
  );
  const parts = [
    offer.offerNumber,
    offer.customerData?.name,
    offer.vehicleData?.brand,
    offer.vehicleData?.model,
  ]
    .filter(Boolean)
    .map(safeName);
  const filename = `Oferta-${parts.join('-')}.pdf`;

  return {
    s: 200,
    h: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
    b: Buffer.from(buf),
  };
}

async function handleInstructionPdf(body: string) {
  const parsed = JSON.parse(body) as {
    publicToken?: string;
    preview?: {
      title?: string;
      content?: { type: string };
      instance?: Record<string, string | undefined>;
    };
  };

  let title: string;
  let content: { type: string; content?: unknown[] };
  let instance: Record<string, string | undefined>;

  if (parsed.preview && parsed.preview.title && parsed.preview.content?.type === 'doc') {
    title = parsed.preview.title;
    content = parsed.preview.content as { type: string; content?: unknown[] };
    instance = parsed.preview.instance ?? {};
  } else if (parsed.publicToken) {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb.rpc('get_public_instruction', {
      p_token: parsed.publicToken,
    });
    if (error || !data) return { s: 404, b: '{"error":"Instruction not found"}' };
    const d = data as {
      title: string;
      content: { type: string; content?: unknown[] };
      instance?: Record<string, string | undefined>;
    };
    title = d.title;
    content = d.content;
    instance = d.instance ?? {};
  } else {
    return { s: 400, b: '{"error":"Missing publicToken or preview body"}' };
  }

  await loadPdf();
  const logo = instance.logo_url ? await fetchLogo(instance.logo_url) : null;
  const reactPdf = await import('@react-pdf/renderer');
  reactPdf.Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Regular.ttf',
        fontWeight: 'normal' as const,
      },
      {
        src: 'https://xsscqmlrnrodwydmgvac.supabase.co/storage/v1/object/public/instance-logos/fonts/Inter-Bold.ttf',
        fontWeight: 'bold' as const,
      },
    ],
  });
  reactPdf.Font.registerHyphenationCallback((word: string) => [word]);
  const buf = await reactPdf.renderToBuffer(
    React.createElement(pdf.InstructionPdfDocument, {
      title,
      content,
      instance,
      logoBuffer: logo,
    }),
  );
  const filename = `Instrukcja-${safeName(title)}.pdf`;
  return {
    s: 200,
    h: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
    b: Buffer.from(buf),
  };
}

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = new URL(req.url || '/', `http://localhost:${PORT}`).pathname;
  const isOffer = path === '/api/generate-offer-pdf';
  const isInstruction = path === '/api/generate-instruction-pdf';

  if (!isOffer && !isInstruction) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try {
    const r = isOffer
      ? await handlePdf(Buffer.concat(chunks).toString())
      : await handleInstructionPdf(Buffer.concat(chunks).toString());
    res.writeHead(r.s, r.h || { 'Content-Type': 'application/json' });
    res.end(r.b);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end(JSON.stringify({ error: (e as Error).message }));
  }
}).listen(PORT, () => console.log(`📄 PDF server http://localhost:${PORT}`));
