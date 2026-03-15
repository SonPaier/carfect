import type { PageSection } from '@/types/sanity';
import type { PricingConfig, SiteSettings } from '@/types/sanity';
import HeroSection from './sections/HeroSection';
import AppPreviewSection from './sections/AppPreviewSection';
import BenefitsZigZagSection from './sections/BenefitsZigZagSection';
import BenefitsSectionComponent from './sections/BenefitsSection';
import TestimonialsSectionComponent from './sections/TestimonialsSection';
import PricingSectionComponent from './sections/PricingSection';
import CtaSectionComponent from './sections/CtaSection';
import FeatureDetailSectionComponent from './sections/FeatureDetailSection';
import RichTextSectionComponent from './sections/RichTextSection';
import IconCardsSectionComponent from './sections/IconCardsSection';
import ComparisonTableSectionComponent from './sections/ComparisonTableSection';
import MetricsSectionComponent from './sections/MetricsSection';
import RelatedFeaturesSectionComponent from './sections/RelatedFeaturesSection';
import QuoteSectionComponent from './sections/QuoteSection';
import ScrollFadeIn from '@/components/landing/ScrollFadeIn';

interface SectionRendererProps {
  sections: PageSection[];
  pricingConfig?: PricingConfig;
  settings?: SiteSettings;
}

const sectionComponents: Record<string, React.ComponentType<{ data: any; pricingConfig?: PricingConfig; settings?: SiteSettings }>> = {
  heroSection: HeroSection,
  appPreviewSection: AppPreviewSection,
  benefitsZigZagSection: BenefitsZigZagSection,
  benefitsSection: BenefitsSectionComponent,
  testimonialsSection: TestimonialsSectionComponent,
  pricingSection: PricingSectionComponent,
  ctaSection: CtaSectionComponent,
  featureDetailSection: FeatureDetailSectionComponent,
  richTextSection: RichTextSectionComponent,
  iconCardsSection: IconCardsSectionComponent,
  comparisonTableSection: ComparisonTableSectionComponent,
  metricsSection: MetricsSectionComponent,
  relatedFeaturesSection: RelatedFeaturesSectionComponent,
  quoteSection: QuoteSectionComponent,
};

export default function SectionRenderer({ sections, pricingConfig, settings }: SectionRendererProps) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((section, index) => {
        const Component = sectionComponents[section._type];
        if (!Component) {
          console.warn(`Unknown section type: ${section._type}`);
          return null;
        }

        // First section (usually hero) doesn't need fade-in
        if (index === 0) {
          return <Component key={section._key} data={section} pricingConfig={pricingConfig} settings={settings} />;
        }

        return (
          <ScrollFadeIn key={section._key} delay={0.1}>
            <Component data={section} pricingConfig={pricingConfig} settings={settings} />
          </ScrollFadeIn>
        );
      })}
    </>
  );
}
