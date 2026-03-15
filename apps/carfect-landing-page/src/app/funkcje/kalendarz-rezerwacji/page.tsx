import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import KalendarzRezerwacji from '@/components/pages/KalendarzRezerwacji';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-kalendarz-rezerwacji', {
    title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
    description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
    canonical: 'https://carfect.pl/funkcje/kalendarz-rezerwacji',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-kalendarz-rezerwacji');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Kalendarz rezerwacji', href: '/funkcje/kalendarz-rezerwacji' },
      ]}
      fallback={<KalendarzRezerwacji />}
    />
  );
}
