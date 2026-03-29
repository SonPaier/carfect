import type { Metadata } from 'next';
import SmsPrzypomnienia from '@/components/pages/SmsPrzypomnienia';

export const metadata: Metadata = {
  title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
  description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
  alternates: { canonical: 'https://carfect.pl/funkcje/sms-przypomnienia' },
};

export default function Page() {
  return <SmsPrzypomnienia />;
}
