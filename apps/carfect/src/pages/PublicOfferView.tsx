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

  // Auto-print when ?print=true is in the URL
  useEffect(() => {
    if (shouldPrint && !loading && offer) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, loading, offer]);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!token) {
        setError(t('publicOffer.invalidLink'));
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('offers')
          .select(
            `
            id, instance_id, offer_number, public_token, status, customer_data,
            vehicle_data, total_net, total_gross, vat_rate, notes, payment_terms,
            warranty, service_info, valid_until, hide_unit_prices, created_at,
            approved_at, viewed_at, selected_state, has_unified_services,
            offer_options (
              id, name, description, is_selected, subtotal_net, sort_order,
              scope_id, is_upsell,
              scope:offer_scopes (
                id,
                name,
                description,
                is_extras_scope,
                photo_urls
              ),
              offer_option_items (
                id, custom_name, custom_description, quantity, unit_price,
                unit, discount_percent, is_optional, is_custom, product_id, sort_order
              )
            ),
            instances (
              id,
              name,
              logo_url,
              phone,
              email,
              address,
              website,
              social_facebook,
              social_instagram,
              offer_branding_enabled,
              offer_bg_color,
              offer_header_bg_color,
              offer_header_text_color,
              offer_section_bg_color,
              offer_section_text_color,
              offer_primary_color,
              offer_scope_header_text_color,
              offer_portfolio_url,
              offer_google_reviews_url,
              contact_person,
              offer_bank_company_name,
              offer_bank_account_number,
              offer_bank_name,
              offer_trust_header_title,
              offer_trust_description,
              offer_trust_tiles
            )
          `,
          )
          .eq('public_token', token)
          .single();

        if (error) throw error;
        if (!data) {
          setError(t('publicOffer.notFound'));
          return;
        }

        // Fetch product descriptions separately (same approach as OfferPreviewDialog)
        // This ensures descriptions are loaded even when FK relation doesn't work
        const productIds = [
          ...new Set(
            (data.offer_options || []).flatMap(
              (opt: { offer_option_items?: { product_id?: string }[] }) =>
                (opt.offer_option_items || []).map((item) => item.product_id).filter(Boolean),
            ),
          ),
        ] as string[];

        let productDetails: Record<string, { description?: string; photo_urls?: string[] | null }> =
          {};
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from('unified_services')
            .select('id, description, photo_urls')
            .in('id', productIds);

          if (productsData) {
            productsData.forEach((p) => {
              productDetails[p.id] = {
                description: p.description ?? undefined,
                photo_urls: p.photo_urls,
              };
            });
          }
        }

        // Enrich offer_option_items with unified_services data
        const enrichedData = {
          ...data,
          offer_options: (data.offer_options || []).map(
            (opt: { offer_option_items?: { product_id?: string }[] }) => ({
              ...opt,
              offer_option_items: (opt.offer_option_items || []).map(
                (item: { product_id?: string }) => ({
                  ...item,
                  unified_services:
                    item.product_id && productDetails[item.product_id]
                      ? productDetails[item.product_id]
                      : null,
                }),
              ),
            }),
          ),
        };

        const fetchedOffer = enrichedData as unknown as PublicOfferData;
        setOffer(fetchedOffer);

        // Mark as viewed if not already (skip for authenticated admins and print mode)
        const isUserAdmin =
          user && (hasRole('super_admin') || hasInstanceRole('admin', data.instance_id));
        if (data.status === 'sent' && !isUserAdmin && !shouldPrint) {
          await supabase.rpc('mark_offer_viewed', { p_token: token });
        }
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
  }, [token, t, isAdminPreview]);

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
        onClose={isAdmin ? () => navigate(-1) : undefined}
      />
    </>
  );
};

export default PublicOfferView;
