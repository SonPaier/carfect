import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import BlogPostLayout from '@/components/blog/BlogPostLayout';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';

export function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post nie znaleziony',
    };
  }

  const baseUrl = 'https://carfect.pl';
  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const title = post.title;
  const description = post.description;
  const imageUrl = post.image || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title,
      description,
      url: postUrl,
      siteName: 'Carfect.pl',
      locale: 'pl_PL',
      type: 'article',
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: post.title, href: `/blog/${post.slug}` },
      ]} />
      <BlogPostLayout post={post} />
    </>
  );
}
