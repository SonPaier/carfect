import type { PortableTextBlock } from '@portabletext/types';

// Sanity image reference
export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

// SEO
export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: SanityImage;
  canonical?: string;
  noIndex?: boolean;
}

// ─── Section Types ───

export interface HeroSection {
  _type: 'heroSection';
  _key: string;
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  priceNote?: string;
  variant?: 'gradient-dark' | 'gradient-light' | 'simple';
  backgroundImage?: SanityImage;
}

export interface BenefitsSection {
  _type: 'benefitsSection';
  _key: string;
  heading?: string;
  items?: Array<{
    icon?: string;
    title: string;
    description?: string;
    image?: SanityImage;
  }>;
}

export interface TestimonialsSection {
  _type: 'testimonialsSection';
  _key: string;
  heading?: string;
  testimonials?: Array<{
    name: string;
    role?: string;
    company?: string;
    companyUrl?: string;
    location?: string;
    text: string;
    rating?: number;
    avatar?: SanityImage;
    logo?: SanityImage;
  }>;
}

export interface PricingSection {
  _type: 'pricingSection';
  _key: string;
  heading?: string;
  subheading?: string;
  usePricingConfig?: boolean;
  plans?: Array<{
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    ctaText?: string;
    ctaLink?: string;
    highlighted?: boolean;
  }>;
}

export interface CtaSection {
  _type: 'ctaSection';
  _key: string;
  heading: string;
  subheading?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface FeatureDetailSection {
  _type: 'featureDetailSection';
  _key: string;
  heading: string;
  subheading?: string;
  description?: string;
  image?: SanityImage;
  imagePosition?: 'left' | 'right';
  bulletPoints?: string[];
  backgroundVariant?: 'default' | 'muted' | 'gradient';
}

export interface RichTextSection {
  _type: 'richTextSection';
  _key: string;
  heading?: string;
  body?: PortableTextBlock[];
}

export interface AppPreviewSection {
  _type: 'appPreviewSection';
  _key: string;
  heading: string;
  subtitle?: string;
  desktopImage?: SanityImage;
  mobileImage?: SanityImage;
}

export interface BenefitsZigZagSection {
  _type: 'benefitsZigZagSection';
  _key: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  items?: Array<{
    title: string;
    subtitle?: string;
    points?: string[];
    image?: SanityImage;
  }>;
}

export interface IconCardsSection {
  _type: 'iconCardsSection';
  _key: string;
  heading?: string;
  subheading?: string;
  columns?: number;
  items?: Array<{
    icon?: string;
    title: string;
    description?: string;
    link?: string;
  }>;
}

export interface ComparisonTableSection {
  _type: 'comparisonTableSection';
  _key: string;
  heading?: string;
  subheading?: string;
  columnLabels?: string[];
  rows?: Array<{
    feature: string;
    values?: string[];
  }>;
}

export interface MetricsSection {
  _type: 'metricsSection';
  _key: string;
  heading?: string;
  subheading?: string;
  items?: Array<{
    value: string;
    label: string;
    sublabel?: string;
    icon?: string;
  }>;
}

export interface RelatedFeaturesSection {
  _type: 'relatedFeaturesSection';
  _key: string;
  heading?: string;
  items?: Array<{
    icon?: string;
    title: string;
    description?: string;
    href: string;
  }>;
}

export interface QuoteSection {
  _type: 'quoteSection';
  _key: string;
  text: string;
  author?: string;
  role?: string;
  company?: string;
}

export type PageSection =
  | HeroSection
  | BenefitsSection
  | TestimonialsSection
  | PricingSection
  | CtaSection
  | FeatureDetailSection
  | RichTextSection
  | AppPreviewSection
  | BenefitsZigZagSection
  | IconCardsSection
  | ComparisonTableSection
  | MetricsSection
  | RelatedFeaturesSection
  | QuoteSection;

// ─── Document Types ───

export interface SanityPage {
  title: string;
  slug: { current: string };
  seo?: SeoFields;
  sections?: PageSection[];
}

export interface SiteSettings {
  siteName?: string;
  logo?: SanityImage;
  defaultSeo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: SanityImage;
  };
  footer?: {
    email?: string;
    phone?: string;
    address?: string;
    socialLinks?: Array<{
      platform?: string;
      url?: string;
    }>;
  };
  header?: {
    navLinks?: Array<{
      label?: string;
      href?: string;
      children?: Array<{
        label?: string;
        href?: string;
      }>;
    }>;
    ctaText?: string;
    ctaLink?: string;
  };
  gaId?: string;
  cookieBanner?: {
    text?: string;
    acceptText?: string;
    rejectText?: string;
    privacyLink?: string;
  };
  contact?: {
    email?: string;
    phone1?: string;
    phone2?: string;
    address?: string;
    nip?: string;
    companyName?: string;
  };
}

export interface PricingConfig {
  pricePerStation: number;
  currency: string;
  currencyCode: string;
  labels?: {
    perStation?: string;
    perMonth?: string;
    perYear?: string;
    stations?: string;
    station?: string;
    monthly?: string;
    yearly?: string;
    yearlyDiscount?: string;
    totalMonthly?: string;
    totalYearly?: string;
    cta?: string;
  };
  yearlyDiscountPercent?: number;
  additionalModules?: {
    title?: string;
    subtitle?: string;
    items?: Array<{
      icon?: string;
      title: string;
      description?: string;
      price?: string;
      comingSoon?: boolean;
    }>;
  };
}

export interface CaseStudy {
  title: string;
  slug: { current: string };
  seo?: SeoFields;
  heroTitle?: string;
  heroHighlight?: string;
  heroSubtitle?: string;
  coverImage?: SanityImage;
  client?: {
    name?: string;
    description?: string;
    logo?: SanityImage;
  };
  challenge?: {
    heading?: string;
    description?: string;
    image?: SanityImage;
    quote?: string;
    quoteAuthor?: string;
  };
  solution?: {
    heading?: string;
    description?: string;
    image?: SanityImage;
  };
  metrics?: Array<{
    value: string;
    label: string;
    sublabel?: string;
    variant?: 'primary' | 'success' | 'default';
  }>;
  results?: {
    heading?: string;
    items?: Array<{
      icon?: string;
      text: string;
    }>;
  };
  benefitCards?: Array<{
    icon?: string;
    title: string;
    description?: string;
  }>;
  ctaSection?: {
    heading?: string;
    subheading?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

export interface LegalPage {
  title: string;
  slug: { current: string };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    noIndex?: boolean;
  };
  body?: PortableTextBlock[];
  lastUpdated?: string;
}
