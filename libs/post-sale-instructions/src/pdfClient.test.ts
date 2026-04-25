import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock fetch and DOM APIs before importing pdfClient
const mockBlob = new Blob(['%PDF'], { type: 'application/pdf' });
const mockObjectUrl = 'blob:http://localhost/mock-pdf';

// We use vi.stubEnv to control import.meta.env.DEV per test

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('openInstructionPdf', () => {
  it('POSTs to the dev URL when import.meta.env.DEV is truthy', async () => {
    vi.stubEnv('DEV', 'true');

    const mockAnchor = {
      href: '',
      target: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn().mockReturnValue('attachment; filename="instrukcja.pdf"'),
      },
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockResponse as unknown as Response);

    const { openInstructionPdf } = await import('./pdfClient');
    await openInstructionPdf('tok-dev-123');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/api/generate-instruction-pdf',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('POSTs to the production URL when import.meta.env.DEV is falsy', async () => {
    vi.stubEnv('DEV', '');

    const mockAnchor = {
      href: '',
      target: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn().mockReturnValue('attachment; filename="instrukcja.pdf"'),
      },
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockResponse as unknown as Response);

    const { openInstructionPdf } = await import('./pdfClient');
    await openInstructionPdf('tok-prod-456');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('carfect-pdf-api.vercel.app/api/generate-instruction-pdf'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws when the response is not ok', async () => {
    vi.stubEnv('DEV', '');

    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Internal server error' }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const { openInstructionPdf } = await import('./pdfClient');
    await expect(openInstructionPdf('tok-bad')).rejects.toThrow('Internal server error');
  });

  it('triggers a download with the filename from Content-Disposition', async () => {
    vi.stubEnv('DEV', '');

    const mockAnchor = {
      href: '',
      target: '',
      download: '',
      click: vi.fn(),
    };
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn().mockReturnValue('attachment; filename="ppf-care-2026.pdf"'),
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const { openInstructionPdf } = await import('./pdfClient');
    await openInstructionPdf('tok-dl-789');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBe('ppf-care-2026.pdf');
    expect(mockAnchor.click).toHaveBeenCalled();
  });
});

describe('previewInstructionPdf', () => {
  it('POSTs the preview body shape (title/content/instance) without a publicToken', async () => {
    vi.stubEnv('DEV', '');

    const mockAnchor = {
      href: '',
      target: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectUrl);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
      headers: {
        get: vi.fn().mockReturnValue('attachment; filename="preview.pdf"'),
      },
    };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockResponse as unknown as Response);

    const { previewInstructionPdf } = await import('./pdfClient');
    await previewInstructionPdf({
      title: 'Demo Title',
      content: { type: 'doc', content: [] },
      instance: { name: 'Demo' },
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('generate-instruction-pdf'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"preview"'),
      }),
    );
    const callBody = fetchSpy.mock.calls[0][1] as RequestInit;
    const parsed = JSON.parse(callBody.body as string);
    expect(parsed.preview.title).toBe('Demo Title');
    expect(parsed.preview.instance.name).toBe('Demo');
    expect(parsed.publicToken).toBeUndefined();
  });

  it('throws when the preview response is not ok', async () => {
    vi.stubEnv('DEV', '');
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Preview failed' }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const { previewInstructionPdf } = await import('./pdfClient');
    await expect(
      previewInstructionPdf({
        title: 'Demo',
        content: { type: 'doc', content: [] },
        instance: {},
      }),
    ).rejects.toThrow('Preview failed');
  });
});
