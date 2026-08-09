import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SITE_CONTACT_EMAIL, SITE_CONTACT_MAILTO } from "@/lib/site";
import { cn } from "@/lib/utils";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("auth");
  const locale = await getLocale();
  const isArabic = locale === "ar";

  return (
    <div className="auth-stage relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="auth-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-stage-grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8 sm:px-8 sm:py-10">
        <header className="auth-enter flex flex-col items-center text-center">
          <div className="absolute end-5 top-8 sm:end-8 sm:top-10">
            <LanguageSwitcher compact />
          </div>
          <BrandLogo className="h-20 sm:h-24" priority />
          <p
            className={cn(
              "mt-4 max-w-[22rem] text-muted-foreground",
              isArabic
                ? "text-sm font-medium leading-relaxed tracking-normal"
                : "font-mono text-[11px] uppercase tracking-[0.22em]",
            )}
          >
            {t("tagline")}
          </p>
        </header>

        <main className="auth-enter-delay flex flex-1 flex-col justify-center py-10">
          {children}
        </main>

        <footer className="auth-enter-delay-2 space-y-3 border-t border-border/70 pt-5 text-center">
          <nav
            aria-label={t("legalNavAriaLabel")}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          >
            <Link
              href="/privacy"
              className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("termsOfService")}
            </Link>
            <Link
              href="/about"
              className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {t("about")}
            </Link>
          </nav>
          <p className="text-[11px] text-muted-foreground/80">
            {t("contactPrefix")}{" "}
            <a
              href={SITE_CONTACT_MAILTO}
              className="text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              {SITE_CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
