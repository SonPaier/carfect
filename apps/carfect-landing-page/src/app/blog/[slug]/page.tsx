import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import BlogPostLayout from '@/components/blog/BlogPostLayout';
import { getAllPosts, getPostBySlug } from '@/lib/blog';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
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
  const absoluteImageUrl = `${baseUrl}${post.image}`;

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: postUrl,
      siteName: 'Carfect.pl',
      locale: 'pl_PL',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      section: post.category,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [absoluteImageUrl],
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
