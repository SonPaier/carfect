import type { Metadata } from 'next';
import CrmPage from '@/components/pages/CrmPage';

export const metadata: Metadata = {
  title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
  description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
  alternates: { canonical: 'https://carfect.pl/crm' },
  openGraph: {
    title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
    description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
    url: 'https://carfect.pl/crm',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM dla Myjni i Detailingu – Zarządzaj Firmą w Jednym Miejscu',
    description: 'Poznaj system CRM Carfect stworzony specjalnie dla myjni samochodowych i studiów detailingu. Rezerwacje, klienci, oferty i raporty w jednym narzędziu.',
  },
};

export default function Page() {
  return <CrmPage />;
}
