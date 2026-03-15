import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import ZarzadzanieZespolem from '@/components/pages/ZarzadzanieZespolem';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-zarzadzanie-zespolem', {
    title: 'Zarządzanie Zespołem w Myjni i Detailingu – Grafik i Ewidencja Czasu',
    description: 'Zarządzaj pracownikami myjni i studia detailingu. Grafik pracy, ewidencja czasu, przypisywanie zadań i kontrola wydajności zespołu.',
    canonical: 'https://carfect.pl/funkcje/zarzadzanie-zespolem',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-zarzadzanie-zespolem');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Zarządzanie zespołem', href: '/funkcje/zarzadzanie-zespolem' },
      ]}
      fallback={<ZarzadzanieZespolem />}
    />
  );
}
