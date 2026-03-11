import type { Metadata } from 'next';
import KalendarzRezerwacji from '@/components/pages/KalendarzRezerwacji';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
  description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
  alternates: {
    canonical: 'https://carfect.pl/funkcje/kalendarz-rezerwacji',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'Kalendarz rezerwacji', href: '/funkcje/kalendarz-rezerwacji' },
      ]} />
      <KalendarzRezerwacji />
    </>
  );
}
