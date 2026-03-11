import type { Metadata } from 'next';
import PrivacyPolicy from '@/components/pages/PrivacyPolicy';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Polityka Prywatności',
  description: 'Polityka prywatności serwisu Carfect.pl. Informacje o przetwarzaniu danych osobowych, plikach cookies i prawach użytkowników.',
  alternates: {
    canonical: 'https://carfect.pl/polityka-prywatnosci',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Polityka prywatności', href: '/polityka-prywatnosci' },
      ]} />
      <PrivacyPolicy />
    </>
  );
}
