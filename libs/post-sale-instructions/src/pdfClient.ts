import type { TiptapDocument } from './types';

function getInstructionPdfApiUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333/api/generate-instruction-pdf';
  }
  return 'https://carfect-pdf-api.vercel.app/api/generate-instruction-pdf';
}

interface PreviewInstance {
  name?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  contact_person?: string;
}

interface DownloadFlowOptions {
  body: BodyInit;
  fallbackFilename: string;
}

async function downloadPdf({ body, fallbackFilename }: DownloadFlowOptions): Promise<void> {
  const response = await fetch(getInstructionPdfApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error((errorData as { error?: string } | null)?.error ?? 'Failed to generate PDF');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const disposition = response.headers.get('Content-Disposition');
  const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? fallbackFilename;

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openInstructionPdf(publicToken: string): Promise<void> {
  try {
    await downloadPdf({
      body: JSON.stringify({ publicToken }),
      fallbackFilename: 'instrukcja.pdf',
    });
  } catch (error: unknown) {
    console.error('Instruction PDF generation error:', error);
    throw error;
  }
}

export async function previewInstructionPdf(payload: {
  title: string;
  content: TiptapDocument;
  instance: PreviewInstance;
}): Promise<void> {
  try {
    await downloadPdf({
      body: JSON.stringify({ preview: payload }),
      fallbackFilename: `${payload.title.replace(/[^a-zA-Z0-9]+/g, '-')}.pdf`,
    });
  } catch (error: unknown) {
    console.error('Instruction PDF preview error:', error);
    throw error;
  }
}
