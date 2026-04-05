import { toast } from 'sonner';

const PDF_API_URL = '/api/generate-offer-pdf';

export async function openOfferPdf(publicToken: string): Promise<void> {
  try {
    const response = await fetch(PDF_API_URL, {
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
