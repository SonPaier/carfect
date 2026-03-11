import type { Metadata } from 'next';
import ZarzadzanieZespolem from '@/components/pages/ZarzadzanieZespolem';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Zarządzanie Zespołem w Myjni i Detailingu – Grafik i Ewidencja Czasu',
  description: 'Zarządzaj pracownikami myjni i studia detailingu. Grafik pracy, ewidencja czasu, przypisywanie zadań i kontrola wydajności zespołu.',
  alternates: {
    canonical: 'https://carfect.pl/funkcje/zarzadzanie-zespolem',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Zarządzanie zespołem', href: '/funkcje/zarzadzanie-zespolem' },
      ]} />
      <ZarzadzanieZespolem />
    </>
  );
}
