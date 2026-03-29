import type { Metadata } from 'next';
import CrmDetailing from '@/components/pages/CrmDetailing';

export const metadata: Metadata = {
  title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
  description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
  alternates: { canonical: 'https://carfect.pl/crm/crm-dla-studia-detailingu' },
  openGraph: {
    title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
    description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
    url: 'https://carfect.pl/crm/crm-dla-studia-detailingu',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
    description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
  },
};

export default function Page() {
  return <CrmDetailing />;
}
