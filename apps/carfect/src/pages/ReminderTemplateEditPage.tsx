import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import { Button } from '@shared/ui';
import { Input } from '@shared/ui';
import { Label } from '@shared/ui';
import { Textarea } from '@shared/ui';
import { Tabs, TabsContent } from '@shared/ui';
import { AdminTabsList, AdminTabsTrigger } from '@/components/admin/AdminTabsList';
import { useAuth } from '@/hooks/useAuth';
import { useReminderTemplate } from '@/hooks/useReminderTemplate';
import { TemplateAssignedCustomers } from '@/components/admin/TemplateAssignedCustomers';
import { TemplateAssignedServices } from '@/components/admin/TemplateAssignedServices';

interface ReminderTemplateEditPageProps {
  inlineShortId?: string;
  onBack?: () => void;
}

export default function ReminderTemplateEditPage({ inlineShortId, onBack }: ReminderTemplateEditPageProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { shortId: routeShortId } = useParams<{ shortId: string }>();
  const shortId = inlineShortId || routeShortId;
  const [searchParams] = useSearchParams();
  const { roles } = useAuth();

  const instanceId = roles.find((r) => r.instance_id)?.instance_id || null;

  const returnToService = searchParams.get('returnToService');
  const serviceId = searchParams.get('serviceId');

  const isNew = shortId === 'new' || location.pathname.endsWith('/reminders/new');
  const isAdminPath = location.pathname.startsWith('/admin');
  const remindersBasePath = isAdminPath ? '/admin/reminders' : '/reminders';

  const [activeTab, setActiveTab] = useState<'template' | 'services' | 'customers'>('template');

  const hook = useReminderTemplate(instanceId, shortId);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (returnToService === 'true') {
      const pricingPath = isAdminPath ? '/admin/pricelist' : '/pricelist';
      navigate(pricingPath);
    } else {
      navigate(remindersBasePath);
    }
  };

  const handleSave = () => {
    hook.save((newId) => {
      if (onBack) {
        onBack();
      } else if (returnToService === 'true' && serviceId) {
        const pricingPath = isAdminPath ? '/admin/pricelist' : '/pricelist';
        navigate(`${pricingPath}?serviceId=${serviceId}&assignedReminderId=${newId}`);
      } else {
        navigate(remindersBasePath);
      }
    });
  };

  if (hook.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 sm:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">
          {isNew ? t('reminders.addTemplate') : t('reminders.editTemplate')}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'template' | 'services' | 'customers')}>
        {/* Tabs - only for existing templates */}
        {!isNew && (
          <AdminTabsList columns={3}>
            <AdminTabsTrigger value="template">{t('reminders.tabs.template')}</AdminTabsTrigger>
            <AdminTabsTrigger value="services">{t('common.services')}</AdminTabsTrigger>
            <AdminTabsTrigger value="customers">
              {t('reminders.tabs.assignedCustomers')}
            </AdminTabsTrigger>
          </AdminTabsList>
        )}
        {/* Template Form Tab */}
        <TabsContent value="template" className="mt-0">
          <div className="py-6">
          <div className="bg-white border rounded-lg p-6 space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('reminderTemplates.name')} *</Label>
              <Input
                id="name"
                value={hook.name}
                onChange={(e) => hook.setName(e.target.value)}
                placeholder={t('reminderTemplates.namePlaceholder')}
              />
            </div>

            {/* Repeat Count + Interval Months — single row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repeatCount">{t('reminders.repeatCount')}</Label>
                <Input
                  id="repeatCount"
                  type="number"
                  min={1}
                  max={20}
                  value={hook.repeatCount}
                  onChange={(e) => hook.setRepeatCount(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalMonths">{t('reminders.intervalMonths')}</Label>
                <Input
                  id="intervalMonths"
                  type="number"
                  min={1}
                  max={60}
                  value={hook.intervalMonths}
                  onChange={(e) => hook.setIntervalMonths(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Schedule Preview */}
            <p className="text-sm text-muted-foreground">
              {t('reminders.schedulePreview')}: {hook.schedulePreview}
            </p>

            {/* Channel info */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm">
                {t('reminders.channelInfoHint')}
              </p>
            </div>

            {/* SMS Template */}
            <div className="space-y-2">
              <Label htmlFor="smsTemplate">{t('reminders.smsTemplate')}</Label>
              <Textarea
                id="smsTemplate"
                value={hook.smsTemplate}
                onChange={(e) => hook.setSmsTemplate(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t('reminders.placeholderHint')}</p>
            </div>

            {/* Email Template */}
            <div className="space-y-4 pt-2">
              <Label className="text-base font-semibold">{t('reminders.emailTemplate')}</Label>

              <div className="space-y-2">
                <Label htmlFor="email-subject">{t('reminders.emailSubject')}</Label>
                <Input
                  id="email-subject"
                  value={hook.emailSubject}
                  onChange={(e) => hook.setEmailSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">{t('reminders.emailBody')}</Label>
                <Textarea
                  id="email-body"
                  value={hook.emailBody}
                  onChange={(e) => hook.setEmailBody(e.target.value)}
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">{t('reminders.placeholderHint')}</p>
              </div>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* Assigned Services Tab */}
        <TabsContent value="services" className="mt-0">
          <div className="py-6">
            <TemplateAssignedServices templateId={hook.templateId} instanceId={instanceId} />
          </div>
        </TabsContent>

        {/* Assigned Customers Tab */}
        <TabsContent value="customers" className="mt-0">
          <div className="py-6">
            <TemplateAssignedCustomers templateId={hook.templateId} instanceId={instanceId} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky Footer Buttons - only show in template tab */}
      {activeTab === 'template' && (
        <div className="border-t pt-4 mt-6">
          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={handleBack} disabled={hook.saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={hook.saving}>
              {hook.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
