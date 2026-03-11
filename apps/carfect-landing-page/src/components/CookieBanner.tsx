'use client';

import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CookieConsent {
  necessary: boolean;
  analytical: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'carfect-cookie-consent';

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    analytical: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    setMounted(true);
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      const parsed = JSON.parse(savedConsent);
      setConsent(parsed);
      applyConsent(parsed);
    }
  }, []);

  const applyConsent = (consentData: CookieConsent) => {
    // Apply Google Analytics consent
    if (typeof window !== 'undefined') {
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (gtag) {
        gtag('consent', 'update', {
          analytics_storage: consentData.analytical ? 'granted' : 'denied',
          ad_storage: consentData.marketing ? 'granted' : 'denied',
          functionality_storage: consentData.functional ? 'granted' : 'denied',
        });
      }
    }
  };

  const saveConsent = (consentData: CookieConsent) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setConsent(consentData);
    applyConsent(consentData);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookieConsent = {
      necessary: true,
      analytical: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allAccepted);
  };

  const handleRejectAll = () => {
    const onlyNecessary: CookieConsent = {
      necessary: true,
      analytical: false,
      marketing: false,
      functional: false,
    };
    saveConsent(onlyNecessary);
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Używamy cookies do działania serwisu oraz – za zgodą – do analityki i marketingu.
                Możesz zaakceptować wszystkie lub dostosować ustawienia.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Ustawienia
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
              >
                Odrzucam
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
              >
                Akceptuję
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ustawienia plików cookies</DialogTitle>
            <DialogDescription>
              Wybierz, które kategorie plików cookies chcesz zaakceptować. Pliki niezbędne są wymagane do działania strony.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Necessary Cookies */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="necessary"
                checked={consent.necessary}
                disabled
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div className="flex-1">
                <label htmlFor="necessary" className="font-semibold text-foreground block mb-1">
                  Pliki niezbędne (wymagane)
                </label>
                <p className="text-sm text-muted-foreground">
                  Te pliki cookies są niezbędne do działania strony i nie mogą być wyłączone.
                  Zwykle są ustawiane tylko w odpowiedzi na Twoje działania, takie jak ustawienie
                  preferencji prywatności.
                </p>
              </div>
            </div>

            {/* Analytical Cookies */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="analytical"
                checked={consent.analytical}
                onChange={(e) => setConsent({ ...consent, analytical: e.target.checked })}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div className="flex-1">
                <label htmlFor="analytical" className="font-semibold text-foreground block mb-1">
                  Pliki analityczne
                </label>
                <p className="text-sm text-muted-foreground">
                  Te pliki cookies pozwalają nam analizować ruch na stronie i zrozumieć,
                  jak użytkownicy z niej korzystają. Wszystkie informacje są agregowane i anonimowe.
                  Używamy Google Analytics.
                </p>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="marketing"
                checked={consent.marketing}
                onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div className="flex-1">
                <label htmlFor="marketing" className="font-semibold text-foreground block mb-1">
                  Pliki marketingowe
                </label>
                <p className="text-sm text-muted-foreground">
                  Te pliki cookies mogą być ustawiane przez naszych partnerów reklamowych.
                  Mogą być wykorzystywane do budowania profilu Twoich zainteresowań i pokazywania
                  odpowiednich reklam.
                </p>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="functional"
                checked={consent.functional}
                onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <div className="flex-1">
                <label htmlFor="functional" className="font-semibold text-foreground block mb-1">
                  Pliki funkcjonalne
                </label>
                <p className="text-sm text-muted-foreground">
                  Te pliki cookies pozwalają na zapamiętanie wyborów dokonanych przez użytkownika
                  (np. język, region) i zapewniają ulepszone, bardziej osobiste funkcje.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6 gap-2">
            <Button
              variant="outline"
              onClick={handleRejectAll}
            >
              Odrzucam wszystkie
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
              >
                Anuluj
              </Button>
              <Button onClick={handleSaveSettings}>
                Zapisz ustawienia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
