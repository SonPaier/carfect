import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectImageUrls, detectImageFormat, prefetchInstructionImages } from './prefetchImages';
import type { TiptapDocument } from './tiptapText';

describe('detectImageFormat', () => {
  it('returns jpg for .jpg and .jpeg', () => {
    expect(detectImageFormat('https://x/img.jpg')).toBe('jpg');
    expect(detectImageFormat('https://x/img.jpeg')).toBe('jpg');
    expect(detectImageFormat('https://x/img.JPEG?v=1')).toBe('jpg');
  });

  it('returns png/gif/bmp', () => {
    expect(detectImageFormat('https://x/a.png')).toBe('png');
    expect(detectImageFormat('https://x/a.gif')).toBe('gif');
    expect(detectImageFormat('https://x/a.bmp#hash')).toBe('bmp');
  });

  it('maps webp/avif to jpg (transcoded by prefetch)', () => {
    expect(detectImageFormat('https://x/a.webp')).toBe('jpg');
    expect(detectImageFormat('https://x/b.avif?v=1')).toBe('jpg');
  });

  it('returns null for missing or unsupported extensions', () => {
    expect(detectImageFormat('https://x/no-ext')).toBeNull();
    expect(detectImageFormat('https://x/svg.svg')).toBeNull();
  });
});

describe('collectImageUrls', () => {
  const doc = (content: unknown): TiptapDocument =>
    ({ type: 'doc', content }) as unknown as TiptapDocument;

  it('returns empty for doc with no images', () => {
    expect(
      collectImageUrls(doc([{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }])),
    ).toEqual([]);
  });

  it('finds nested images inside lists and paragraphs', () => {
    const urls = collectImageUrls(
      doc([
        { type: 'paragraph', content: [{ type: 'text', text: 'before' }] },
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.jpg' } },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'image', attrs: { src: 'https://x.supabase.co/b.png' } }],
            },
          ],
        },
      ]),
    );
    expect(urls.sort()).toEqual(['https://x.supabase.co/a.jpg', 'https://x.supabase.co/b.png']);
  });

  it('deduplicates repeated URLs', () => {
    const urls = collectImageUrls(
      doc([
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.jpg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.jpg' } },
      ]),
    );
    expect(urls).toEqual(['https://x.supabase.co/a.jpg']);
  });

  it('rejects http, other schemes, and non-supabase hosts (SSRF guard)', () => {
    const urls = collectImageUrls(
      doc([
        { type: 'image', attrs: { src: 'http://internal/secret.jpg' } },
        { type: 'image', attrs: { src: 'file:///etc/passwd.jpg' } },
        { type: 'image', attrs: { src: 'data:image/png;base64,xxx' } },
        { type: 'image', attrs: { src: 'https://attacker.com/img.png' } },
        { type: 'image', attrs: { src: 'https://ok.supabase.co/img.png' } },
      ]),
    );
    expect(urls).toEqual(['https://ok.supabase.co/img.png']);
  });

  it('caps the number of collected URLs to bound DoS exposure', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      type: 'image',
      attrs: { src: `https://ok.supabase.co/img-${i}.png` },
    }));
    const urls = collectImageUrls(doc(many));
    expect(urls.length).toBeLessThanOrEqual(30);
  });

  it('includes .webp / .avif (transcoded later) but not .svg or extensionless', () => {
    const urls = collectImageUrls(
      doc([
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.webp' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/b.svg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/c.avif' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/d.png' } },
      ]),
    );
    expect(urls.sort()).toEqual([
      'https://x.supabase.co/a.webp',
      'https://x.supabase.co/c.avif',
      'https://x.supabase.co/d.png',
    ]);
  });
});

describe('prefetchInstructionImages', () => {
  const ORIG_FETCH = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = ORIG_FETCH;
  });

  it('fetches each unique URL once and returns Buffer + format', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(`bytes-of-${url}`).buffer,
    }));

    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.jpg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/a.jpg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/b.png' } },
      ] as never,
    };

    const map = await prefetchInstructionImages(doc);
    expect(map.size).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(map.get('https://x.supabase.co/a.jpg')?.format).toBe('jpg');
    expect(map.get('https://x.supabase.co/b.png')?.format).toBe('png');
    expect(map.get('https://x.supabase.co/a.jpg')?.data.toString()).toBe(
      'bytes-of-https://x.supabase.co/a.jpg',
    );
  });

  it('skips URLs that fail to fetch — does not throw', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      if (url.includes('broken')) throw new Error('network down');
      if (url.includes('404')) return { ok: false, arrayBuffer: async () => new ArrayBuffer(0) };
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) };
    });

    const doc: TiptapDocument = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { src: 'https://x.supabase.co/ok.jpg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/broken.jpg' } },
        { type: 'image', attrs: { src: 'https://x.supabase.co/404.jpg' } },
      ] as never,
    };

    const map = await prefetchInstructionImages(doc);
    expect(map.size).toBe(1);
    expect(map.has('https://x.supabase.co/ok.jpg')).toBe(true);
  });
});
