import type { Metadata } from 'next';
import CaseStudiesPage from '@/components/pages/CaseStudiesPage';

export const metadata: Metadata = {
  title: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
  description: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
  alternates: {
    canonical: 'https://carfect.pl/case-studies',
  },
  openGraph: {
    title: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
    description: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
    url: 'https://carfect.pl/case-studies',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARM-CAR Detailing Case Study – Jak Odzyskać 10h Tygodniowo',
    description: 'Case study ARM-CAR Detailing z Gdańska. Zobacz jak Carfect pomógł zwiększyć obroty o 10% i zaoszczędzić 10 godzin tygodniowo.',
  },
};

export default function Page() {
  return <CaseStudiesPage />;
}
