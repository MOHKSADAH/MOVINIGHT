import { getTranslations } from "next-intl/server";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import {
  SITE_CONTACT_EMAIL,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("metaTermsTitle"),
    description: t("metaTermsDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const tc = await getTranslations("cookies");

  return (
    <LegalShell title={t("termsTitle")} updated="August 9, 2026">
      <p>
        {t("termsIntro", {
          operatorName: SITE_OPERATOR_NAME,
        })}
      </p>

      <LegalSection title={t("termsServiceTitle")}>
        <p>{t("termsServiceBody")}</p>
      </LegalSection>

      <LegalSection title={tc("termsOrgsTitle")}>
        <p>{tc("termsOrgsBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsAccountsTitle")}>
        <p>{t("termsAccountsBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsAcceptableUseTitle")}>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("termsAcceptableUse1")}</li>
          <li>{t("termsAcceptableUse2")}</li>
          <li>{t("termsAcceptableUse3")}</li>
          <li>{t("termsAcceptableUse4")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("termsContentTitle")}>
        <p>{t("termsContentBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsThirdPartyTitle")}>
        <p>{t("termsThirdPartyBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsAvailabilityTitle")}>
        <p>{t("termsAvailabilityBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsDisclaimerTitle")}>
        <p>{t("termsDisclaimerBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsTerminationTitle")}>
        <p>{t("termsTerminationBody", { email: SITE_CONTACT_EMAIL })}</p>
      </LegalSection>

      <LegalSection title={t("termsChangesTitle")}>
        <p>{t("termsChangesBody")}</p>
      </LegalSection>

      <LegalSection title={t("termsContactTitle")}>
        <p>{t("termsContactBody", { email: SITE_CONTACT_EMAIL })}</p>
      </LegalSection>
    </LegalShell>
  );
}
