import { toast } from 'sonner';

function getPdfApiUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333/api/generate-offer-pdf';
  }
  return 'https://carfect.pl/api/generate-offer-pdf';
}

export async function openOfferPdf(publicToken: string): Promise<void> {
  try {
    const response = await fetch(getPdfApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Extract filename from Content-Disposition header
    const disposition = response.headers.get('Content-Disposition');
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] || 'oferta.pdf';

    // Create download link with proper filename
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    toast.error('Nie udało się wygenerować PDF');
    throw error;
  }
}
