import type { Metadata } from 'next';
import SmsPrzypomnienia from '@/components/pages/SmsPrzypomnienia';

export const metadata: Metadata = {
  title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
  description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
  alternates: { canonical: 'https://carfect.pl/funkcje/sms-przypomnienia' },
  openGraph: {
    title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
    description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
    url: 'https://carfect.pl/funkcje/sms-przypomnienia',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
    description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
  },
};

export default function Page() {
  return <SmsPrzypomnienia />;
}
