import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import CrmDetailing from '@/components/pages/CrmDetailing';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('crm-dla-studia-detailingu', {
    title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
    description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
    canonical: 'https://carfect.pl/crm/crm-dla-studia-detailingu',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('crm-dla-studia-detailingu');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
        { name: 'CRM dla detailingu', href: '/crm/crm-dla-studia-detailingu' },
      ]}
      fallback={<CrmDetailing />}
    />
  );
}
