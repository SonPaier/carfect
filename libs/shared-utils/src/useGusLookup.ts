import { useState } from 'react';

export interface GusResult {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  regon?: string;
}

export interface UseGusLookupOptions {
  onSuccess?: (result: GusResult) => void;
  onError?: (message: string) => void;
  /** Supabase client for calling edge function. Falls back to direct API if not provided. */
  supabase?: { functions: { invoke: (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }> } };
}

export function useGusLookup(options?: UseGusLookupOptions) {
  const [loading, setLoading] = useState(false);

  const lookupNip = async (nip: string): Promise<GusResult | null> => {
    const cleanNip = nip.replace(/[^0-9]/g, '');
    if (cleanNip.length !== 10) {
      options?.onError?.('NIP musi mieć 10 cyfr');
      return null;
    }

    setLoading(true);
    try {
      if (options?.supabase) {
        // Use GUS BIR API via edge function
        const { data, error } = await options.supabase.functions.invoke('gus-lookup', {
          body: { nip: cleanNip },
        });

        if (error) throw new Error('Błąd połączenia z GUS');

        const gusData = data as {
          name?: string;
          street?: string;
          postalCode?: string;
          city?: string;
          regon?: string;
          error?: string;
        };

        if (gusData.error) throw new Error(gusData.error);

        const result: GusResult = {
          name: gusData.name || '',
          street: gusData.street || '',
          postalCode: gusData.postalCode || '',
          city: gusData.city || '',
          regon: gusData.regon,
        };
        options?.onSuccess?.(result);
        return result;
      }

      // Fallback: Biała Lista VAT (direct, no edge function needed)
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${cleanNip}?date=${today}`);
      if (!res.ok) throw new Error('Nie znaleziono podmiotu');
      const json = await res.json();
      const subject = json?.result?.subject;
      if (!subject) throw new Error('Brak danych');

      const addr = subject.residenceAddress || subject.workingAddress || '';
      let street = '';
      let postalCode = '';
      let city = '';

      if (typeof addr === 'string') {
        const parts = addr.split(',').map((s: string) => s.trim());
        if (parts.length >= 2) {
          street = parts[0];
          const cityPart = parts[parts.length - 1];
          const pcMatch = cityPart.match(/(\d{2}-\d{3})\s*(.*)/);
          if (pcMatch) {
            postalCode = pcMatch[1];
            city = pcMatch[2];
          } else {
            city = cityPart;
          }
        } else {
          street = addr;
        }
      }

      const result: GusResult = { name: subject.name || '', street, postalCode, city };
      options?.onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      options?.onError?.((err as Error).message || 'Błąd pobierania danych');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookupNip, loading };
}
