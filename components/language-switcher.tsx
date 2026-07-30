"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact = false }: Props) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (next: AppLocale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((code) => {
        const label = code === "ar" ? t("arabic") : t("english");
        const active = locale === code;
        return (
          <Button
            key={code}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 px-2 text-xs",
              compact && "min-w-8 px-1.5",
              active && "font-semibold",
            )}
            onClick={() => switchLocale(code)}
            aria-pressed={active}
            title={label}
          >
            {compact ? (code === "ar" ? "ع" : "EN") : label}
          </Button>
        );
      })}
    </div>
  );
}
