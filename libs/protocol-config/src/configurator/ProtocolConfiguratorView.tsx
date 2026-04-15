import { useState, useEffect } from 'react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@shared/ui';
import { useIsMobile } from '@shared/ui';
import { toast } from 'sonner';
import { CustomFieldsConfigurator, useCustomFields } from '@shared/custom-fields';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProtocolConfig, ProtocolType } from '../types';
import { useProtocolConfig } from '../useProtocolConfig';
import { DEFAULT_PROTOCOL_CONFIG } from '../defaults';
import { SectionOrderTab } from './SectionOrderTab';
import { BuiltInFieldsSection } from './BuiltInFieldsSection';
import { ConsentClausesSection } from './ConsentClausesSection';
import { ServiceColumnsSection } from './ServiceColumnsSection';
import { ProtocolPreview } from './ProtocolPreview';
import { ArrowLeft, Eye } from 'lucide-react';

interface ProtocolConfiguratorViewProps {
  instanceId: string;
  supabase: SupabaseClient;
  onBack: () => void;
  emailTemplate?: string;
  onEmailTemplateChange?: (template: string) => void;
  /** Custom preview renderer. Receives config, definitions, and protocolType. Falls back to built-in ProtocolPreview. */
  renderPreview?: (config: ProtocolConfig, definitions: import('@shared/custom-fields').CustomFieldDefinition[], protocolType: ProtocolType) => React.ReactNode;
}

export function ProtocolConfiguratorView({
  instanceId,
  supabase,
  onBack,
  emailTemplate = '',
  onEmailTemplateChange,
  renderPreview,
}: ProtocolConfiguratorViewProps) {
  const isMobile = useIsMobile();
  const [protocolType, setProtocolType] = useState<ProtocolType>('reception');
  function handleProtocolTypeChange(type: ProtocolType) {
    setProtocolType(type);
    setLocalConfig(DEFAULT_PROTOCOL_CONFIG);
  }
  const [showPreview, setShowPreview] = useState(false);
  const [localEmailTemplate, setLocalEmailTemplate] = useState(emailTemplate);

  const context = `protocol_${protocolType}`;
  const { config, isLoading, saveConfigAsync, isSaving } = useProtocolConfig(instanceId, protocolType, supabase);
  const { definitions } = useCustomFields(instanceId, context, supabase);

  const [localConfig, setLocalConfig] = useState<ProtocolConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    setLocalEmailTemplate(emailTemplate);
  }, [emailTemplate]);

  async function handleSave() {
    try {
      await saveConfigAsync(localConfig);
      onEmailTemplateChange?.(localEmailTemplate);
      toast.success('Ustawienia zostały zapisane');
    } catch {
      toast.error('Nie udało się zapisać ustawień');
    }
  }

  if (isMobile && showPreview) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold">Podgląd protokołu</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderPreview ? renderPreview(localConfig, definitions, protocolType) : <ProtocolPreview config={localConfig} definitions={definitions} />}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1">Konfigurator protokołów</h1>
        {isMobile && (
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" />
            Podgląd
          </Button>
        )}
      </div>

      {/* Protocol type toggle */}
      <div className="flex gap-2 px-4 py-3 border-b shrink-0">
        <Button
          variant={protocolType === 'reception' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleProtocolTypeChange('reception')}
        >
          Protokół przyjęcia
        </Button>
        <Button
          variant={protocolType === 'pickup' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleProtocolTypeChange('pickup')}
        >
          Protokół wydania
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 flex gap-6 p-4">
        {/* Left panel — config */}
        <div className={isMobile ? 'w-full overflow-y-auto' : 'w-[540px] shrink-0 overflow-y-auto pr-2'}>
          <Tabs defaultValue="sections" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="sections">Sekcje</TabsTrigger>
              <TabsTrigger value="custom-fields">Pola</TabsTrigger>
              <TabsTrigger value="consents">Zgody</TabsTrigger>
              <TabsTrigger value="services">Usługi</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              <SectionOrderTab config={localConfig} onChange={setLocalConfig} />
              <BuiltInFieldsSection
                config={localConfig.builtInFields}
                onChange={(builtInFields) => setLocalConfig({ ...localConfig, builtInFields })}
              />
            </TabsContent>

            <TabsContent value="custom-fields">
              <CustomFieldsConfigurator
                instanceId={instanceId}
                context={context}
                supabase={supabase}
              />
            </TabsContent>

            <TabsContent value="consents">
              <ConsentClausesSection
                clauses={localConfig.consentClauses}
                onChange={(consentClauses) => setLocalConfig({ ...localConfig, consentClauses })}
              />
            </TabsContent>

            <TabsContent value="services">
              <ServiceColumnsSection
                columns={localConfig.serviceColumns}
                onChange={(serviceColumns) => setLocalConfig({ ...localConfig, serviceColumns })}
              />
            </TabsContent>

            <TabsContent value="email">
              <div className="space-y-2">
                <label className="text-sm font-medium">Szablon wiadomości email</label>
                <Textarea
                  value={localEmailTemplate}
                  onChange={(e) => setLocalEmailTemplate(e.target.value)}
                  rows={8}
                  placeholder="Treść emaila wysyłanego z protokołem..."
                />
                <p className="text-xs text-muted-foreground">
                  Zmienne: {'{imie}'}, {'{pojazd}'}, {'{typ_protokolu}'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel — live preview (desktop only) */}
        {!isMobile && (
          <div className="flex-1 min-w-0 border rounded-lg overflow-hidden bg-white">
            {renderPreview ? renderPreview(localConfig, definitions, protocolType) : <ProtocolPreview config={localConfig} definitions={definitions} />}
          </div>
        )}
      </div>

      {/* Fixed footer */}
      <div className="border-t p-4 shrink-0">
        <div className="max-w-3xl mx-auto flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </div>
      </div>
    </div>
  );
}
