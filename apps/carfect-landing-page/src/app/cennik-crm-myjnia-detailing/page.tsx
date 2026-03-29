import type { Metadata } from 'next';
import CennikPage from '@/components/pages/CennikPage';

export const metadata: Metadata = {
  title: 'Cennik – Przejrzyste Plany dla Myjni i Detailingu',
  description: 'Sprawdź cennik Carfect CRM. Przejrzyste plany dopasowane do wielkości myjni i studia detailingu. Bez ukrytych kosztów, z bezpłatnym okresem próbnym.',
  alternates: { canonical: 'https://carfect.pl/cennik-crm-myjnia-detailing' },
};

export default function Page() {
  return <CennikPage />;
}
