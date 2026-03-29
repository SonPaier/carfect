import type { Metadata } from 'next';
import ProtokolPrzyjecia from '@/components/pages/ProtokolPrzyjecia';

export const metadata: Metadata = {
  title: 'Protokół Przyjęcia Pojazdu dla Studia Detailingu – Cyfrowy Protokół ze Zdjęciami',
  description: 'Cyfrowy protokół przyjęcia pojazdu ze zdjęciami dla studia detailingu. Dokumentuj stan auta przed i po usłudze. Chroń się przed reklamacjami.',
  alternates: { canonical: 'https://carfect.pl/funkcje/protokol-przyjecia-pojazdu' },
};

export default function Page() {
  return <ProtokolPrzyjecia />;
}
