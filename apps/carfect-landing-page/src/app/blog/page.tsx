import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import BlogHero from '@/components/blog/BlogHero';
import BlogGrid from '@/components/blog/BlogGrid';
import { getAllPosts, getFeaturedPost } from '@/lib/blog';

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

export default function BlogPage() {
  const featuredPost = getFeaturedPost();
  const allPosts = getAllPosts();
  const regularPosts = allPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24">
        <Breadcrumbs items={[
          { name: 'Strona główna', href: '/' },
          { name: 'Blog', href: '/blog' },
        ]} />

        {/* Hero Post */}
        {featuredPost && <BlogHero post={featuredPost} />}

        {/* Grid of Posts */}
        <BlogGrid posts={regularPosts} />
      </main>
      <Footer />
    </div>
  );
}
