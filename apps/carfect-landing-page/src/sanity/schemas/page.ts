import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'page',
  title: 'Strona',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Tytuł', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta tytuł', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta opis', type: 'text', rows: 3 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
        defineField({ name: 'canonical', title: 'Canonical URL', type: 'url' }),
        defineField({ name: 'noIndex', title: 'Nie indeksuj (noindex)', type: 'boolean', initialValue: false }),
      ],
    }),
    defineField({
      name: 'sections',
      title: 'Sekcje',
      type: 'array',
      of: [
        { type: 'heroSection' },
        { type: 'benefitsSection' },
        { type: 'testimonialsSection' },
        { type: 'pricingSection' },
        { type: 'ctaSection' },
        { type: 'featureDetailSection' },
        { type: 'richTextSection' },
        { type: 'appPreviewSection' },
        { type: 'benefitsZigZagSection' },
        { type: 'iconCardsSection' },
        { type: 'comparisonTableSection' },
        { type: 'metricsSection' },
        { type: 'relatedFeaturesSection' },
        { type: 'quoteSection' },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title, subtitle: `/${slug || ''}` }),
  },
});
