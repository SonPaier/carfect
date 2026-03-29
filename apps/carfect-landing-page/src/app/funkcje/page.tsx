import type { Metadata } from 'next';
import FunkcjePage from '@/components/pages/FunkcjePage';

export const metadata: Metadata = {
  title: 'Funkcje CRM dla Myjni i Detailingu – Wszystkie Narzędzia w Jednym Systemie',
  description: 'Przegląd funkcji Carfect: kalendarz rezerwacji, SMS przypomnienia, generator ofert, analityka, zarządzanie zespołem i więcej. Sprawdź co zyskujesz.',
  alternates: { canonical: 'https://carfect.pl/funkcje' },
  openGraph: {
    title: 'Funkcje CRM dla Myjni i Detailingu – Wszystkie Narzędzia w Jednym Systemie',
    description: 'Przegląd funkcji Carfect: kalendarz rezerwacji, SMS przypomnienia, generator ofert, analityka, zarządzanie zespołem i więcej. Sprawdź co zyskujesz.',
    url: 'https://carfect.pl/funkcje',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Funkcje CRM dla Myjni i Detailingu – Wszystkie Narzędzia w Jednym Systemie',
    description: 'Przegląd funkcji Carfect: kalendarz rezerwacji, SMS przypomnienia, generator ofert, analityka, zarządzanie zespołem i więcej. Sprawdź co zyskujesz.',
  },
};

export default function Page() {
  return <FunkcjePage />;
}
