import type { MetadataRoute } from 'next';
import { client } from '@/lib/sanity/client';
import { allPagesQuery, allBlogPostsQuery, allCaseStudySlugsQuery, allLegalPagesQuery } from '@/lib/sanity/queries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://carfect.pl';

  const [pages, blogPosts, caseStudies, legalPages] = await Promise.all([
    client.fetch<Array<{ slug: { current: string }; _updatedAt: string }>>(allPagesQuery, {}, { next: { tags: ['pages'] } }),
    client.fetch<Array<{ slug: { current: string }; publishedAt: string }>>(allBlogPostsQuery, {}, { next: { tags: ['blogPost'] } }),
    client.fetch<Array<{ slug: string }>>(allCaseStudySlugsQuery, {}, { next: { tags: ['sanity'] } }),
    client.fetch<Array<{ slug: { current: string }; _updatedAt: string }>>(allLegalPagesQuery, {}, { next: { tags: ['sanity'] } }),
  ]);

  // Static routes that always exist
  const staticRoutes = [
    '',
    '/crm',
    '/crm/crm-dla-myjni-samochodowych',
    '/crm/crm-dla-studia-detailingu',
    '/funkcje',
    '/funkcje/kalendarz-rezerwacji',
    '/funkcje/generator-ofert',
    '/funkcje/sms-przypomnienia',
    '/funkcje/zarzadzanie-zespolem',
    '/funkcje/protokol-przyjecia-pojazdu',
    '/funkcje/analityka-raporty',
    '/cennik-crm-myjnia-detailing',
    '/opinie',
    '/case-studies',
    '/dlaczego-carfect',
    '/kontakt',
    '/umow-prezentacje',
    '/demo',
    '/blog',
    '/polityka-prywatnosci',
    '/regulamin',
  ];

  const blogRoutes = (blogPosts || []).map((post) => `/blog/${post.slug.current}`);
  const caseStudyRoutes = (caseStudies || []).map((cs) => `/case-studies/${cs.slug}`);
  const legalRoutes = (legalPages || []).map((lp) => `/${lp.slug.current}`);

  // Combine all routes, dedup
  const allRoutes = [...new Set([...staticRoutes, ...blogRoutes, ...caseStudyRoutes])];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : route.startsWith('/blog/') ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/crm/') || route.startsWith('/funkcje/') ? 0.8 : 0.6,
  }));
}
