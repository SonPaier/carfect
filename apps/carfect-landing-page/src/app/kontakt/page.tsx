import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import KontaktPage from '@/components/pages/KontaktPage';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('kontakt', {
    title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
    description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
    canonical: 'https://carfect.pl/kontakt',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('kontakt');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Kontakt', href: '/kontakt' },
      ]}
      fallback={<KontaktPage />}
    />
  );
}
