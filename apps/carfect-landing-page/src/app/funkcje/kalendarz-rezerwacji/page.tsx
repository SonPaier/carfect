import type { Metadata } from 'next';
import KalendarzRezerwacji from '@/components/pages/KalendarzRezerwacji';

export const metadata: Metadata = {
  title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
  description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
  alternates: { canonical: 'https://carfect.pl/funkcje/kalendarz-rezerwacji' },
  openGraph: {
    title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
    description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
    url: 'https://carfect.pl/funkcje/kalendarz-rezerwacji',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
    description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
  },
};

export default function Page() {
  return <KalendarzRezerwacji />;
}
