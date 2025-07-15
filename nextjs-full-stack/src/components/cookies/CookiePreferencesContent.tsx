"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CookiePreferences } from "./CookieBanner";

interface CookiePreferencesContentProps {
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences?: CookiePreferences;
}

export function CookiePreferencesContent({
  onSave,
  initialPreferences,
}: CookiePreferencesContentProps) {
  const [functionalEnabled, setFunctionalEnabled] = useState(
    initialPreferences?.functional ?? false
  );
  const [performanceEnabled, setPerformanceEnabled] = useState(
    initialPreferences?.performance ?? false
  );
  const [marketingEnabled, setMarketingEnabled] = useState(
    initialPreferences?.marketing ?? false
  );

  useEffect(() => {
    if (initialPreferences) {
      setFunctionalEnabled(initialPreferences.functional);
      setPerformanceEnabled(initialPreferences.performance);
      setMarketingEnabled(initialPreferences.marketing);
    }
  }, [initialPreferences])

  const handleSave = () => {
    onSave({
      functional: functionalEnabled,
      performance: performanceEnabled,
      marketing: marketingEnabled,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Настройки за Бисквитки</CardTitle>
        <CardDescription>
          Управлявайте настройките си за бисквитки тук.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="necessary" className="flex flex-col items-start">
            <span>Строго Необходими</span>
            <span className="text-muted-foreground leading-snug font-normal text-sm">
              Тези бисквитки са от съществено значение за използването на
              уебсайта и неговите функции.
            </span>
          </Label>
          <Switch
            id="necessary"
            defaultChecked
            disabled
            aria-label="Строго Необходими"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="functional" className="flex flex-col items-start">
            <span>Функционални Бисквитки</span>
            <span className="text-muted-foreground leading-snug font-normal text-sm">
              Тези бисквитки позволяват на уебсайта да предоставя
              персонализирана функционалност и да запомня вашия избор (напр.
              език, регион).
            </span>
          </Label>
          <Switch
            id="functional"
            checked={functionalEnabled}
            onCheckedChange={setFunctionalEnabled}
            aria-label="Функционални"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="performance" className="flex flex-col items-start">
            <span>Бисквитки за Ефективност/Анализ</span>
            <span className="text-muted-foreground leading-snug font-normal text-sm">
              Тези бисквитки ни помагат да разберем как посетителите
              взаимодействат с уебсайта, като събират анонимна информация за
              посещения и производителност.
            </span>
          </Label>
          <Switch
            id="performance"
            checked={performanceEnabled}
            onCheckedChange={setPerformanceEnabled}
            aria-label="Ефективност/Анализ"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="marketing" className="flex flex-col items-start">
            <span>Бисквитки за Таргетиране/Маркетинг</span>
            <span className="text-muted-foreground leading-snug font-normal text-sm">
              Тези бисквитки се използват за показване на реклами, които са
              по-подходящи за вас и вашите интереси, въз основа на вашето
              разглеждане.
            </span>
          </Label>
          <Switch
            id="marketing"
            checked={marketingEnabled}
            onCheckedChange={setMarketingEnabled}
            aria-label="Таргетиране/Маркетинг"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleSave}>
          Запази Предпочитания
        </Button>
      </CardFooter>
    </Card>
  );
}
