import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import ProtokolPrzyjecia from '@/components/pages/ProtokolPrzyjecia';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-protokol-przyjecia-pojazdu', {
    title: 'Protokół Przyjęcia Pojazdu dla Studia Detailingu – Cyfrowy Protokół ze Zdjęciami',
    description: 'Cyfrowy protokół przyjęcia pojazdu ze zdjęciami dla studia detailingu. Dokumentuj stan auta przed i po usłudze. Chroń się przed reklamacjami.',
    canonical: 'https://carfect.pl/funkcje/protokol-przyjecia-pojazdu',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-protokol-przyjecia-pojazdu');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Protokół przyjęcia', href: '/funkcje/protokol-przyjecia-pojazdu' },
      ]}
      fallback={<ProtokolPrzyjecia />}
    />
  );
}
