import type { Metadata } from 'next';
import ZarzadzanieZespolem from '@/components/pages/ZarzadzanieZespolem';

export const metadata: Metadata = {
  title: 'Zarządzanie Zespołem w Myjni i Detailingu – Grafik i Ewidencja Czasu',
  description: 'Zarządzaj pracownikami myjni i studia detailingu. Grafik pracy, ewidencja czasu, przypisywanie zadań i kontrola wydajności zespołu.',
  alternates: { canonical: 'https://carfect.pl/funkcje/zarzadzanie-zespolem' },
  openGraph: {
    title: 'Zarządzanie Zespołem w Myjni i Detailingu – Grafik i Ewidencja Czasu',
    description: 'Zarządzaj pracownikami myjni i studia detailingu. Grafik pracy, ewidencja czasu, przypisywanie zadań i kontrola wydajności zespołu.',
    url: 'https://carfect.pl/funkcje/zarzadzanie-zespolem',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zarządzanie Zespołem w Myjni i Detailingu – Grafik i Ewidencja Czasu',
    description: 'Zarządzaj pracownikami myjni i studia detailingu. Grafik pracy, ewidencja czasu, przypisywanie zadań i kontrola wydajności zespołu.',
  },
};

export default function Page() {
  return <ZarzadzanieZespolem />;
}
