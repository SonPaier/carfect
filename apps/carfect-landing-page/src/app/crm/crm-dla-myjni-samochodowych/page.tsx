import type { Metadata } from 'next';
import CrmMyjnia from '@/components/pages/CrmMyjnia';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'CRM dla Myjni Samochodowej – Oprogramowanie dla Małych i Średnich Myjni',
  description: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, SMS. Zacznij za 129 zł/msc.',
  alternates: {
    canonical: 'https://carfect.pl/crm/crm-dla-myjni-samochodowych',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'CRM', href: '/crm' },
        { name: 'CRM dla myjni', href: '/crm/crm-dla-myjni-samochodowych' },
      ]} />
      <CrmMyjnia />
    </>
  );
}
