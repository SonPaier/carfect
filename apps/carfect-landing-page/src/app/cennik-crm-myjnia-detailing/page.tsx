import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import CennikPage from '@/components/pages/CennikPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('cennik-crm-myjnia-detailing', {
    title: 'Cennik – Przejrzyste Plany dla Myjni i Detailingu',
    description: 'Sprawdź cennik Carfect CRM. Przejrzyste plany dopasowane do wielkości myjni i studia detailingu. Bez ukrytych kosztów, z bezpłatnym okresem próbnym.',
    canonical: 'https://carfect.pl/cennik-crm-myjnia-detailing',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('cennik-crm-myjnia-detailing');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Cennik', href: '/cennik-crm-myjnia-detailing' },
      ]}
      fallback={<CennikPage />}
    />
  );
}
