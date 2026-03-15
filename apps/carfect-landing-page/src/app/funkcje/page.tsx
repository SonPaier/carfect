import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import PlaceholderPage from '@/components/pages/PlaceholderPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje', {
    title: 'Funkcje CRM dla Myjni i Detailingu – Wszystkie Narzędzia w Jednym Systemie',
    description: 'Przegląd funkcji Carfect: kalendarz rezerwacji, SMS przypomnienia, generator ofert, analityka, zarządzanie zespołem i więcej. Sprawdź co zyskujesz.',
    canonical: 'https://carfect.pl/funkcje',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
      ]}
      fallback={<PlaceholderPage />}
    />
  );
}
