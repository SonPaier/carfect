import type { Metadata } from 'next';
import CrmPage from '@/components/pages/CrmPage';

export const metadata: Metadata = {
  title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
  description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
  alternates: { canonical: 'https://carfect.pl/crm' },
};

export default function Page() {
  return <CrmPage />;
}
