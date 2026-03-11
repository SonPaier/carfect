import type { Metadata } from 'next';
import KontaktPage from '@/components/pages/KontaktPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Kontakt – Carfect CRM dla Myjni i Detailingu',
  description: 'Skontaktuj się z zespołem Carfect. Odpowiemy na pytania dotyczące systemu CRM dla myjni samochodowych i studiów detailingu.',
  alternates: {
    canonical: 'https://carfect.pl/kontakt',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Kontakt', href: '/kontakt' },
      ]} />
      <KontaktPage />
    </>
  );
}
