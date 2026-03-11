import type { Metadata } from 'next';
import Index from '@/components/pages/Index';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://carfect.pl',
  },
};

export default function HomePage() {
  return <Index />;
}
