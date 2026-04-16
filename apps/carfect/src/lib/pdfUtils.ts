import { toast } from 'sonner';

function getPdfApiUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333/api/generate-offer-pdf';
  }
  // Always use main domain for Vercel API routes (subdomains don't serve API)
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
    window.open(url, '_blank');
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    toast.error('Nie udało się wygenerować PDF');
    throw error;
  }
}
