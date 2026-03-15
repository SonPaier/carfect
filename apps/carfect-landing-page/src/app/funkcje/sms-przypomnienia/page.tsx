import type { Metadata } from 'next';
import { fetchPageData, fetchPageMetadata } from '@/lib/sanity/fetchPage';
import SanityPageLayout from '@/components/sanity/SanityPageLayout';
import SmsPrzypomnienia from '@/components/pages/SmsPrzypomnienia';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return fetchPageMetadata('funkcje-sms-przypomnienia', {
    title: 'Automatyczne SMS Przypomnienia dla Myjni i Detailingu',
    description: 'Automatyczne przypomnienia SMS o wizytach dla klientów myjni i studia detailingu. Zmniejsz liczbę nieodwołanych wizyt i zwiększ frekwencję.',
    canonical: 'https://carfect.pl/funkcje/sms-przypomnienia',
  });
}

export default async function Page() {
  const { page, settings, pricingConfig } = await fetchPageData('funkcje-sms-przypomnienia');

  return (
    <SanityPageLayout
      page={page}
      settings={settings}
      pricingConfig={pricingConfig}
      breadcrumbs={[
        { name: 'Strona główna', href: '/' },
        { name: 'Funkcje', href: '/funkcje' },
        { name: 'SMS przypomnienia', href: '/funkcje/sms-przypomnienia' },
      ]}
      fallback={<SmsPrzypomnienia />}
    />
  );
}
