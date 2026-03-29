import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface SubpageHeroProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const SubpageHero = ({ children, breadcrumbs }: SubpageHeroProps) => {
  return (
    <section className="bg-gradient-to-br from-primary via-primary/90 to-amber-950 text-white py-16 md:py-24 relative overflow-hidden">
      {/* JSON-LD breadcrumbs for SEO */}
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbs.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: `https://carfect.pl${item.href}`,
              })),
            }),
          }}
        />
      )}

      {/* Repeating CARFECT watermark — diagonal, embossed feel */}
      <div
        className="absolute inset-0 select-none pointer-events-none"
        aria-hidden="true"
        style={{
          transform: "rotate(-15deg) scale(1.5)",
          transformOrigin: "center center",
        }}
      >
        <div className="flex flex-col gap-12 -mt-20">
          {Array.from({ length: 8 }).map((_, row) => (
            <div
              key={row}
              className="flex gap-16 whitespace-nowrap"
              style={{ marginLeft: row % 2 === 0 ? "0px" : "-120px" }}
            >
              {Array.from({ length: 6 }).map((_, col) => (
                <span
                  key={col}
                  className="text-6xl md:text-7xl font-black tracking-[0.2em] text-white/[0.04]"
                >
                  CARFECT
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Visual breadcrumbs */}
        {breadcrumbs && (
          <nav aria-label="Breadcrumbs" className="mb-6">
            <ol className="flex items-center gap-1 text-sm text-white/50">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="w-3 h-3" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-white/80">{item.name}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {children}
      </div>
    </section>
  );
};

export default SubpageHero;
