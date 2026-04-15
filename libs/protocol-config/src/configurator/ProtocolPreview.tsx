import { ScrollArea } from '@shared/ui';
import type { CustomFieldDefinition } from '@shared/custom-fields';
import type { ProtocolConfig, SectionId } from '../types';

interface ProtocolPreviewProps {
  config: ProtocolConfig;
  definitions: CustomFieldDefinition[];
}

function HeaderSection() {
  return (
    <div className="text-center border-b pb-4 mb-4">
      <h2 className="font-bold text-lg">Dokument przyjęcia samochodu</h2>
      <p className="text-sm text-muted-foreground">2026/XX</p>
    </div>
  );
}

function CustomerInfoSection({ config }: { config: ProtocolConfig }) {
  const { nip } = config.builtInFields;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dane klienta</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Klient: Jan Kowalski</span>
        </div>
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Tel: 500 100 200</span>
        </div>
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Email: jan@example.com</span>
        </div>
        {nip.enabled && (
          <div className={nip.width === 'half' ? 'flex-1 min-w-[45%]' : 'w-full'}>
            <span className="text-sm">NIP: 1234567890</span>
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleInfoSection({ config }: { config: ProtocolConfig }) {
  const { vin } = config.builtInFields;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Dane pojazdu</p>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Auto: BMW 320d</span>
        </div>
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Nr rej.: WA12345</span>
        </div>
        {vin.enabled && (
          <div className={vin.width === 'half' ? 'flex-1 min-w-[45%]' : 'w-full'}>
            <span className="text-sm">VIN: WBAXXXXXXXX</span>
          </div>
        )}
        <div className="flex-1 min-w-[45%]">
          <span className="text-sm">Nadwozie: Sedan</span>
        </div>
      </div>
    </div>
  );
}

function VehicleDiagramSection() {
  return (
    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
      Diagram pojazdu
    </div>
  );
}

function FuelOdometerSection({ config }: { config: ProtocolConfig }) {
  const { fuelLevel, odometer } = config.builtInFields;
  if (!fuelLevel.enabled && !odometer.enabled) return null;
  return (
    <div className="flex flex-wrap gap-4">
      {fuelLevel.enabled && (
        <span className="text-sm">Poziom paliwa: ████░░░░ 50%</span>
      )}
      {odometer.enabled && (
        <span className="text-sm">Przebieg: 45 000 km</span>
      )}
    </div>
  );
}

function ValuableItemsSection() {
  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <p className="text-sm">☐ Przedmioty wartościowe nie znajdują się w samochodzie</p>
      <p className="text-xs text-muted-foreground mt-1">Podpis: _____________</p>
    </div>
  );
}

function CustomFieldsSection({ definitions }: { definitions: CustomFieldDefinition[] }) {
  if (definitions.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pola dodatkowe</p>
      <div className="flex flex-wrap gap-2">
        {definitions.map((def) => (
          <div
            key={def.id}
            className={def.config.width === 'half' ? 'flex-1 min-w-[45%]' : 'w-full'}
          >
            <span className="text-xs text-muted-foreground">{def.label}</span>
            <div className="border-b border-dashed mt-1 h-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceItemsSection({ config }: { config: ProtocolConfig }) {
  const sortedColumns = [...config.serviceColumns].sort((a, b) => a.order - b.order);
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Usługi</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {sortedColumns.map((col) => (
              <th
                key={col.id}
                className="border px-2 py-1 text-left font-medium bg-muted/30"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {sortedColumns.map((col) => (
              <td key={col.id} className="border px-2 py-2" />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ConsentClausesSection({ config }: { config: ProtocolConfig }) {
  const sortedClauses = [...config.consentClauses].sort((a, b) => a.order - b.order);
  if (sortedClauses.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Zgody</p>
      {sortedClauses.map((clause) => (
        <div key={clause.id} className="flex items-start gap-2">
          <span className="text-sm mt-0.5">☐</span>
          <p className="text-xs text-muted-foreground">
            {clause.text.length > 80 ? `${clause.text.slice(0, 80)}...` : clause.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function CustomerSignatureSection() {
  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm font-medium">Podpis klienta</p>
      <div className="border-2 border-dashed rounded h-16 mt-2" />
    </div>
  );
}

function ReleaseSectionContent({ config }: { config: ProtocolConfig }) {
  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm font-medium">Pokwitowanie odbioru</p>
      <p className="text-xs text-muted-foreground mt-1">
        {config.builtInFields.releaseSection.declarationText}
      </p>
      <div className="border-2 border-dashed rounded h-16 mt-2" />
    </div>
  );
}

function renderSection(
  sectionId: SectionId,
  config: ProtocolConfig,
  definitions: CustomFieldDefinition[],
): React.ReactNode {
  switch (sectionId) {
    case 'header':
      return <HeaderSection />;

    case 'customerInfo':
      return <CustomerInfoSection config={config} />;

    case 'vehicleInfo':
      return <VehicleInfoSection config={config} />;

    case 'vehicleDiagram':
      return <VehicleDiagramSection />;

    case 'fuelOdometer': {
      const { fuelLevel, odometer } = config.builtInFields;
      if (!fuelLevel.enabled && !odometer.enabled) return null;
      return <FuelOdometerSection config={config} />;
    }

    case 'valuableItems':
      if (!config.builtInFields.valuableItemsClause.enabled) return null;
      return <ValuableItemsSection />;

    case 'customFields':
      return <CustomFieldsSection definitions={definitions} />;

    case 'serviceItems':
      if (!config.builtInFields.serviceItems.enabled) return null;
      return <ServiceItemsSection config={config} />;

    case 'consentClauses':
      return <ConsentClausesSection config={config} />;

    case 'customerSignature':
      return <CustomerSignatureSection />;

    case 'releaseSection':
      if (!config.builtInFields.releaseSection.enabled) return null;
      return <ReleaseSectionContent config={config} />;

    default:
      return null;
  }
}

export function ProtocolPreview({ config, definitions }: ProtocolPreviewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4 bg-white min-h-full">
        {config.sectionOrder.map((sectionId) => {
          const content = renderSection(sectionId, config, definitions);
          if (content === null) return null;
          return <div key={sectionId}>{content}</div>;
        })}
      </div>
    </ScrollArea>
  );
}
