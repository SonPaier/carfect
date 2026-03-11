import type { Metadata } from 'next';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Funkcje CRM dla Myjni i Detailingu – Wszystkie Narzędzia w Jednym Systemie',
  description: 'Przegląd funkcji Carfect: kalendarz rezerwacji, SMS przypomnienia, generator ofert, analityka, zarządzanie zespołem i więcej. Sprawdź co zyskujesz.',
  alternates: {
    canonical: 'https://carfect.pl/funkcje',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
      ]} />
      <PlaceholderPage />
    </>
  );
}
