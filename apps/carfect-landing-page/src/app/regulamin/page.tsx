import type { Metadata } from 'next';
import TermsOfService from '@/components/pages/TermsOfService';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu',
  description: 'Regulamin korzystania z serwisu i usług Carfect.pl. Warunki użytkowania systemu CRM dla myjni samochodowych i studiów detailingu.',
  alternates: {
    canonical: 'https://carfect.pl/regulamin',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Regulamin', href: '/regulamin' },
      ]} />
      <TermsOfService />
    </>
  );
}
