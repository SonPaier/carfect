import type { Metadata } from 'next';
import CaseStudiesPage from '@/components/pages/CaseStudiesPage';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
  description: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
  alternates: {
    canonical: 'https://carfect.pl/case-studies',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Case studies', href: '/case-studies' },
      ]} />
      <CaseStudiesPage />
    </>
  );
}
