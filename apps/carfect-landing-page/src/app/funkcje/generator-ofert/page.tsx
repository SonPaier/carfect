import type { Metadata } from 'next';
import GeneratorOfert from '@/components/pages/GeneratorOfert';

export const metadata: Metadata = {
  title: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
  description: 'Twórz profesjonalne oferty detailingowe w kilka minut. Gotowe szablony, automatyczne wyceny i wysyłka do klienta prosto z systemu Carfect.',
  alternates: { canonical: 'https://carfect.pl/funkcje/generator-ofert' },
  openGraph: {
    title: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
    description: 'Twórz profesjonalne oferty detailingowe w kilka minut. Gotowe szablony, automatyczne wyceny i wysyłka do klienta prosto z systemu Carfect.',
    url: 'https://carfect.pl/funkcje/generator-ofert',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
    description: 'Twórz profesjonalne oferty detailingowe w kilka minut. Gotowe szablony, automatyczne wyceny i wysyłka do klienta prosto z systemu Carfect.',
  },
};

export default function Page() {
  return <GeneratorOfert />;
}
