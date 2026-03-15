import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import Index from '@/components/pages/Index';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('home', {
    title: 'Carfect.pl - CRM i System Rezerwacji dla Myjni i Detailingu',
    description: 'Skup się na detailingu, chaos zostaw nam. Poznaj CRM i system rezerwacji stworzony przy udziale doświadczonych detailerów i właścicieli myjni samochodowych.',
    canonical: 'https://carfect.pl',
  });
}

export default async function HomePage() {
  const { page, settings, pricingConfig } = await fetchPageData('home');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[]}
      fallback={<Index />}
    />
  );
}
