import type { Metadata } from 'next';
import PlaceholderPage from '@/components/pages/PlaceholderPage';

export const metadata: Metadata = {
  title: 'Umów Prezentację Carfect – Bezpłatne Demo Systemu CRM',
  description: 'Umów bezpłatną prezentację systemu Carfect. Pokażemy Ci jak CRM dla myjni i detailingu może usprawnić Twój biznes. Bez zobowiązań.',
  alternates: { canonical: 'https://carfect.pl/umow-prezentacje' },
};

export default function Page() {
  return <PlaceholderPage />;
}
