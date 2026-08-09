"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SITE_CONTACT_EMAIL, SITE_CONTACT_MAILTO } from "@/lib/site";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("legal");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-10 space-y-4 border-b border-border pb-8">
          <Link href="/login" className="inline-block">
            <BrandLogo className="h-12" priority />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {tCommon("lastUpdated", { date: updated })}
            </p>
          </div>
        </header>

        <article className="legal-prose space-y-8 text-sm leading-relaxed text-muted-foreground">
          {children}
        </article>

        <footer className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
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
            href="/faq"
            className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            FAQ
          </Link>
          <Link
            href="/about"
            className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t("about")}
          </Link>
          <Link
            href="/login"
            className="text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t("signIn")}
          </Link>
          <a
            href={SITE_CONTACT_MAILTO}
            className="hover:text-foreground transition-colors"
          >
            {SITE_CONTACT_EMAIL}
          </a>
        </footer>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
