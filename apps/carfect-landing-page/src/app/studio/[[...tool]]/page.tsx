'use client';

import dynamic from 'next/dynamic';

const Studio = dynamic(
  () =>
    Promise.all([
      import('next-sanity/studio'),
      import('../../../../sanity.config'),
    ]).then(([{ NextStudio }, { default: config }]) =>
      function StudioComponent() {
        return <NextStudio config={config} />;
      }
    ),
  { ssr: false, loading: () => <div>Loading Studio...</div> }
);

export default function StudioPage() {
  return <Studio />;
}
