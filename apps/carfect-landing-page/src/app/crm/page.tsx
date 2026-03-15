import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import PlaceholderPage from '@/components/pages/PlaceholderPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('crm', {
    title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
    description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
    canonical: 'https://carfect.pl/crm',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('crm');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
      ]}
      fallback={<PlaceholderPage />}
    />
  );
}
