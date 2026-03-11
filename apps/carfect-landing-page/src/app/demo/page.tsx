import type { Metadata } from 'next';
import PlaceholderPage from '@/components/pages/PlaceholderPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Demo Carfect – Wypróbuj CRM dla Myjni i Detailingu',
  description: 'Przetestuj system Carfect za darmo. Zobacz jak działa CRM dla myjni samochodowych i studiów detailingu. Bez karty kredytowej, bez zobowiązań.',
  alternates: {
    canonical: 'https://carfect.pl/demo',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Demo', href: '/demo' },
      ]} />
      <PlaceholderPage />
    </>
  );
}
