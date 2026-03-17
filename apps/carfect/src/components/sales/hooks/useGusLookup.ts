import { useState } from 'react';
import { toast } from 'sonner';

interface GusResult {
  name: string;
  street: string;
  postalCode: string;
  city: string;
}

export function useGusLookup() {
  const [loading, setLoading] = useState(false);

  const lookupNip = async (nip: string): Promise<GusResult | null> => {
    const cleanNip = nip.replace(/[^0-9]/g, '');
    if (cleanNip.length !== 10) {
      toast.error('NIP musi mieć 10 cyfr');
      return null;
    }

    setLoading(true);
    try {
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
        // Format: "ul. Przykładowa 1, 00-000 Miasto"
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

      toast.success('Dane pobrane z GUS');
      return {
        name: subject.name || '',
        street,
        postalCode,
        city,
      };
    } catch (err: any) {
      toast.error(err.message || 'Błąd pobierania danych');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { lookupNip, loading };
}
