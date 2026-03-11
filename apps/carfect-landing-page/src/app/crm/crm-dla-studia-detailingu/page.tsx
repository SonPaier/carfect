import type { Metadata } from 'next';
import CrmDetailing from '@/components/pages/CrmDetailing';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'CRM dla Studia Detailingu – System Rezerwacji i Ofert Detailingowych',
  description: 'System CRM dedykowany dla studiów detailingu. Generator ofert, protokoły przyjęcia, kalendarz rezerwacji i baza klientów w jednym miejscu.',
  alternates: {
    canonical: 'https://carfect.pl/crm/crm-dla-studia-detailingu',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
        { name: 'CRM dla detailingu', href: '/crm/crm-dla-studia-detailingu' },
      ]} />
      <CrmDetailing />
    </>
  );
}
