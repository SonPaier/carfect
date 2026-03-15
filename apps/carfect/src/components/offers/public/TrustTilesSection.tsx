import { Card, CardContent } from '@shared/ui';
import {
  Star,
  Shield,
  Sparkles,
  Award,
  Heart,
  Clock,
  Zap,
  Trophy,
  ThumbsUp,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { Car } from 'lucide-react';
import type { TrustTile, OfferBranding } from './types';

const ICON_MAP: Record<string, typeof Star> = {
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  award: Award,
  heart: Heart,
  car: Car,
  clock: Clock,
  check: CheckCircle,
  zap: Zap,
  trophy: Trophy,
  thumbsup: ThumbsUp,
  eye: Eye,
};

interface TrustTilesSectionProps {
  tiles: TrustTile[];
  title?: string;
  description?: string;
  branding: OfferBranding;
}

export function TrustTilesSection({ tiles, title, description, branding }: TrustTilesSectionProps) {
  if (!tiles.length) return null;

  return (
    <Card
      className="border"
      style={{
        backgroundColor: branding.offer_section_bg_color,
        borderColor: '#e0e0e0',
      }}
    >
      <CardContent className="pt-6">
        {title && (
          <div className="text-center mb-6">
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: branding.offer_section_text_color }}
            >
              {title}
            </h2>
          </div>
        )}

        {description && (
          <p
            className="text-sm mb-6 opacity-80 text-center max-w-3xl mx-auto"
            style={{ color: branding.offer_section_text_color }}
          >
            {description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile, idx) => {
            const IconComponent = ICON_MAP[tile.icon] || Star;

            return (
              <div
                key={idx}
                className="rounded p-4 border shadow-sm"
                style={{
                  backgroundColor: branding.offer_section_bg_color,
                  borderColor: '#e0e0e0',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center"
                    style={{ backgroundColor: `${branding.offer_primary_color}1a` }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: branding.offer_primary_color }}
                    />
                  </div>
                  <h3
                    className="font-semibold text-[17px] md:text-sm"
                    style={{ color: branding.offer_section_text_color }}
                  >
                    {tile.title}
                  </h3>
                </div>
                <p
                  className="text-[15px] md:text-xs opacity-70"
                  style={{ color: branding.offer_section_text_color }}
                >
                  {tile.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
