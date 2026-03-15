import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'quoteSection',
  title: 'Sekcja Cytat',
  type: 'object',
  fields: [
    defineField({ name: 'text', title: 'Treść cytatu', type: 'text', rows: 4, validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Autor', type: 'string' }),
    defineField({ name: 'role', title: 'Rola / stanowisko', type: 'string' }),
    defineField({ name: 'company', title: 'Firma', type: 'string' }),
  ],
  preview: {
    select: { title: 'text', subtitle: 'author' },
    prepare: ({ title, subtitle }) => ({
      title: title ? (title.length > 60 ? title.slice(0, 60) + '...' : title) : 'Cytat',
      subtitle: subtitle || 'Sekcja Cytat',
    }),
  },
});
