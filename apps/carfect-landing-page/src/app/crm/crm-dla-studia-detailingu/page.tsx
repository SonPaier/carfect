import type { Metadata } from 'next';
import CrmDetailing from '@/components/pages/CrmDetailing';

export const metadata: Metadata = {
  title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
  description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
  alternates: { canonical: 'https://carfect.pl/crm/crm-dla-studia-detailingu' },
};

export default function Page() {
  return <CrmDetailing />;
}
