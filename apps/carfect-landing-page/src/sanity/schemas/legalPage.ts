import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'legalPage',
  title: 'Strona prawna',
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
        defineField({ name: 'noIndex', title: 'Nie indeksuj (noindex)', type: 'boolean', initialValue: false }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Treść',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({ name: 'lastUpdated', title: 'Data ostatniej aktualizacji', type: 'date' }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title, subtitle: `/${slug || ''}` }),
  },
});
