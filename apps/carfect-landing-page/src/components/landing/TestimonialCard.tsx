import Image, { StaticImageData } from "next/image";
import { Star } from "lucide-react";
import logoArmcar from "@/assets/logo-armcar.png";

interface TestimonialCardProps {
  name: string;
  company: string;
  companyUrl?: string;
  location?: string;
  logo?: string;  // key into logoMap
  text: string;
  rating: number;
  fullWidth?: boolean;
}

const logoMap: Record<string, StaticImageData> = {
  armcar: logoArmcar,
};

const TestimonialCard = ({ 
  name, 
  company, 
  companyUrl, 
  location, 
  logo, 
  text, 
  rating,
  fullWidth = false 
}: TestimonialCardProps) => {
  const logoSrc = logo ? logoMap[logo] : null;

  return (
    <article className={`p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors ${fullWidth ? 'w-full' : ''}`}>
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
            }`}
          />
        ))}
      </div>
      
      {/* Quote */}
      <blockquote className={`text-foreground leading-relaxed mb-6 ${fullWidth ? 'text-lg' : ''}`}>
        "{text}"
      </blockquote>
      
      {/* Author */}
      <footer className="flex items-center gap-4">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={`${company} logo`}
            className="h-16 w-auto object-contain"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
        )}
        <div>
          <cite className="not-italic font-semibold text-foreground block">
            {name}
          </cite>
          {companyUrl ? (
            <a 
              href={companyUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              {company}
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">{company}</span>
          )}
          {location && (
            <span className="text-sm text-muted-foreground block">{location}</span>
          )}
        </div>
      </footer>
    </article>
  );
};

export default TestimonialCard;
