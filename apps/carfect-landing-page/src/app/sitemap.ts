import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://carfect.pl';

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

  // Get all blog posts dynamically
  const blogPosts = getAllPosts();
  const blogRoutes = blogPosts.map(post => `/blog/${post.slug}`);

  const allRoutes = [...staticRoutes, ...blogRoutes];

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : route.startsWith('/blog/') ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : route.startsWith('/crm/') || route.startsWith('/funkcje/') ? 0.8 : 0.6,
  }));
}
