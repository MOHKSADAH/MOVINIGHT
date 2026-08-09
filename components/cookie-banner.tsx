"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";

function getSnapshot(): CookieConsent | null {
  return getCookieConsent();
}

function getServerSnapshot(): CookieConsent | null {
  return null;
}

export function CookieBanner() {
  const t = useTranslations("cookies");
  const consent = useSyncExternalStore(
    subscribeCookieConsent,
    getSnapshot,
    getServerSnapshot,
  );
  const [openPrefs, setOpenPrefs] = useState(false);
  const [optional, setOptional] = useState(false);

  const visible = consent === null;

  const prefs = useMemo(
    () => ({
      necessary: true as const,
      optional: optional,
    }),
    [optional],
  );

  if (!visible && !openPrefs) return null;

  const save = (next: CookieConsent) => {
    setCookieConsent(next);
    setOpenPrefs(false);
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
          {(visible || openPrefs) && (
            <label className="mt-2 flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked
                disabled
                className="size-4 accent-primary"
              />
              {t("cookieNecessary")}
            </label>
          )}
          {(visible || openPrefs) && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={optional || consent?.optional === true}
                onChange={(e) => setOptional(e.target.checked)}
                className="size-4 accent-primary"
              />
              {t("cookieOptional")}
            </label>
          )}
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
                optional: prefs.optional || consent?.optional === true,
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
