import type { Metadata } from 'next';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
  description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
  alternates: {
    canonical: 'https://carfect.pl/crm',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
      ]} />
      <PlaceholderPage />
    </>
  );
}
