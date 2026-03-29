import type { Metadata } from 'next';
import KontaktPage from '@/components/pages/KontaktPage';

export const metadata: Metadata = {
  title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
  description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
  alternates: { canonical: 'https://carfect.pl/kontakt' },
};

export default function Page() {
  return <KontaktPage />;
}
