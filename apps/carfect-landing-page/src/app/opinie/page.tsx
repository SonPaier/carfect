import type { Metadata } from 'next';
import OpiniePage from '@/components/pages/OpiniePage';

export const metadata: Metadata = {
  title: 'Opinie Klientów Carfect – Co Mówią Właściciele Myjni i Studiów Detailingu',
  description: 'Przeczytaj opinie właścicieli myjni samochodowych i studiów detailingu o systemie Carfect. Sprawdź jak CRM pomógł im rozwinąć biznes.',
  alternates: { canonical: 'https://carfect.pl/opinie' },
};

export default function Page() {
  return <OpiniePage />;
}
