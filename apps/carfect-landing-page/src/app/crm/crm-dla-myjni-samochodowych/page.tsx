import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import CrmMyjnia from '@/components/pages/CrmMyjnia';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('crm-dla-myjni-samochodowych', {
    title: 'CRM dla Myjni Samochodowej – Oprogramowanie dla Małych i Średnich Myjni',
    description: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, SMS. Zacznij za 129 zł/msc.',
    canonical: 'https://carfect.pl/crm/crm-dla-myjni-samochodowych',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('crm-dla-myjni-samochodowych');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
        { name: 'CRM dla myjni', href: '/crm/crm-dla-myjni-samochodowych' },
      ]}
      fallback={<CrmMyjnia />}
    />
  );
}
