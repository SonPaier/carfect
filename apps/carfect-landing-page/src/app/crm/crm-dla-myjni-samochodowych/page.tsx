import type { Metadata } from 'next';
import CrmMyjnia from '@/components/pages/CrmMyjnia';

export const metadata: Metadata = {
  title: 'CRM dla Myjni Samochodowej – Oprogramowanie dla Małych i Średnich Myjni',
  description: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, SMS. Zacznij za 129 zł/msc.',
  alternates: { canonical: 'https://carfect.pl/crm/crm-dla-myjni-samochodowych' },
  openGraph: {
    title: 'CRM dla Myjni Samochodowej – Oprogramowanie dla Małych i Średnich Myjni',
    description: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, SMS. Zacznij za 129 zł/msc.',
    url: 'https://carfect.pl/crm/crm-dla-myjni-samochodowych',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRM dla Myjni Samochodowej – Oprogramowanie dla Małych i Średnich Myjni',
    description: 'System CRM dedykowany dla myjni ręcznych. Rezerwacje, kalendarz, baza klientów, SMS. Zacznij za 129 zł/msc.',
  },
};

export default function Page() {
  return <CrmMyjnia />;
}
