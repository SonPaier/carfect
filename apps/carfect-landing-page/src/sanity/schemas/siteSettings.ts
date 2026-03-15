import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Ustawienia strony',
  type: 'document',
  fields: [
    defineField({ name: 'siteName', title: 'Nazwa strony', type: 'string' }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({
      name: 'defaultSeo',
      title: 'Domyślne SEO',
      type: 'object',
      fields: [
        defineField({ name: 'metaTitle', title: 'Meta tytuł', type: 'string' }),
        defineField({ name: 'metaDescription', title: 'Meta opis', type: 'text', rows: 3 }),
        defineField({ name: 'ogImage', title: 'OG Image', type: 'image' }),
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Stopka',
      type: 'object',
      fields: [
        defineField({ name: 'email', title: 'Email kontaktowy', type: 'string' }),
        defineField({ name: 'phone', title: 'Telefon', type: 'string' }),
        defineField({ name: 'address', title: 'Adres', type: 'text', rows: 2 }),
        defineField({
          name: 'socialLinks',
          title: 'Linki social media',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'platform', title: 'Platforma', type: 'string' }),
              defineField({ name: 'url', title: 'URL', type: 'url' }),
            ],
          }],
        }),
      ],
    }),
    defineField({
      name: 'header',
      title: 'Nagłówek',
      type: 'object',
      fields: [
        defineField({
          name: 'navLinks',
          title: 'Linki nawigacji',
          type: 'array',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', title: 'Etykieta', type: 'string' }),
              defineField({ name: 'href', title: 'Link', type: 'string' }),
              defineField({
                name: 'children',
                title: 'Podlinki',
                type: 'array',
                of: [{
                  type: 'object',
                  fields: [
                    defineField({ name: 'label', title: 'Etykieta', type: 'string' }),
                    defineField({ name: 'href', title: 'Link', type: 'string' }),
                  ],
                }],
              }),
            ],
            preview: { select: { title: 'label' } },
          }],
        }),
        defineField({ name: 'ctaText', title: 'Tekst CTA', type: 'string' }),
        defineField({ name: 'ctaLink', title: 'Link CTA', type: 'string' }),
      ],
    }),
    defineField({ name: 'gaId', title: 'Google Analytics ID', type: 'string' }),
    defineField({
      name: 'cookieBanner',
      title: 'Baner cookies',
      type: 'object',
      fields: [
        defineField({ name: 'text', title: 'Treść', type: 'text', rows: 3 }),
        defineField({ name: 'acceptText', title: 'Tekst przycisku akceptuj', type: 'string', initialValue: 'Akceptuję' }),
        defineField({ name: 'rejectText', title: 'Tekst przycisku odrzuć', type: 'string', initialValue: 'Odrzuć' }),
        defineField({ name: 'privacyLink', title: 'Link do polityki prywatności', type: 'string' }),
      ],
    }),
    defineField({
      name: 'contact',
      title: 'Dane kontaktowe',
      type: 'object',
      fields: [
        defineField({ name: 'email', title: 'Email', type: 'string' }),
        defineField({ name: 'phone1', title: 'Telefon 1', type: 'string' }),
        defineField({ name: 'phone2', title: 'Telefon 2', type: 'string' }),
        defineField({ name: 'address', title: 'Adres', type: 'text', rows: 2 }),
        defineField({ name: 'nip', title: 'NIP', type: 'string' }),
        defineField({ name: 'companyName', title: 'Nazwa firmy', type: 'string' }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Ustawienia strony' }),
  },
});
