import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('opinie', {
    title: 'Opinie Klientów Carfect – Co Mówią Właściciele Myjni i Studiów Detailingu',
    description: 'Przeczytaj opinie właścicieli myjni samochodowych i studiów detailingu o systemie Carfect. Sprawdź jak CRM pomógł im rozwinąć biznes.',
    canonical: 'https://carfect.pl/opinie',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('opinie');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Opinie', href: '/opinie' },
      ]}
      fallback={null}
    />
  );
}
