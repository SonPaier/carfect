import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import PlaceholderPage from '@/components/pages/PlaceholderPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('umow-prezentacje', {
    title: 'Umów Prezentację Carfect – Bezpłatne Demo Systemu CRM',
    description: 'Umów bezpłatną prezentację systemu Carfect. Pokażemy Ci jak CRM dla myjni i detailingu może usprawnić Twój biznes. Bez zobowiązań.',
    canonical: 'https://carfect.pl/umow-prezentacje',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('umow-prezentacje');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Umów prezentację', href: '/umow-prezentacje' },
      ]}
      fallback={<PlaceholderPage />}
    />
  );
}
