import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import HeaderClient from '@/components/landing/HeaderClient';
import FooterServer from '@/components/landing/FooterServer';
import { client } from '@/lib/sanity/client';
import { siteSettingsQuery } from '@/lib/sanity/queries';
import type { SiteSettings } from '@/types/sanity';
import BlogHero from '@/components/blog/BlogHero';
import BlogGrid from '@/components/blog/BlogGrid';
import { getAllPosts, getFeaturedPosts } from '@/lib/blog';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Blog – Porady dla Właścicieli Myjni i Studiów Detailingu',
  description: 'Artykuły i porady jak prowadzić myjnię samochodową lub studio detailingu. Zarządzanie klientami, rezerwacje, marketing i rozwój biznesu.',
  alternates: {
    canonical: 'https://carfect.pl/blog',
  },
  openGraph: {
    title: 'Blog – Porady dla Właścicieli Myjni i Studiów Detailingu',
    description: 'Artykuły i porady jak prowadzić myjnię samochodową lub studio detailingu. Zarządzanie klientami, rezerwacje, marketing i rozwój biznesu.',
    url: 'https://carfect.pl/blog',
    siteName: 'Carfect.pl',
    locale: 'pl_PL',
  },
  twitter: {
    card: 'summary',
    title: 'Blog – Porady dla Właścicieli Myjni i Studiów Detailingu',
    description: 'Artykuły i porady jak prowadzić myjnię samochodową lub studio detailingu. Zarządzanie klientami, rezerwacje, marketing i rozwój biznesu.',
  },
};

export default async function BlogPage() {
  const [featuredPosts, allPosts, settings] = await Promise.all([
    getFeaturedPosts(),
    getAllPosts(),
    client.fetch<SiteSettings | null>(siteSettingsQuery, {}, { next: { tags: ['settings'] } }),
  ]);
  const featuredPost = featuredPosts[0] || allPosts[0] || null;
  const regularPosts = allPosts.filter(
    (post) => post.slug.current !== featuredPost?.slug.current
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderClient settings={settings || undefined} />
      <main className="flex-1 pt-24">
        <Breadcrumbs items={[
          { name: 'Strona główna', href: '/' },
          { name: 'Blog', href: '/blog' },
        ]} />

        {featuredPost && <BlogHero post={featuredPost} />}

        <BlogGrid posts={regularPosts} />
      </main>
      <FooterServer settings={settings || undefined} />
    </div>
  );
}
