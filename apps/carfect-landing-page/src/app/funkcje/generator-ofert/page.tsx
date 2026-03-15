import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import GeneratorOfert from '@/components/pages/GeneratorOfert';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-generator-ofert', {
    title: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
    description: 'Twórz profesjonalne oferty detailingowe w kilka minut. Gotowe szablony, automatyczne wyceny i wysyłka do klienta prosto z systemu Carfect.',
    canonical: 'https://carfect.pl/funkcje/generator-ofert',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-generator-ofert');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Generator ofert', href: '/funkcje/generator-ofert' },
      ]}
      fallback={<GeneratorOfert />}
    />
  );
}
