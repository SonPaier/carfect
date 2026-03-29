import type { Metadata } from 'next';
import GeneratorOfert from '@/components/pages/GeneratorOfert';

export const metadata: Metadata = {
  title: 'Generator Ofert Detailingowych – Twórz Profesjonalne Wyceny w 5 Minut',
  description: 'Twórz profesjonalne oferty detailingowe w kilka minut. Gotowe szablony, automatyczne wyceny i wysyłka do klienta prosto z systemu Carfect.',
  alternates: { canonical: 'https://carfect.pl/funkcje/generator-ofert' },
};

export default function Page() {
  return <GeneratorOfert />;
}
