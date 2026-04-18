import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@shared/ui';
import { IntegrationCard, FakturowniaSettingsView, IfirmaSettingsView, useInvoicingSettings } from '@shared/invoicing';
import { useUltrafitLink } from '@/hooks/useUltrafitLink';
import { supabase } from '@/integrations/supabase/client';
import ultrafitLogo from '@/assets/integrations/ultrafit-logo.png';
import fakturowniaLogo from '@/assets/integrations/fakturownia-logo.png';
import ifirmaLogo from '@/assets/integrations/ifirma-logo.png';

interface IntegrationsViewProps {
  instanceId: string | null;
  onNavigateToUltrafit: () => void;
}

type ActiveView = 'list' | 'fakturownia' | 'ifirma';

function UltrafitIntegrationCard({
  instanceId,
  onNavigateToUltrafit,
}: {
  instanceId: string | null;
  onNavigateToUltrafit: () => void;
}) {
  const { t } = useTranslation();
  const { isLinked } = useUltrafitLink(instanceId);

  return (
    <IntegrationCard
      logo={ultrafitLogo}
      logoAlt="Ultrafit Poland"
      title={t('integrations.ultrafit.title')}
      description={
        isLinked
          ? t('integrations.ultrafit.descriptionConnected')
          : t('integrations.ultrafit.description')
      }
      isConnected={isLinked}
      connectedLabel={t('integrations.ultrafit.connected')}
      configureLabel=""
      onClick={undefined}
    >
      {isLinked ? (
        <Button size="sm" onClick={onNavigateToUltrafit}>
          {t('integrations.ultrafit.goToOrders')}
        </Button>
      ) : (
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" asChild>
            <a href={`tel:${t('integrations.ultrafit.contactNumber').replace(/[^0-9+]/g, '')}`}>
              {t('integrations.ultrafit.requestAccess')}
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">{t('integrations.ultrafit.contactNumber')}</span>
        </div>
      )}
    </IntegrationCard>
  );
}

function InvoicingSectionCards({
  instanceId,
  onSelectFakturownia,
  onSelectIfirma,
}: {
  instanceId: string | null;
  onSelectFakturownia: () => void;
  onSelectIfirma: () => void;
}) {
  const { t } = useTranslation();
  const { settings } = useInvoicingSettings(instanceId, supabase);

  const isFakturowniaConnected = settings?.provider === 'fakturownia' && settings?.active === true;
  const isIfirmaConnected = settings?.provider === 'ifirma' && settings?.active === true;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <IntegrationCard
        logo={fakturowniaLogo}
        logoAlt="Fakturownia"
        title={t('integrations.fakturownia.title')}
        description={t('integrations.fakturownia.description')}
        isConnected={isFakturowniaConnected}
        connectedLabel={t('integrations.status.connected')}
        configureLabel={t('integrations.status.configure')}
        onClick={onSelectFakturownia}
      />
      <IntegrationCard
        logo={ifirmaLogo}
        logoAlt="iFirma"
        title={t('integrations.ifirma.title')}
        description={t('integrations.ifirma.description')}
        isConnected={isIfirmaConnected}
        connectedLabel={t('integrations.status.connected')}
        configureLabel={t('integrations.status.configure')}
        onClick={onSelectIfirma}
      />
    </div>
  );
}

export function IntegrationsView({ instanceId, onNavigateToUltrafit }: IntegrationsViewProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<ActiveView>('list');

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
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('integrations.sections.invoicing')}
        </h3>
        <InvoicingSectionCards
          instanceId={instanceId}
          onSelectFakturownia={() => setActiveView('fakturownia')}
          onSelectIfirma={() => setActiveView('ifirma')}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('integrations.sections.ppfDistributors')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UltrafitIntegrationCard
            instanceId={instanceId}
            onNavigateToUltrafit={onNavigateToUltrafit}
          />
        </div>
      </div>
    </div>
  );
}

export default IntegrationsView;
