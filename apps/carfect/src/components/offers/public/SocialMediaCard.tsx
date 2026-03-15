import { Card, CardContent } from '@shared/ui';
import { Facebook, Instagram, Star, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SocialMediaCardProps {
  facebook?: string;
  instagram?: string;
  googleReviewsUrl?: string;
  portfolioUrl?: string;
}

const isSafeUrl = (url: string) => /^https?:\/\//i.test(url);

export function SocialMediaCard({
  facebook,
  instagram,
  googleReviewsUrl,
  portfolioUrl,
}: SocialMediaCardProps) {
  const { t } = useTranslation();

  // Only render URLs with safe protocols
  const safeFacebook = facebook && isSafeUrl(facebook) ? facebook : undefined;
  const safeInstagram = instagram && isSafeUrl(instagram) ? instagram : undefined;
  const safeGoogleReviews =
    googleReviewsUrl && isSafeUrl(googleReviewsUrl) ? googleReviewsUrl : undefined;
  const safePortfolio = portfolioUrl && isSafeUrl(portfolioUrl) ? portfolioUrl : undefined;

  if (!safeFacebook && !safeInstagram && !safeGoogleReviews && !safePortfolio) return null;

  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('publicOffer.social.cta')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            {safeFacebook && (
              <a
                href={safeFacebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:bg-[#1877F2]/90 transition-colors"
              >
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </a>
            )}
            {safeInstagram && (
              <a
                href={safeInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-5 h-5" />
                <span>Instagram</span>
              </a>
            )}
            {safeGoogleReviews && (
              <a
                href={safeGoogleReviews}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Star className="w-5 h-5 text-yellow-500" />
                <span>{t('publicOffer.social.googleReviews')}</span>
              </a>
            )}
            {safePortfolio && (
              <a
                href={safePortfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                <span>{t('publicOffer.social.portfolio')}</span>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
