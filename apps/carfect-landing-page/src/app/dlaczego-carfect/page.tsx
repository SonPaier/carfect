import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import DlaczegoCarfectPage from '@/components/pages/DlaczegoCarfectPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('dlaczego-carfect', {
    title: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
    description: 'Poznaj historię Carfect i dowiedz się dlaczego nasz CRM jest idealny dla myjni i detailingu. System tworzony wspólnie z właścicielami firm z branży.',
    canonical: 'https://carfect.pl/dlaczego-carfect',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('dlaczego-carfect');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Dlaczego Carfect', href: '/dlaczego-carfect' },
      ]}
      fallback={<DlaczegoCarfectPage />}
    />
  );
}
