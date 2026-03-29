import type { Metadata } from 'next';
import KalendarzRezerwacji from '@/components/pages/KalendarzRezerwacji';

export const metadata: Metadata = {
  title: 'Kalendarz Rezerwacji dla Myjni i Detailingu',
  description: 'Kalendarz rezerwacji online dla myjni samochodowych i studiów detailingu. Zarządzaj terminami, stanowiskami i dostępnością w jednym widoku.',
  alternates: { canonical: 'https://carfect.pl/funkcje/kalendarz-rezerwacji' },
};

export default function Page() {
  return <KalendarzRezerwacji />;
}
