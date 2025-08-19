"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CookiePreferencesContent } from "./CookiePreferencesContent";
import Link from "next/link";

export interface CookiePreferences {
  functional: boolean;
  performance: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [currentPreferences, setCurrentPreferences] =
    useState<CookiePreferences>({
      functional: false,
      performance: false,
      marketing: false,
    });

  useEffect(() => {
    const storedConsent = localStorage.getItem("cookie_consent");

    if (!storedConsent) {
      setShowBanner(true);
    } else if (storedConsent === "custom_preferences") {
      try {
        const storedPrefs = localStorage.getItem("cookie_preferences");
        if (storedPrefs) {
          setCurrentPreferences(JSON.parse(storedPrefs));
        }
      } catch (e) {
        console.error("Failed to parse stored cookie preferences:", e);
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const preferences: CookiePreferences = {
      functional: true,
      performance: true,
      marketing: true,
    };
    localStorage.setItem("cookie_consent", "accepted_all");
    localStorage.setItem("cookie_preferences", JSON.stringify(preferences));
    setCurrentPreferences(preferences); 
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const preferences: CookiePreferences = {
      functional: false,
      performance: false,
      marketing: false,
    };
    localStorage.setItem("cookie_consent", "rejected_all");
    localStorage.setItem("cookie_preferences", JSON.stringify(preferences))
    setCurrentPreferences(preferences); 
    setShowBanner(false);
  };

  const handleSavePreferences = (preferences: CookiePreferences) => {
    localStorage.setItem("cookie_consent", "custom_preferences");
    localStorage.setItem("cookie_preferences", JSON.stringify(preferences)); 
    setCurrentPreferences(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border p-4 shadow-lg z-50">
      <div className="max-w-4xl mx-auto  flex flex-col xl:flex-row items-center justify-between gap-4">
        {showPreferences ? (
          <CookiePreferencesContent
            onSave={handleSavePreferences}
            initialPreferences={currentPreferences}
          />
        ) : (
          <>
            <p className="text-xs text-muted-foreground flex-grow">
              Използваме бисквитки, за да осигурим най-доброто изживяване на
              нашия уебсайт. За повече подробности, моля, вижте нашата{" "}
              <Link href="/privacy-policy" className="underline">
                Политика за поверителност
              </Link>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-2 min-w-[200px]">
              <Button onClick={handleAcceptAll} className="w-full sm:w-auto">
                Приеми Всички
              </Button>
              <Button
                variant="secondary"
                onClick={handleRejectAll}
                className="w-full sm:w-auto">
                Отхвърли Всички
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreferences(true)}
                className="w-full sm:w-auto">
                Управление на Настройките
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
