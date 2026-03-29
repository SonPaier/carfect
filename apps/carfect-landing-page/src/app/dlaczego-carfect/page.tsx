import type { Metadata } from 'next';
import DlaczegoCarfectPage from '@/components/pages/DlaczegoCarfectPage';

export const metadata: Metadata = {
  title: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
  description: 'Poznaj historię Carfect i dowiedz się dlaczego nasz CRM jest idealny dla myjni i detailingu. System tworzony wspólnie z właścicielami firm z branży.',
  alternates: { canonical: 'https://carfect.pl/dlaczego-carfect' },
  openGraph: {
    title: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
    description: 'Poznaj historię Carfect i dowiedz się dlaczego nasz CRM jest idealny dla myjni i detailingu. System tworzony wspólnie z właścicielami firm z branży.',
    url: 'https://carfect.pl/dlaczego-carfect',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dlaczego Carfect? – System Stworzony z Doświadczonymi Detailerami',
    description: 'Poznaj historię Carfect i dowiedz się dlaczego nasz CRM jest idealny dla myjni i detailingu. System tworzony wspólnie z właścicielami firm z branży.',
  },
};

export default function Page() {
  return <DlaczegoCarfectPage />;
}
