"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  setCookieConsent,
  type CookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  const t = useTranslations("cookies");
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );
  const [optional, setOptional] = useState(false);

  // Hide once the user has saved a preference.
  if (consent !== null) return null;

  const save = (next: CookieConsent) => {
    setCookieConsent(next);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t("cookieBannerTitle")}</p>
          <p className="text-muted-foreground leading-relaxed">
            {t("cookieBannerBody")}{" "}
            <Link href="/faq" className="underline underline-offset-2">
              {t("cookieManage")}
            </Link>
          </p>
          <label className="mt-2 flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked
              disabled
              className="size-4 accent-primary"
            />
            {t("cookieNecessary")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={optional}
              onChange={(e) => setOptional(e.target.checked)}
              className="size-4 accent-primary"
            />
            {t("cookieOptional")}
          </label>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              save({ necessary: true, optional: false, updatedAt: Date.now() })
            }
          >
            {t("cookieNecessaryOnly")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              save({
                necessary: true,
                optional,
                updatedAt: Date.now(),
              })
            }
          >
            {t("cookieAcceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
