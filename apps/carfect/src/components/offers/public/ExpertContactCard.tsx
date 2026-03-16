import { Card, CardHeader, CardTitle, CardContent } from '@shared/ui';
import { Phone, MapPin, Mail, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OfferBranding } from './types';

interface ExpertContactCardProps {
  instance: {
    phone?: string;
    contact_person?: string;
    address?: string;
    email?: string;
    website?: string;
  };
  branding: OfferBranding;
}

export function ExpertContactCard({ instance, branding }: ExpertContactCardProps) {
  const { t } = useTranslation();

  if (!instance.phone && !instance.contact_person) return null;

  return (
    <Card
      className="border"
      style={{
        backgroundColor: branding.offer_section_bg_color,
        borderColor: '#e0e0e0',
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle
          className="flex items-center gap-2 text-base"
          style={{ color: branding.offer_section_text_color }}
        >
          <Phone className="w-4 h-4" />
          {t('publicOffer.expertNumber')}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {instance.contact_person && (
          <p className="font-medium" style={{ color: branding.offer_section_text_color }}>
            {instance.contact_person}
          </p>
        )}
        {instance.phone && (
          <a
            href={`tel:${instance.phone}`}
            className="flex items-center gap-2 hover:underline font-medium"
            style={{ color: branding.offer_primary_color }}
          >
            <Phone className="w-3 h-3" />
            {instance.phone}
          </a>
        )}
        {instance.address && (
          <p
            className="flex items-center gap-2 opacity-70"
            style={{ color: branding.offer_section_text_color }}
          >
            <MapPin className="w-3 h-3 shrink-0" />
            {instance.address}
          </p>
        )}
        {instance.email && (
          <a
            href={`mailto:${instance.email}`}
            className="flex items-center gap-2 opacity-70 hover:underline"
            style={{ color: branding.offer_section_text_color }}
          >
            <Mail className="w-3 h-3" />
            {instance.email}
          </a>
        )}
        {instance.website && /^https?:\/\//i.test(instance.website) && (
          <a
            href={instance.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-70 hover:underline"
            style={{ color: branding.offer_section_text_color }}
          >
            <Globe className="w-3 h-3" />
            {instance.website}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
