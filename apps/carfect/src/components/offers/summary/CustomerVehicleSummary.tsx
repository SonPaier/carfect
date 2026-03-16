import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@shared/ui';
import { User, Building2, Car } from 'lucide-react';
import type { CustomerData, VehicleData } from '@/hooks/useOffer';

const paintTypeLabels: Record<string, string> = {
  matte: 'Mat',
  dark: 'Ciemny',
  other: 'Inny',
};

const getPaintTypeLabel = (type: string) => paintTypeLabels[type] || type;

interface CustomerVehicleSummaryProps {
  customerData: CustomerData;
  vehicleData: VehicleData;
}

export function CustomerVehicleSummary({ customerData, vehicleData }: CustomerVehicleSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Customer */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <User className="w-4 h-4 text-primary" />
            {t('summary.customer')}
          </div>
          <div className="text-sm space-y-0.5 pl-6">
            <p className="font-medium">{customerData.name || '—'}</p>
            <p className="text-muted-foreground">{customerData.email || '—'}</p>
            {customerData.phone && <p className="text-muted-foreground">{customerData.phone}</p>}
          </div>
        </div>

        {/* Company */}
        {customerData.company && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Building2 className="w-4 h-4 text-primary" />
              {t('summary.company')}
            </div>
            <div className="text-sm space-y-0.5 pl-6">
              <p className="font-medium">{customerData.company}</p>
              {customerData.nip && <p className="text-muted-foreground">NIP: {customerData.nip}</p>}
            </div>
          </div>
        )}

        {/* Vehicle */}
        {vehicleData.brandModel && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Car className="w-4 h-4 text-primary" />
              {t('summary.vehicle')}
            </div>
            <div className="text-sm space-y-0.5 pl-6">
              <p className="font-medium">{vehicleData.brandModel}</p>
              {(vehicleData.paintColor || vehicleData.paintType) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {vehicleData.paintColor && (
                    <span className="px-4 py-1 bg-slate-600 text-white rounded-full text-sm font-medium">
                      {vehicleData.paintColor}
                    </span>
                  )}
                  {vehicleData.paintType && (
                    <span className="px-4 py-1 bg-slate-600 text-white rounded-full text-sm font-medium">
                      {vehicleData.paintType === 'gloss'
                        ? t('summary.paintGloss')
                        : vehicleData.paintType === 'matte'
                          ? t('summary.paintMatte')
                          : getPaintTypeLabel(vehicleData.paintType)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
