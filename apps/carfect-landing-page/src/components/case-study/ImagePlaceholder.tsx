import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  description: string;
  aspectRatio?: "4:3" | "16:9" | "1:1" | "3:4";
  className?: string;
}

const ImagePlaceholder = ({ 
  description, 
  aspectRatio = "4:3",
  className 
}: ImagePlaceholderProps) => {
  const aspectStyles = {
    "4:3": "aspect-[4/3]",
    "16:9": "aspect-video",
    "1:1": "aspect-square",
    "3:4": "aspect-[3/4]",
  };

  return (
    <div 
      className={cn(
        "bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex flex-col items-center justify-center gap-3",
        aspectStyles[aspectRatio],
        className
      )}
    >
      <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground/60 text-center px-4 max-w-xs">
        Placeholder: {description}
      </p>
    </div>
  );
};

export default ImagePlaceholder;
