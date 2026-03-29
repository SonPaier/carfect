import type { Metadata } from 'next';
import PrivacyPolicy from '@/components/pages/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Polityka Prywatności',
  description: 'Polityka prywatności serwisu Carfect.pl.',
  alternates: { canonical: 'https://carfect.pl/polityka-prywatnosci' },
};

export default function Page() {
  return <PrivacyPolicy />;
}
