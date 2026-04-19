import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@shared/ui';
import { Input } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Button } from '@shared/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui';
import { Separator } from '@shared/ui';
import { Plus, Trash2, Loader2, Star, Shield, Sparkles, Award, Heart, Car, Clock, CheckCircle, Zap, Trophy, ThumbsUp, Eye, GripVertical, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrustTile {
  icon: string;
  title: string;
  description: string;
}

interface OfferTrustHeaderSettingsProps {
  instanceId: string;
  onChange?: () => void;
}

export interface OfferTrustHeaderSettingsRef {
  saveAll: () => Promise<boolean>;
}

const AVAILABLE_ICON_DEFS: { value: string; icon: LucideIcon }[] = [
  { value: 'star', icon: Star },
  { value: 'shield', icon: Shield },
  { value: 'sparkles', icon: Sparkles },
  { value: 'award', icon: Award },
  { value: 'heart', icon: Heart },
  { value: 'car', icon: Car },
  { value: 'clock', icon: Clock },
  { value: 'check', icon: CheckCircle },
  { value: 'zap', icon: Zap },
  { value: 'trophy', icon: Trophy },
  { value: 'thumbsup', icon: ThumbsUp },
  { value: 'eye', icon: Eye },
];

const getIconComponent = (iconValue: string): LucideIcon => {
  const found = AVAILABLE_ICON_DEFS.find(i => i.value === iconValue);
  return found?.icon || Star;
};

export const OfferTrustHeaderSettings = forwardRef<OfferTrustHeaderSettingsRef, OfferTrustHeaderSettingsProps>(
  ({ instanceId, onChange }, ref) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [headerTitle, setHeaderTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tiles, setTiles] = useState<TrustTile[]>([]);

    useEffect(() => {
      const fetchSettings = async () => {
        if (!instanceId) return;
        setLoading(true);

        const { data, error } = await supabase
          .from('instances')
          .select('offer_trust_header_title, offer_trust_description, offer_trust_tiles')
          .eq('id', instanceId)
          .single();

        if (error) {
          console.error('Error fetching trust settings:', error);
        } else if (data) {
          setHeaderTitle(data.offer_trust_header_title || '');
          setDescription(data.offer_trust_description || '');
          // Parse tiles from JSONB
          const parsedTiles = (data.offer_trust_tiles as unknown) as TrustTile[] | null;
          setTiles(parsedTiles || []);
        }
        setLoading(false);
      };

      fetchSettings();
    }, [instanceId]);

    useImperativeHandle(ref, () => ({
      saveAll: async () => {
        try {
          const { error } = await supabase
            .from('instances')
            .update({
              offer_trust_header_title: headerTitle || null,
              offer_trust_description: description || null,
              offer_trust_tiles: tiles.length > 0 ? JSON.parse(JSON.stringify(tiles)) : null,
            })
            .eq('id', instanceId);

          if (error) throw error;
          return true;
        } catch (error) {
          console.error('Error saving trust header settings:', error);
          toast.error(t('offers.settings.trustHeader.saveError'));
          return false;
        }
      },
    }));

    const handleChange = () => {
      onChange?.();
    };

    const addTile = () => {
      setTiles([...tiles, { icon: 'star', title: '', description: '' }]);
      handleChange();
    };

    const updateTile = (index: number, field: keyof TrustTile, value: string) => {
      const updated = [...tiles];
      updated[index] = { ...updated[index], [field]: value };
      setTiles(updated);
      handleChange();
    };

    const removeTile = (index: number) => {
      setTiles(tiles.filter((_, i) => i !== index));
      handleChange();
    };

    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header Title */}
        <div className="space-y-2">
          <Label>{t('offers.settings.trustHeader.sectionTitleLabel')}</Label>
          <Input
            value={headerTitle}
            onChange={(e) => { setHeaderTitle(e.target.value); handleChange(); }}
            placeholder={t('offers.settings.trustHeader.sectionTitlePlaceholder')}
          />
          <p className="text-xs text-muted-foreground">
            {t('offers.settings.trustHeader.sectionTitleDescription')}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>{t('offers.settings.trustHeader.descriptionLabel')}</Label>
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); handleChange(); }}
            placeholder={t('offers.settings.trustHeader.descriptionPlaceholder')}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {t('offers.settings.trustHeader.descriptionHint')}
          </p>
        </div>

        <Separator />

        {/* Tiles Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">{t('offers.settings.trustHeader.tilesTitle')}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('offers.settings.trustHeader.tilesDescription')}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTile} className="gap-1">
              <Plus className="w-4 h-4" />
              {t('offers.settings.trustHeader.addTile')}
            </Button>
          </div>

          {tiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>{t('offers.settings.trustHeader.noTiles')}</p>
              <p className="text-sm mt-1">{t('offers.settings.trustHeader.noTilesHint')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tiles.map((tile, index) => {
                const IconComponent = getIconComponent(tile.icon);
                return (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border border-border bg-muted/30 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon selector */}
                      <div className="flex-shrink-0">
                        <Select
                          value={tile.icon}
                          onValueChange={(value) => updateTile(index, 'icon', value)}
                        >
                          <SelectTrigger className="w-[120px] bg-white">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                <span className="text-xs truncate">
                                  {AVAILABLE_ICON_DEFS.find(i => i.value === tile.icon)
                                    ? t(`offers.settings.trustHeader.icons.${tile.icon}`)
                                    : t('offers.settings.trustHeader.iconFallback')}
                                </span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {AVAILABLE_ICON_DEFS.map((iconOption) => (
                              <SelectItem key={iconOption.value} value={iconOption.value}>
                                <div className="flex items-center gap-2">
                                  <iconOption.icon className="w-4 h-4" />
                                  <span>{t(`offers.settings.trustHeader.icons.${iconOption.value}`)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title */}
                      <div className="flex-1">
                        <Input
                          value={tile.title}
                          onChange={(e) => updateTile(index, 'title', e.target.value)}
                          placeholder={t('offers.settings.trustHeader.tileTitlePlaceholder')}
                          className="bg-white"
                        />
                      </div>

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTile(index)}
                        className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    <Textarea
                      value={tile.description}
                      onChange={(e) => updateTile(index, 'description', e.target.value)}
                      placeholder={t('offers.settings.trustHeader.tileDescriptionPlaceholder')}
                      rows={2}
                      className="bg-white"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        {tiles.length === 0 && !headerTitle && !description && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <p className="font-medium">{t('offers.settings.trustHeader.hiddenSectionTitle')}</p>
            <p className="mt-1">
              {t('offers.settings.trustHeader.hiddenSectionDescription')}
            </p>
          </div>
        )}
      </div>
    );
  }
);

OfferTrustHeaderSettings.displayName = 'OfferTrustHeaderSettings';
