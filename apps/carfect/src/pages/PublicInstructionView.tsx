import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@shared/ui';
import { supabase } from '@/integrations/supabase/client';
import {
  InstructionPublicView,
  usePublicInstruction,
} from '@shared/post-sale-instructions';

const LoadingCard = () => (
  <div className="min-h-screen flex items-center justify-center bg-muted">
    <Card>
      <CardContent className="p-8 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>...</span>
      </CardContent>
    </Card>
  </div>
);

const ErrorCard = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-muted px-4">
    <Card className="max-w-md w-full">
      <CardContent className="p-8 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  </div>
);

const PublicInstructionView = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = usePublicInstruction(token, supabase);

  if (!token) return <ErrorCard message={t('publicInstruction.invalidLink')} />;
  if (isLoading) return <LoadingCard />;
  if (error || !data) return <ErrorCard message={t('publicInstruction.notFound')} />;

  return (
    <>
      <Helmet>
        <title>
          {t('publicInstruction.metaTitle', {
            title: data.title,
            name: data.instance.name ?? '',
          })}
        </title>
      </Helmet>
      <InstructionPublicView data={data} publicToken={token} />
    </>
  );
};

export default PublicInstructionView;
