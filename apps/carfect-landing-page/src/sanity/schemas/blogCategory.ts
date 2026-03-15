import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'blogCategory',
  title: 'Kategoria bloga',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Nazwa', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
});
