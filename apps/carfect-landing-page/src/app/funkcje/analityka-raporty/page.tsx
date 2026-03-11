import type { Metadata } from 'next';
import AnalitykaRaporty from '@/components/pages/AnalitykaRaporty';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Analityka i Raporty dla Myjni i Detailingu – Dane Do Lepszych Decyzji',
  description: 'Raporty sprzedażowe, statystyki klientów i analityka dla myjni samochodowych i studiów detailingu. Podejmuj lepsze decyzje na podstawie danych.',
  alternates: {
    canonical: 'https://carfect.pl/funkcje/analityka-raporty',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Analityka i raporty', href: '/funkcje/analityka-raporty' },
      ]} />
      <AnalitykaRaporty />
    </>
  );
}
