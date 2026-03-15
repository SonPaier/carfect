import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import CaseStudiesPage from '@/components/pages/CaseStudiesPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('case-studies', {
    title: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
    description: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
    canonical: 'https://carfect.pl/case-studies',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('case-studies');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Case studies', href: '/case-studies' },
      ]}
      fallback={<CaseStudiesPage />}
    />
  );
}
