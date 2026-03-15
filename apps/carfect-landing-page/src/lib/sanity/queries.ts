import { groq } from 'next-sanity';

// Site settings (singleton)
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    siteName,
    logo,
    defaultSeo,
    footer,
    header,
    gaId,
    cookieBanner,
    contact
  }
`;

// Page by slug
export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    title,
    slug,
    seo,
    sections[] {
      _type,
      _key,
      ...
    }
  }
`;

// All pages (for sitemap)
export const allPagesQuery = groq`
  *[_type == "page"] {
    slug,
    _updatedAt
  }
`;

// Blog posts list
export const allBlogPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    title,
    slug,
    excerpt,
    coverImage,
    category->{title, slug},
    author,
    publishedAt,
    featured
  }
`;

// Single blog post
export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    title,
    slug,
    excerpt,
    coverImage,
    category->{title, slug},
    author,
    publishedAt,
    featured,
    body,
    seo
  }
`;

// All blog post slugs (for static generation)
export const allBlogPostSlugsQuery = groq`
  *[_type == "blogPost"] {
    "slug": slug.current
  }
`;

// Blog categories
export const allBlogCategoriesQuery = groq`
  *[_type == "blogCategory"] | order(title asc) {
    title,
    slug
  }
`;

// Pricing config (singleton)
export const pricingConfigQuery = groq`
  *[_type == "pricingConfig"][0] {
    pricePerStation,
    currency,
    currencyCode,
    labels,
    yearlyDiscountPercent,
    additionalModules
  }
`;

// Case study by slug
export const caseStudyBySlugQuery = groq`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    title,
    slug,
    seo,
    heroTitle,
    heroHighlight,
    heroSubtitle,
    coverImage,
    client,
    challenge,
    solution,
    metrics,
    results,
    benefitCards,
    ctaSection
  }
`;

// All case studies
export const allCaseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(_createdAt desc) {
    title,
    slug,
    heroTitle,
    heroHighlight,
    coverImage,
    client { name, logo },
    metrics
  }
`;

// All case study slugs
export const allCaseStudySlugsQuery = groq`
  *[_type == "caseStudy"] {
    "slug": slug.current
  }
`;

// Legal page by slug
export const legalPageBySlugQuery = groq`
  *[_type == "legalPage" && slug.current == $slug][0] {
    title,
    slug,
    seo,
    body,
    lastUpdated
  }
`;

// All legal pages
export const allLegalPagesQuery = groq`
  *[_type == "legalPage"] {
    slug,
    _updatedAt
  }
`;

// Featured blog posts
export const featuredBlogPostsQuery = groq`
  *[_type == "blogPost" && featured == true] | order(publishedAt desc) [0...3] {
    title,
    slug,
    excerpt,
    coverImage,
    category->{title, slug},
    author,
    publishedAt
  }
`;
