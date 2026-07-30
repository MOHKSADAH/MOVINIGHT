import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import { Button } from "@/components/ui/button";
import {
  SITE_CONTACT_EMAIL,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("metaAboutTitle"),
    description: t("metaAboutDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("legal");

  return (
    <LegalShell title={t("aboutTitle")} updated="July 30, 2026">
      <p className="text-foreground">{t("aboutIntro")}</p>

      <LegalSection title={t("aboutWhatWeBuildTitle")}>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("aboutWhatWeBuild1")}</li>
          <li>{t("aboutWhatWeBuild2")}</li>
          <li>{t("aboutWhatWeBuild3")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("aboutOperatorTitle")}>
        <p>
          {t("aboutOperatorBody", {
            operatorName: SITE_OPERATOR_NAME,
            email: SITE_CONTACT_EMAIL,
          })}
        </p>
        <p>{t("aboutOAuthNote")}</p>
      </LegalSection>

      <LegalSection title={t("aboutMovieDataTitle")}>
        <p>
          {t("aboutMovieDataBody")}{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            TMDB
          </a>
        </p>
      </LegalSection>

      <div className="pt-2">
        <Button asChild>
          <Link href="/login">{t("signIn")}</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
