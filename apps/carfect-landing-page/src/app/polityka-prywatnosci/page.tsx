import type { Metadata } from 'next';
import PrivacyPolicy from '@/components/pages/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Polityka Prywatności',
  description: 'Polityka prywatności serwisu Carfect.pl.',
  alternates: { canonical: 'https://carfect.pl/polityka-prywatnosci' },
  openGraph: {
    title: 'Polityka Prywatności',
    description: 'Polityka prywatności serwisu Carfect.pl.',
    url: 'https://carfect.pl/polityka-prywatnosci',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polityka Prywatności',
    description: 'Polityka prywatności serwisu Carfect.pl.',
  },
};

export default function Page() {
  return <PrivacyPolicy />;
}
