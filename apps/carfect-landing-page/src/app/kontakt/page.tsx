import type { Metadata } from 'next';
import KontaktPage from '@/components/pages/KontaktPage';

export const metadata: Metadata = {
  title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
  description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
  alternates: { canonical: 'https://carfect.pl/kontakt' },
  openGraph: {
    title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
    description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
    url: 'https://carfect.pl/kontakt',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
    description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
  },
};

export default function Page() {
  return <KontaktPage />;
}
