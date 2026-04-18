import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { Phone } from 'lucide-react';
import { IntegrationCard, FakturowniaSettingsView, IfirmaSettingsView, useInvoicingSettings } from '@shared/invoicing';
import { useUltrafitLink } from '@/hooks/useUltrafitLink';
import { supabase } from '@/integrations/supabase/client';
import ultrafitLogo from '@/assets/integrations/ultrafit-logo.png';
import fakturowniaLogo from '@/assets/integrations/fakturownia-logo.png';
import ifirmaLogo from '@/assets/integrations/ifirma-logo.jpg';
import infaktLogo from '@/assets/integrations/infakt-logo.png';

interface IntegrationsViewProps {
  instanceId: string | null;
  onNavigateToUltrafit: () => void;
}

type ActiveView = 'list' | 'fakturownia' | 'ifirma';

export function IntegrationsView({ instanceId, onNavigateToUltrafit }: IntegrationsViewProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const { settings } = useInvoicingSettings(instanceId, supabase);
  const { isLinked } = useUltrafitLink(instanceId);

  const isFakturowniaActive = settings?.provider === 'fakturownia' && settings?.active === true;
  const isIfirmaActive = settings?.provider === 'ifirma' && settings?.active === true;

  if (activeView === 'fakturownia') {
    return (
      <FakturowniaSettingsView
        instanceId={instanceId}
        supabaseClient={supabase}
        onBack={() => setActiveView('list')}
      />
    );
  }

  if (activeView === 'ifirma') {
    return (
      <IfirmaSettingsView
        instanceId={instanceId}
        supabaseClient={supabase}
        onBack={() => setActiveView('list')}
      />
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">{t('integrations.title')}</h1>

      {/* Section: Invoicing */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t('integrations.sections.invoicing')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IntegrationCard
            logo={fakturowniaLogo}
            logoAlt="Fakturownia"
            title={t('integrations.fakturownia.title')}
            description={t('integrations.fakturownia.description')}
            isActive={isFakturowniaActive}
            activeLabel={t('integrations.status.connected')}
            onClick={() => setActiveView('fakturownia')}
          />
          <IntegrationCard
            logo={ifirmaLogo}
            logoAlt="iFirma"
            title={t('integrations.ifirma.title')}
            description={t('integrations.ifirma.description')}
            isActive={isIfirmaActive}
            activeLabel={t('integrations.status.connected')}
            onClick={() => setActiveView('ifirma')}
          />
          <IntegrationCard
            logo={infaktLogo}
            logoAlt="inFakt"
            title={t('integrations.infakt.title')}
            description={t('integrations.infakt.description')}
            comingSoon
            comingSoonLabel={t('integrations.status.comingSoon')}
          />
        </div>
      </section>

      {/* Section: PPF Distributors */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {t('integrations.sections.ppfDistributors')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IntegrationCard
            logo={ultrafitLogo}
            logoAlt="Ultrafit Poland"
            title={t('integrations.ultrafit.title')}
            description={
              isLinked
                ? t('integrations.ultrafit.descriptionConnected')
                : t('integrations.ultrafit.description')
            }
            isActive={isLinked}
            activeLabel={t('integrations.status.connected')}
            onClick={isLinked ? onNavigateToUltrafit : undefined}
          >
            {!isLinked && (
              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t('integrations.ultrafit.requestAccess')} — {t('integrations.ultrafit.contactNumber')}
                </span>
              </div>
            )}
          </IntegrationCard>
        </div>
      </section>
    </div>
  );
}

export default IntegrationsView;
