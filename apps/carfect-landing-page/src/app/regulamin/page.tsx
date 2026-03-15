import type { Metadata } from 'next';
import { client } from '@/lib/sanity/client';
import { legalPageBySlugQuery, siteSettingsQuery } from '@/lib/sanity/queries';
import type { LegalPage, SiteSettings } from '@/types/sanity';
import { PortableText } from '@portabletext/react';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import HeaderClient from '@/components/landing/HeaderClient';
import FooterServer from '@/components/landing/FooterServer';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page: LegalPage | null = await client.fetch(legalPageBySlugQuery, { slug: 'regulamin' }, { next: { tags: ['sanity'] } });

  return {
    title: page?.seo?.metaTitle || 'Regulamin Serwisu',
    description: page?.seo?.metaDescription || 'Regulamin korzystania z serwisu Carfect.pl.',
    alternates: { canonical: 'https://carfect.pl/regulamin' },
    robots: page?.seo?.noIndex ? { index: false } : undefined,
  };
}

export default async function Page() {
  const [page, settings] = await Promise.all([
    client.fetch<LegalPage | null>(legalPageBySlugQuery, { slug: 'regulamin' }, { next: { tags: ['sanity'] } }),
    client.fetch<SiteSettings | null>(siteSettingsQuery, {}, { next: { tags: ['settings'] } }),
  ]);

  // Fallback to old component if no Sanity content
  if (!page) {
    const TermsOfService = (await import('@/components/pages/TermsOfService')).default;
    return (
      <>
        <Breadcrumbs items={[
          { name: 'Strona główna', href: '/' },
          { name: 'Regulamin', href: '/regulamin' },
        ]} />
        <TermsOfService />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderClient settings={settings || undefined} />
      <main className="flex-1 pt-24">
        <Breadcrumbs items={[
          { name: 'Strona główna', href: '/' },
          { name: page.title, href: '/regulamin' },
        ]} />

        <section className="py-10 md:py-14">
          <div className="container px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 max-w-3xl mx-auto">{page.title}</h1>
            {page.lastUpdated && (
              <p className="text-sm text-muted-foreground mb-8 max-w-3xl mx-auto">
                Ostatnia aktualizacja: {new Date(page.lastUpdated).toLocaleDateString('pl-PL')}
              </p>
            )}
            <article className="max-w-3xl mx-auto prose prose-lg prose-slate dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 prose-p:leading-relaxed prose-a:text-primary max-w-none">
              {page.body && <PortableText value={page.body} />}
            </article>
          </div>
        </section>
      </main>
      <FooterServer settings={settings || undefined} />
    </div>
  );
}
