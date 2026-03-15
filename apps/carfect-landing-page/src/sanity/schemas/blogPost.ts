import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'blogPost',
  title: 'Artykuł blogowy',
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
    defineField({ name: 'excerpt', title: 'Streszczenie', type: 'text', rows: 3 }),
    defineField({
      name: 'coverImage',
      title: 'Zdjęcie główne',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'category',
      title: 'Kategoria',
      type: 'reference',
      to: [{ type: 'blogCategory' }],
    }),
    defineField({ name: 'author', title: 'Autor', type: 'string' }),
    defineField({ name: 'publishedAt', title: 'Data publikacji', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'featured', title: 'Wyróżniony', type: 'boolean', initialValue: false }),
    defineField({
      name: 'body',
      title: 'Treść',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true } },
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta tytuł', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta opis', type: 'text', rows: 3 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
      ],
    }),
  ],
  orderings: [
    { title: 'Data publikacji (najnowsze)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', date: 'publishedAt', media: 'coverImage' },
    prepare: ({ title, date, media }) => ({
      title,
      subtitle: date ? new Date(date).toLocaleDateString('pl-PL') : 'Brak daty',
      media,
    }),
  },
});
