import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import BlogPostLayout from '@/components/blog/BlogPostLayout';
import { getAllPostSlugs, getPostBySlug } from '@/lib/blog';
import { urlFor } from '@/lib/sanity/image';
import { client } from '@/lib/sanity/client';
import { siteSettingsQuery } from '@/lib/sanity/queries';
import type { SiteSettings } from '@/types/sanity';

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post nie znaleziony',
    };
  }

  const baseUrl = 'https://carfect.pl';
  const postUrl = `${baseUrl}/blog/${post.slug.current}`;
  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt;
  const ogImage = post.seo?.ogImage || post.coverImage;
  const imageUrl = ogImage ? urlFor(ogImage).width(1200).height(630).url() : undefined;

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
      publishedTime: post.publishedAt,
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
  const [post, settings] = await Promise.all([
    getPostBySlug(slug),
    client.fetch<SiteSettings | null>(siteSettingsQuery, {}, { next: { tags: ['settings'] } }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Breadcrumbs items={[
        { name: 'Strona główna', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: post.title, href: `/blog/${post.slug.current}` },
      ]} />
      <BlogPostLayout post={post} settings={settings || undefined} />
    </>
  );
}
