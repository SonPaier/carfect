import type { Metadata } from 'next';
import DlaczegoCarfectPage from '@/components/pages/DlaczegoCarfectPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
  description: 'Poznaj historię Carfect i dowiedz się dlaczego nasz CRM jest idealny dla myjni i detailingu. System tworzony wspólnie z właścicielami firm z branży.',
  alternates: {
    canonical: 'https://carfect.pl/dlaczego-carfect',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Dlaczego Carfect', href: '/dlaczego-carfect' },
      ]} />
      <DlaczegoCarfectPage />
    </>
  );
}
