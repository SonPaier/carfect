import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Loader2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProtocolHeader from './ProtocolHeader';
import {
  getVisitsFromChain,
  roundUpTo30,
  formatDuration,
  type VisitInfo,
} from '@/lib/protocolUtils';

interface ProtocolData {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_nip: string | null;
  protocol_date: string;
  protocol_type: string;
  prepared_by: string | null;
  notes: string | null;
  customer_signature: string | null;
  photo_urls: string[];
  customer_address_id: string | null;
  instance_id: string;
}

interface AddressData {
  name: string;
  street: string | null;
  city: string | null;
  postal_code: string | null;
}

interface InstanceData {
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const protocolTypeLabels: Record<string, string> = {
  completion: 'Protokół zakończenia prac',
};

interface PublicProtocolCustomerViewProps {
  token: string;
}

const PublicProtocolCustomerView = ({ token }: PublicProtocolCustomerViewProps) => {
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<VisitInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: proto, error: protoErr } = await supabase
        .from('protocols')
        .select('*')
        .eq('public_token', token)
        .single();

      if (protoErr || !proto) {
        setError('Nie znaleziono protokołu');
        setLoading(false);
        return;
      }

      const photoUrls = Array.isArray(proto.photo_urls) ? (proto.photo_urls as string[]) : [];
      setProtocol({ ...proto, photo_urls: photoUrls });

      // Fetch instance
      const { data: inst } = await supabase
        .from('instances')
        .select('name, logo_url, phone, email, address')
        .eq('id', proto.instance_id)
        .single();
      setInstance(inst);

      // Fetch address
      if (proto.customer_address_id) {
        const { data: addr } = await supabase
          .from('customer_addresses')
          .select('name, street, city, postal_code')
          .eq('id', proto.customer_address_id)
          .single();
        setAddress(addr);
      }

      // Fetch visit chain for time display
      if (proto.calendar_item_id) {
        const { data: currentItem } = await supabase
          .from('calendar_items')
          .select('id, parent_item_id, item_date, work_started_at, work_ended_at')
          .eq('id', proto.calendar_item_id)
          .single();
        if (currentItem) {
          const rootId = (currentItem as any).parent_item_id || currentItem.id;
          const { data: chainData } = await supabase
            .from('calendar_items')
            .select('id, item_date, work_started_at, work_ended_at')
            .or(`id.eq.${rootId},parent_item_id.eq.${rootId}`);
          setVisits(getVisitsFromChain((chainData || []) as any[]));
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (error || !protocol) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <FileText className="w-12 h-12 mx-auto text-foreground/50" />
          <p className="text-foreground">{error || 'Nie znaleziono protokołu'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <ProtocolHeader
          instanceName={instance?.name || ''}
          logoUrl={instance?.logo_url || null}
          address={instance?.address}
          phone={instance?.phone}
          email={instance?.email}
        />

        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          {/* Type + Date + Visits inline */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground">
              {protocolTypeLabels[protocol.protocol_type] || 'Protokół'}
            </h2>
            <p className="text-sm text-foreground mt-1">
              Data: {format(new Date(protocol.protocol_date), 'd MMMM yyyy', { locale: pl })}
              {visits.length === 1 &&
                ` · ${formatDuration(roundUpTo30(visits[0].durationMinutes))}`}
            </p>
          </div>

          {/* Visits (only when more than 1) */}
          {visits.length > 1 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Wizyty serwisowe</h3>
              <div className="space-y-1 text-sm">
                {visits.map((v, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{format(new Date(v.itemDate + 'T00:00:00'), 'd.MM.yyyy')}</span>
                    <span className="font-medium">
                      {formatDuration(roundUpTo30(v.durationMinutes))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-1 font-semibold">
                  <span>Łącznie</span>
                  <span>
                    {formatDuration(
                      roundUpTo30(visits.reduce((sum, v) => sum + v.durationMinutes, 0)),
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Address only — no client personal data in public view */}
          {address && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Adres
              </h3>
              <p className="text-sm text-foreground">
                {address.name}
                {address.street && `, ${address.street}`}
                {address.postal_code && `, ${address.postal_code}`}
                {address.city && ` ${address.city}`}
              </p>
            </div>
          )}

          {/* Notes — above photos */}
          {protocol.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Uwagi</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{protocol.notes}</p>
            </div>
          )}

          {/* Photos */}
          {protocol.photo_urls.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Zdjęcia</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {protocol.photo_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Zdjęcie ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-md border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Prepared by + date */}
          {protocol.prepared_by && (
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Sporządził</h3>
              <p className="text-sm text-foreground">
                {protocol.prepared_by},{' '}
                {format(new Date(protocol.protocol_date), 'd MMMM yyyy', { locale: pl })}
              </p>
            </div>
          )}

          {/* Signature */}
          {protocol.customer_signature && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">
                Podpis osoby upoważnionej do odbioru
              </h3>
              <div className="border border-border rounded-md p-2 bg-background">
                <img src={protocol.customer_signature} alt="Podpis" className="max-h-32 mx-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Footer — hiservice.pl branding */}
        <div className="text-center text-xs text-foreground pt-4">
          <p>
            Wygenerowano przy użyciu systemu dla serwisów —{' '}
            <a
              href="https://hiservice.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              hiservice.pl
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicProtocolCustomerView;
