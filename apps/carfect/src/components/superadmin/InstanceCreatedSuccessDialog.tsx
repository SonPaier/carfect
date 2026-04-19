import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/ui";
import { Button } from "@shared/ui";
import { Separator } from "@shared/ui";
import { toast } from "sonner";
import { CheckCircle2, Copy, Globe, User } from "lucide-react";
import type { SuccessData } from "./AddInstanceDialog";
import { useTranslation } from "react-i18next";

interface InstanceCreatedSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: SuccessData | null;
}

export function InstanceCreatedSuccessDialog({
  open,
  onOpenChange,
  data
}: InstanceCreatedSuccessDialogProps) {
  const { t } = useTranslation();

  if (!data) return null;

  const publicDomain = `${data.slug}.carfect.pl`;
  const adminDomain = `${data.slug}.admin.carfect.pl`;

  const handleCopyAll = () => {
    const text = [
      t('superAdmin.instanceCreatedSuccessDialog.clipboardInstance', { name: data.instanceName }),
      '',
      t('superAdmin.instanceCreatedSuccessDialog.clipboardSubdomains'),
      t('superAdmin.instanceCreatedSuccessDialog.clipboardPublic', { domain: publicDomain }),
      t('superAdmin.instanceCreatedSuccessDialog.clipboardAdmin', { domain: adminDomain }),
      '',
      t('superAdmin.instanceCreatedSuccessDialog.clipboardLoginData'),
      t('superAdmin.instanceCreatedSuccessDialog.clipboardLogin', { login: data.adminUsername }),
      t('superAdmin.instanceCreatedSuccessDialog.clipboardEmail', { email: data.adminEmail }),
      t('superAdmin.instanceCreatedSuccessDialog.clipboardPassword', { password: data.adminPassword }),
    ].join('\n');

    navigator.clipboard.writeText(text);
    toast.success(t('superAdmin.instanceCreatedSuccessDialog.copiedAll'));
  };

  const handleCopyDomains = () => {
    const text = `${t('superAdmin.instanceCreatedSuccessDialog.publicDomain')} ${publicDomain}\n${t('superAdmin.instanceCreatedSuccessDialog.adminDomain')} ${adminDomain}`;
    navigator.clipboard.writeText(text);
    toast.success(t('superAdmin.instanceCreatedSuccessDialog.copiedDomains'));
  };

  const handleCopyCredentials = () => {
    const text = `${t('superAdmin.instanceCreatedSuccessDialog.loginLabel')} ${data.adminUsername}\n${t('superAdmin.instanceCreatedSuccessDialog.emailLabel')} ${data.adminEmail}\n${t('superAdmin.instanceCreatedSuccessDialog.passwordLabel')} ${data.adminPassword}`;
    navigator.clipboard.writeText(text);
    toast.success(t('superAdmin.instanceCreatedSuccessDialog.copiedCredentials'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            {t('superAdmin.instanceCreatedSuccessDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('superAdmin.instanceCreatedSuccessDialog.successMessage', { name: data.instanceName })}
          </p>

          {/* DNS Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {t('superAdmin.instanceCreatedSuccessDialog.configureDns')}
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyDomains} className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1" />
                {t('superAdmin.instanceCreatedSuccessDialog.copyDomains')}
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 font-mono text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">
                  {t('superAdmin.instanceCreatedSuccessDialog.publicDomain')}
                </span>
                <span className="font-medium">{publicDomain}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">
                  {t('superAdmin.instanceCreatedSuccessDialog.adminDomain')}
                </span>
                <span className="font-medium">{adminDomain}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('superAdmin.instanceCreatedSuccessDialog.dnsNote')}
            </p>
          </div>

          <Separator />

          {/* Admin Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                {t('superAdmin.instanceCreatedSuccessDialog.adminCredentials')}
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyCredentials} className="h-7 text-xs">
                <Copy className="h-3 w-3 mr-1" />
                {t('superAdmin.instanceCreatedSuccessDialog.copyCredentials')}
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t('superAdmin.instanceCreatedSuccessDialog.loginLabel')}
                </span>
                <span className="font-medium font-mono">{data.adminUsername}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t('superAdmin.instanceCreatedSuccessDialog.emailLabel')}
                </span>
                <span className="font-medium font-mono">{data.adminEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  {t('superAdmin.instanceCreatedSuccessDialog.passwordLabel')}
                </span>
                <span className="font-medium font-mono">{data.adminPassword}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCopyAll}>
            <Copy className="h-4 w-4 mr-2" />
            {t('superAdmin.instanceCreatedSuccessDialog.copyAll')}
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            {t('superAdmin.instanceCreatedSuccessDialog.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
