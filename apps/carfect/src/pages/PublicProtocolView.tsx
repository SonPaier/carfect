import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@shared/ui';
import { PublicProtocolCustomerView } from '@/components/protocols/PublicProtocolCustomerView';
import type { VehicleView, BodyType, DamagePoint } from '@/components/protocols/VehicleDiagram';

interface Instance {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

type ProtocolType = 'reception' | 'pickup';

interface Protocol {
  id: string;
  public_token: string;
  offer_number: string | null;
  customer_name: string;
  customer_email: string | null;
  vehicle_model: string | null;
  nip: string | null;
  phone: string | null;
  registration_number: string | null;
  fuel_level: number | null;
  odometer_reading: number | null;
  body_type: BodyType;
  protocol_date: string;
  protocol_time: string | null;
  received_by: string | null;
  status: string;
  customer_signature: string | null;
  instance_id: string;
  protocol_type?: ProtocolType;
  photo_urls?: string[];
}

export default function PublicProtocolView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);
  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>([]);
  const [offerPublicToken, setOfferPublicToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocol = async () => {
      if (!token) {
        setError('Brak tokena protokołu');
        setLoading(false);
        return;
      }

      try {
        // Single RPC call — replaces 4 separate table queries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'get_protocol_by_token',
          { p_token: token },
        );

        if (rpcError) {
          if (rpcError.message?.includes('not found')) {
            setError('Protokół nie został znaleziony');
          } else {
            throw rpcError;
          }
          setLoading(false);
          return;
        }

        const data = rpcData as {
          protocol: Protocol;
          instance: Instance;
          damage_points: Array<{
            id: string;
            view: string;
            x_percent: number;
            y_percent: number;
            damage_type?: string;
            custom_note?: string;
            photo_url?: string;
            photo_urls?: string[];
          }>;
          offer_public_token: string | null;
        };

        setProtocol(data.protocol);
        setInstance(data.instance);
        setOfferPublicToken(data.offer_public_token);

        if (data.damage_points) {
          setDamagePoints(
            data.damage_points.map((p) => ({
              id: p.id,
              view: p.view as VehicleView,
              x_percent: p.x_percent,
              y_percent: p.y_percent,
              damage_type: p.damage_type || undefined,
              custom_note: p.custom_note || undefined,
              photo_url: p.photo_url || undefined,
              photo_urls: p.photo_urls || undefined,
            })),
          );
        }
      } catch (err) {
        console.error('Error fetching protocol:', err);
        setError('Wystąpił błąd podczas ładowania protokołu');
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !protocol || !instance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-semibold mb-2">
              {error || 'Protokół nie został znaleziony'}
            </h1>
            <p className="text-muted-foreground">
              Sprawdź poprawność linku lub skontaktuj się z serwisem.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Protokół przyjęcia pojazdu | {instance.name}</title>
        <meta
          name="description"
          content={`Protokół przyjęcia pojazdu ${protocol.vehicle_model || ''} ${protocol.registration_number || ''}`}
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <PublicProtocolCustomerView
        protocol={protocol}
        instance={instance}
        damagePoints={damagePoints}
        offerPublicToken={offerPublicToken}
      />
    </>
  );
}
