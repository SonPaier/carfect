import { client } from '@/lib/sanity/client';
import {
  allBlogPostsQuery,
  blogPostBySlugQuery,
  allBlogPostSlugsQuery,
  featuredBlogPostsQuery,
} from '@/lib/sanity/queries';

export interface BlogPost {
  title: string;
  slug: { current: string };
  excerpt: string;
  coverImage: unknown;
  category: { title: string; slug: { current: string } } | null;
  author: string;
  publishedAt: string;
  featured: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: unknown;
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  return client.fetch(allBlogPostsQuery, {}, { next: { tags: ['blogPost'] } });
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  return client.fetch(blogPostBySlugQuery, { slug }, { next: { tags: ['blogPost'] } });
}

export async function getFeaturedPosts(): Promise<BlogPost[]> {
  return client.fetch(featuredBlogPostsQuery, {}, { next: { tags: ['blogPost'] } });
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  return client.fetch(allBlogPostSlugsQuery, {}, { next: { tags: ['blogPost'] } });
}
