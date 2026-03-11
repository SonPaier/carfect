import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteCardProps {
  text: string;
  author: string;
  role: string;
  logo?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const QuoteCard = ({ 
  text, 
  author, 
  role, 
  logo,
  size = "md",
  className 
}: QuoteCardProps) => {
  const sizeStyles = {
    sm: {
      padding: "p-6",
      quote: "text-base",
      icon: "w-8 h-8",
      avatar: "w-10 h-10",
    },
    md: {
      padding: "p-8 md:p-10",
      quote: "text-lg md:text-xl",
      icon: "w-10 h-10",
      avatar: "w-12 h-12",
    },
    lg: {
      padding: "p-8 md:p-12",
      quote: "text-xl md:text-2xl",
      icon: "w-12 h-12",
      avatar: "w-14 h-14",
    },
  };

  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-primary/5 via-primary/3 to-sky-500/5 rounded-2xl border border-primary/10",
        sizeStyles[size].padding,
        className
      )}
    >
      <Quote className={cn("text-primary/30 mb-4", sizeStyles[size].icon)} />
      <p className={cn("text-foreground leading-relaxed mb-6", sizeStyles[size].quote)}>
        "{text}"
      </p>
      <div className="flex items-center gap-4">
        {logo ? (
          <img
            src={logo}
            alt={author}
            className={cn("rounded-full object-cover", sizeStyles[size].avatar)}
          />
        ) : (
          <div className={cn(
            "rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold",
            sizeStyles[size].avatar
          )}>
            {author.split(" ").map(n => n[0]).join("")}
          </div>
        )}
        <div>
          <p className="font-bold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteCard;
