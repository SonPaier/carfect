import { client } from '@/lib/sanity/client';
import { pageBySlugQuery, siteSettingsQuery, pricingConfigQuery } from '@/lib/sanity/queries';
import type { SanityPage, SiteSettings, PricingConfig } from '@/types/sanity';

export async function fetchPageData(slug: string) {
  const [page, settings, pricingConfig] = await Promise.all([
    client.fetch<SanityPage | null>(pageBySlugQuery, { slug }, { next: { tags: ['pages'] } }),
    client.fetch<SiteSettings | null>(siteSettingsQuery, {}, { next: { tags: ['settings'] } }),
    client.fetch<PricingConfig | null>(pricingConfigQuery, {}, { next: { tags: ['sanity'] } }),
  ]);

  return {
    page,
    settings: settings || undefined,
    pricingConfig: pricingConfig || undefined,
  };
}

export async function fetchPageMetadata(slug: string, defaults: { title: string; description: string; canonical: string }) {
  const page: SanityPage | null = await client.fetch(pageBySlugQuery, { slug }, { next: { tags: ['pages'] } });

  return {
    title: page?.seo?.metaTitle || defaults.title,
    description: page?.seo?.metaDescription || defaults.description,
    alternates: { canonical: page?.seo?.canonical || defaults.canonical },
    ...(page?.seo?.noIndex ? { robots: { index: false } } : {}),
  };
}
