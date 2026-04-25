function getInstructionPdfApiUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333/api/generate-instruction-pdf';
  }
  return 'https://carfect-pdf-api.vercel.app/api/generate-instruction-pdf';
}

export async function openInstructionPdf(publicToken: string): Promise<void> {
  try {
    const response = await fetch(getInstructionPdfApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error((errorData as { error?: string } | null)?.error ?? 'Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? 'instrukcja.pdf';

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    console.error('Instruction PDF generation error:', error);
    throw error;
  }
}
