import type { Metadata } from 'next';
import SmsPrzypomnienia from '@/components/pages/SmsPrzypomnienia';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
  description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
  alternates: {
    canonical: 'https://carfect.pl/funkcje/sms-przypomnienia',
  },
};

export default function Page() {
  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'SMS przypomnienia', href: '/funkcje/sms-przypomnienia' },
      ]} />
      <SmsPrzypomnienia />
    </>
  );
}
