// Walks a Tiptap document, finds image URLs, fetches them as Buffers so
// react-pdf can embed them in the PDF. react-pdf in Node will not fetch
// arbitrary HTTP URLs reliably, so we must pre-download every image
// before render and pass the bytes inline.

import type { TiptapDocument, TiptapNode, TiptapElementNode } from './tiptapText';

export type ImageFormat = 'jpg' | 'png' | 'gif' | 'bmp';

export interface PrefetchedImage {
  data: Buffer;
  format: ImageFormat;
}

// Extensions accepted by react-pdf natively, plus webp/avif which we
// transcode to JPEG via sharp before passing them to react-pdf.
const SUPPORTED_EXT_RE = /\.(jpe?g|png|gif|bmp|webp|avif)(?:\?|#|$)/i;
const NEEDS_TRANSCODE_RE = /\.(webp|avif)(?:\?|#|$)/i;

// SSRF guard: the preview endpoint accepts unauthenticated user input, so
// we must not dereference arbitrary URLs. Only the project's public storage
// host is allowed — anything else (internal IPs, localhost, third-party
// hosts) is silently ignored.
const ALLOWED_IMAGE_HOST_RE = /^https:\/\/[a-z0-9-]+\.supabase\.co\//i;

// Cap to bound memory and request volume on a single render. A malicious
// preview body could otherwise reference thousands of large images.
const MAX_IMAGES_PER_DOC = 30;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function detectImageFormat(url: string): ImageFormat | null {
  const m = url.match(SUPPORTED_EXT_RE);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  if (ext === 'jpeg' || ext === 'jpg') return 'jpg';
  if (ext === 'webp' || ext === 'avif') return 'jpg';
  return ext as 'png' | 'gif' | 'bmp';
}

export function needsTranscode(url: string): boolean {
  return NEEDS_TRANSCODE_RE.test(url);
}

/**
 * Pure helper — walks the doc tree and returns every image URL with a
 * react-pdf-supported extension. Restricted to https for SSRF safety:
 * the preview endpoint accepts arbitrary user input, so we must not
 * dereference http or other schemes.
 */
export function collectImageUrls(doc: TiptapDocument): string[] {
  const urls = new Set<string>();
  walk(doc.content ?? [], urls);
  return Array.from(urls);
}

function walk(nodes: TiptapNode[], urls: Set<string>): void {
  for (const node of nodes) {
    if (urls.size >= MAX_IMAGES_PER_DOC) return;
    if (node.type === 'image') {
      const src = (node as TiptapElementNode).attrs?.src;
      if (
        typeof src === 'string' &&
        ALLOWED_IMAGE_HOST_RE.test(src) &&
        detectImageFormat(src) !== null
      ) {
        urls.add(src);
      }
      continue;
    }
    const children = (node as TiptapElementNode).content;
    if (Array.isArray(children)) walk(children, urls);
  }
}

/**
 * Fetches every image referenced in the doc. Failures are swallowed —
 * a missing image is dropped from the rendered PDF rather than aborting
 * the whole document. .webp / .avif are transcoded to JPEG via sharp
 * because react-pdf cannot embed them directly.
 */
export async function prefetchInstructionImages(
  doc: TiptapDocument,
): Promise<Map<string, PrefetchedImage>> {
  const urls = collectImageUrls(doc);
  const map = new Map<string, PrefetchedImage>();
  await Promise.all(
    urls.map(async (url) => {
      const format = detectImageFormat(url);
      if (!format) return;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const declaredLen = Number(res.headers?.get?.('content-length') ?? '0');
        if (declaredLen > MAX_IMAGE_BYTES) return;
        let buf = Buffer.from(await res.arrayBuffer());
        if (buf.byteLength > MAX_IMAGE_BYTES) return;
        if (needsTranscode(url)) {
          const sharp = (await import('sharp')).default;
          buf = await sharp(buf).jpeg({ quality: 90 }).toBuffer();
        }
        map.set(url, { data: buf, format });
      } catch {
        // Skip — broken URL, decode failure, or network failure
      }
    }),
  );
  return map;
}
