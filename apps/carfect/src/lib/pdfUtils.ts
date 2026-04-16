import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export async function openOfferPdf(publicToken: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
      body: { token: publicToken },
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate PDF');
    }

    // Edge function returns HTML with auto-print — open in new window
    const html = typeof data === 'string' ? data : await (data as Blob).text();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      toast.error('Odblokuj wyskakujące okna w przeglądarce');
    }
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    toast.error('Nie udało się wygenerować PDF');
    throw error;
  }
}
