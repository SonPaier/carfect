import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Clock,
  Grid2X2,
  Settings2,
  Users,
  MessageSquare,
  ChevronDown,
  Warehouse,
  GraduationCap,
  Link2,
} from 'lucide-react';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, useIsMobile } from '@shared/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import StationsSettings from './StationsSettings';
import WorkingHoursSettings from './WorkingHoursSettings';
import SmsMessageSettings from './SmsMessageSettings';
import { ReservationConfirmSettings } from './ReservationConfirmSettings';
import InstanceUsersTab from './InstanceUsersTab';
import HallsListView from './halls/HallsListView';
import TrainingTypesSettings from './TrainingTypesSettings';
import CompanySettingsForm from './CompanySettingsForm';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { useCombinedFeatures } from '@/hooks/useCombinedFeatures';
import { IntegrationsSettingsView } from '@shared/invoicing';

interface SettingsViewProps {
  instanceId: string | null;
  instanceData: Record<string, unknown>;
  onInstanceUpdate: (data: Record<string, unknown>) => void;
  onWorkingHoursUpdate?: () => void;
}

type SettingsTab =
  | 'company'
  | 'stations'
  | 'hours'
  | 'halls'
  | 'trainings'
  | 'integrations'
  | 'app'
  | 'sms'
  | 'users';

const SettingsView = ({
  instanceId,
  instanceData,
  onInstanceUpdate,
  onWorkingHoursUpdate,
}: SettingsViewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { currentVersion } = useAppUpdate();
  const { hasFeature } = useCombinedFeatures(instanceId);
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allTabs: { key: SettingsTab; label: string; icon: React.ReactNode; visible?: boolean }[] = [
    { key: 'company', label: t('settings.tabs.company'), icon: <Building2 className="w-4 h-4" /> },
    { key: 'stations', label: t('settings.tabs.stations'), icon: <Grid2X2 className="w-4 h-4" /> },
    { key: 'hours', label: t('settings.tabs.hours'), icon: <Clock className="w-4 h-4" /> },
    {
      key: 'halls',
      label: t('navigation.halls'),
      icon: <Warehouse className="w-4 h-4" />,
      visible: hasFeature('hall_view'),
    },
    {
      key: 'trainings',
      label: t('settings.tabs.trainings'),
      icon: <GraduationCap className="w-4 h-4" />,
      visible: hasFeature('trainings'),
    },
    { key: 'integrations', label: t('settings.tabs.integrations'), icon: <Link2 className="w-4 h-4" /> },
    { key: 'app', label: t('settings.tabs.app'), icon: <Settings2 className="w-4 h-4" /> },
    { key: 'sms', label: t('settings.tabs.sms'), icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'users', label: t('settings.tabs.users'), icon: <Users className="w-4 h-4" /> },
  ];

  const tabs = allTabs.filter((tab) => tab.visible !== false);

  const currentTab = tabs.find((tab) => tab.key === activeTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <CompanySettingsForm
            instanceId={instanceId}
            instanceData={instanceData}
            onInstanceUpdate={onInstanceUpdate}
          />
        );

      case 'stations':
        return <StationsSettings instanceId={instanceId} />;

      case 'hours':
        return <WorkingHoursSettings instanceId={instanceId} onSave={onWorkingHoursUpdate} />;

      case 'halls':
        return instanceId ? <HallsListView instanceId={instanceId} /> : null;

      case 'trainings':
        return <TrainingTypesSettings instanceId={instanceId} />;

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Integracje</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Połącz z systemami do fakturowania
              </p>
            </div>
            <IntegrationsSettingsView instanceId={instanceId} supabaseClient={supabase} />
          </div>
        );

      case 'app':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Ustawienia aplikacji</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Dostosuj aplikację Carfect pod potrzeby Twojego studia
              </p>
            </div>
            <ReservationConfirmSettings instanceId={instanceId} />
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Wiadomości SMS</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Zarządzaj treścią wiadomości SMS wysyłanych do klientów
              </p>
            </div>
            <SmsMessageSettings
              instanceId={instanceId}
              instanceName={(instanceData?.short_name as string) || (instanceData?.name as string)}
            />
          </div>
        );

      case 'users':
        return instanceId ? <InstanceUsersTab instanceId={instanceId} /> : null;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-0 lg:flex lg:flex-row lg:gap-4">
      {/* Sidebar / Mobile Dropdown */}
      {isMobile ? (
        <Collapsible open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-white border-border/50">
              <span className="flex items-center gap-2">
                {currentTab?.icon}
                {currentTab?.label}
              </span>
              <ChevronDown
                className={cn('w-4 h-4 transition-transform', mobileMenuOpen && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-white rounded-lg border border-border/50 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/30 last:border-0',
                    activeTab === tab.key
                      ? 'bg-hover text-foreground font-medium'
                      : 'text-foreground hover:bg-hover',
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="w-56 shrink-0">
          <div className="sticky top-0">
            <div className="bg-white rounded-lg border border-border/50 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors border-b border-border/30 last:border-0',
                    activeTab === tab.key
                      ? 'bg-hover text-foreground font-medium'
                      : 'text-foreground hover:bg-hover',
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Version info — fixed below menu */}
            {currentVersion && (
              <p className="text-xs text-muted-foreground py-3 px-4">Wersja: {currentVersion}</p>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-border/50 rounded-lg p-6 pb-24 md:pb-6 bg-secondary-foreground">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
