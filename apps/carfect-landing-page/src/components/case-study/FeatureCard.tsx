import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: string;
  quote?: string;
  number?: number;
  className?: string;
}

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  highlight,
  quote,
  number,
  className 
}: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-2xl border border-border p-6 hover:border-primary/20 transition-colors",
        className
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        {number && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{number}</span>
          </div>
        )}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-sky-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-foreground text-lg">{title}</h4>
        </div>
      </div>
      
      <p className="text-muted-foreground mb-4">
        {description}
      </p>
      
      {highlight && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-green-700">
            ✓ {highlight}
          </p>
        </div>
      )}
      
      {quote && (
        <p className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-4">
          "{quote}"
        </p>
      )}
    </div>
  );
};

export default FeatureCard;
