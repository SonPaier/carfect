import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import AnalitykaRaporty from '@/components/pages/AnalitykaRaporty';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-analityka-raporty', {
    title: 'Analityka i Raporty dla Myjni i Detailingu – Dane Do Lepszych Decyzji',
    description: 'Raporty sprzedażowe, statystyki klientów i analityka dla myjni samochodowych i studiów detailingu. Podejmuj lepsze decyzje na podstawie danych.',
    canonical: 'https://carfect.pl/funkcje/analityka-raporty',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-analityka-raporty');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Analityka i raporty', href: '/funkcje/analityka-raporty' },
      ]}
      fallback={<AnalitykaRaporty />}
    />
  );
}
