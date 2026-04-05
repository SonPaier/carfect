import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import {
  PublicOfferCustomerView,
  PublicOfferData,
} from '@/components/offers/PublicOfferCustomerView';

const PublicOfferView = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasRole, hasInstanceRole } = useAuth();
  const isAdminPreview = searchParams.get('admin') === 'true';
  const [offer, setOffer] = useState<PublicOfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldPrint = searchParams.get('print') === 'true';


  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) {
        setError(t('publicOffer.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        // Single RPC call replaces 3+ separate table queries
        const { data: rpcData, error } = await supabase.rpc('get_public_offer', {
          p_token: token,
          p_skip_mark_viewed: isAdminPreview || shouldPrint,
        });

        if (error) throw error;
        if (!rpcData) {
          setError(t('publicOffer.notFound'));
          return;
        }

        const data = rpcData as Record<string, unknown>;
        const productDescriptions = (data.product_descriptions || {}) as Record<
          string,
          { description?: string; photo_urls?: string[] | null }
        >;

        // Enrich offer_option_items with product descriptions from RPC response
        const enrichedData = {
          ...data,
          offer_options: (
            (data.offer_options || []) as { offer_option_items?: { product_id?: string }[] }[]
          ).map((opt) => ({
            ...opt,
            offer_option_items: ((opt.offer_option_items || []) as { product_id?: string }[]).map(
              (item) => ({
                ...item,
                unified_services:
                  item.product_id && productDescriptions[item.product_id]
                    ? productDescriptions[item.product_id]
                    : null,
              }),
            ),
          })),
        };

        const fetchedOffer = enrichedData as unknown as PublicOfferData;
        setOffer(fetchedOffer);

        // mark_offer_viewed is already called inside the RPC,
        // but skip re-marking for admin preview
        // (RPC always marks, which is fine — admin views are rare)
      } catch (err) {
        console.error('Error fetching offer:', err);
        // Report unexpected backend errors to Sentry
        const { captureBackendError } = await import('@/lib/sentry');
        captureBackendError(
          'fetchPublicOffer',
          {
            code: (err as { code?: string })?.code,
            message: (err as Error)?.message,
            details: err,
          },
          { token },
        );
        setError(t('publicOffer.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [token, t, isAdminPreview, shouldPrint]);

  // Check if user is admin for this offer's instance
  const isAdmin =
    user && offer && (hasRole('super_admin') || hasInstanceRole('admin', offer.instance_id));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('common.error')}</h2>
            <p className="text-muted-foreground">{error || t('publicOffer.notFound')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const instance = offer.instances;

  return (
    <>
      <Helmet>
        <title>
          Oferta {offer.offer_number} – {instance?.name || 'Firma'}
        </title>
        <meta
          name="description"
          content={`Oferta ${offer.offer_number} od ${instance?.name || 'firmy'}: usługi, pozycje i podsumowanie kosztów.`}
        />
        {typeof window !== 'undefined' && <link rel="canonical" href={window.location.href} />}
      </Helmet>

      <PublicOfferCustomerView
        offer={offer}
        mode="public"
        embedded={false}
        isAdmin={isAdmin ?? false}
        isPrintMode={shouldPrint}
        onClose={isAdmin ? () => navigate(-1) : undefined}
      />
    </>
  );
};

export default PublicOfferView;
