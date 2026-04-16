import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export async function openOfferPdf(publicToken: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-offer-pdf', {
      body: { publicToken },
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate PDF');
    }

    // data is already a Blob when content-type is application/pdf
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error: unknown) {
    console.error('PDF generation error:', error);
    toast.error('Nie udało się wygenerować PDF');
    throw error;
  }
}
