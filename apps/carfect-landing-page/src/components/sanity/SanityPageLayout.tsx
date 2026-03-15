import Breadcrumbs from '@/components/seo/Breadcrumbs';
import HeaderClient from '@/components/landing/HeaderClient';
import FooterServer from '@/components/landing/FooterServer';
import SectionRenderer from './SectionRenderer';
import type { SanityPage, SiteSettings, PricingConfig } from '@/types/sanity';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface SanityPageLayoutProps {
  page: SanityPage | null;
  settings?: SiteSettings;
  pricingConfig?: PricingConfig;
  breadcrumbs: BreadcrumbItem[];
  fallback?: React.ReactNode;
}

export default function SanityPageLayout({ page, settings, pricingConfig, breadcrumbs, fallback }: SanityPageLayoutProps) {
  // If no Sanity content and a fallback is provided, render fallback
  if (!page?.sections?.length && fallback) {
    return (
      <>
        <Breadcrumbs items={breadcrumbs} />
        {fallback}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderClient settings={settings} />
      <main className="flex-1">
        <Breadcrumbs items={breadcrumbs} />
        <SectionRenderer
          sections={page?.sections || []}
          pricingConfig={pricingConfig}
          settings={settings}
        />
      </main>
      <FooterServer settings={settings} />
    </div>
  );
}
