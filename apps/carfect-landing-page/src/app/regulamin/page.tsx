import type { Metadata } from 'next';
import TermsOfService from '@/components/pages/TermsOfService';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu',
  description: 'Regulamin korzystania z serwisu Carfect.pl.',
  alternates: { canonical: 'https://carfect.pl/regulamin' },
  openGraph: {
    title: 'Regulamin Serwisu',
    description: 'Regulamin korzystania z serwisu Carfect.pl.',
    url: 'https://carfect.pl/regulamin',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regulamin Serwisu',
    description: 'Regulamin korzystania z serwisu Carfect.pl.',
  },
};

export default function Page() {
  return <TermsOfService />;
}
