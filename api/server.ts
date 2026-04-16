/**
 * Local dev server for PDF API.
 * Run: SUPABASE_SERVICE_ROLE_KEY=... VITE_SUPABASE_URL=... npx tsx --tsconfig api/tsconfig.json api/server.ts
 */

import { createServer } from 'http';
import { createClient } from '@supabase/supabase-js';
import React from 'react';

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
  const safeName = (s: string) =>
    s
      .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ \-_]/g, '')
      .trim()
      .replace(/\s+/g, '-');
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

  if (new URL(req.url || '/', `http://localhost:${PORT}`).pathname === '/api/generate-offer-pdf') {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    try {
      const r = await handlePdf(Buffer.concat(chunks).toString());
      res.writeHead(r.s, r.h || { 'Content-Type': 'application/json' });
      res.end(r.b);
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end(JSON.stringify({ error: (e as Error).message }));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => console.log(`📄 PDF server http://localhost:${PORT}`));
