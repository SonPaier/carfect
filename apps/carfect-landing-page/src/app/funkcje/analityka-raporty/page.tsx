import type { Metadata } from 'next';
import AnalitykaRaporty from '@/components/pages/AnalitykaRaporty';

export const metadata: Metadata = {
  title: 'Analityka i Raporty dla Myjni i Detailingu – Dane Do Lepszych Decyzji',
  description: 'Raporty sprzedażowe, statystyki klientów i analityka dla myjni samochodowych i studiów detailingu. Podejmuj lepsze decyzje na podstawie danych.',
  alternates: { canonical: 'https://carfect.pl/funkcje/analityka-raporty' },
  openGraph: {
    title: 'Analityka i Raporty dla Myjni i Detailingu – Dane Do Lepszych Decyzji',
    description: 'Raporty sprzedażowe, statystyki klientów i analityka dla myjni samochodowych i studiów detailingu. Podejmuj lepsze decyzje na podstawie danych.',
    url: 'https://carfect.pl/funkcje/analityka-raporty',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analityka i Raporty dla Myjni i Detailingu – Dane Do Lepszych Decyzji',
    description: 'Raporty sprzedażowe, statystyki klientów i analityka dla myjni samochodowych i studiów detailingu. Podejmuj lepsze decyzje na podstawie danych.',
  },
};

export default function Page() {
  return <AnalitykaRaporty />;
}
