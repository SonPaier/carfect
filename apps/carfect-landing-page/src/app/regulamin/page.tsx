import type { Metadata } from 'next';
import TermsOfService from '@/components/pages/TermsOfService';

export const metadata: Metadata = {
  title: 'Regulamin Serwisu',
  description: 'Regulamin korzystania z serwisu Carfect.pl.',
  alternates: { canonical: 'https://carfect.pl/regulamin' },
};

export default function Page() {
  return <TermsOfService />;
}
