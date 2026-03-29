import type { Metadata } from 'next';
import Index from '@/components/pages/Index';

export const metadata: Metadata = {
  title: 'Carfect.pl - CRM i System Rezerwacji dla Myjni i Detailingu',
  description: 'Skup się na detailingu, chaos zostaw nam. Poznaj CRM i system rezerwacji stworzony przy udziale doświadczonych detailerów i właścicieli myjni samochodowych.',
  alternates: { canonical: 'https://carfect.pl' },
};

export default function HomePage() {
  return <Index />;
}
