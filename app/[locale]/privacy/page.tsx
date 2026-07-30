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
    title: t("metaPrivacyTitle"),
    description: t("metaPrivacyDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");

  return (
    <LegalShell title={t("privacyTitle")} updated="July 30, 2026">
      <p>{t("privacyIntro")}</p>

      <LegalSection title={t("privacyWhoWeAreTitle")}>
        <p>
          {t("privacyWhoWeAreBody", {
            operatorName: SITE_OPERATOR_NAME,
            email: SITE_CONTACT_EMAIL,
          })}
        </p>
      </LegalSection>

      <LegalSection title={t("privacyCollectTitle")}>
        <p>{t("privacyCollectIntro")}</p>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("privacyCollectAccount")}</li>
          <li>{t("privacyCollectActivity")}</li>
          <li>{t("privacyCollectTechnical")}</li>
        </ul>
        <p>{t("privacyCollectTmdb")}</p>
      </LegalSection>

      <LegalSection title={t("privacyUseTitle")}>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("privacyUse1")}</li>
          <li>{t("privacyUse2")}</li>
          <li>{t("privacyUse3")}</li>
          <li>{t("privacyUse4")}</li>
        </ul>
        <p>{t("privacyNoSell")}</p>
      </LegalSection>

      <LegalSection title={t("privacyGoogleTitle")}>
        <p>{t("privacyGoogleBody")}</p>
      </LegalSection>

      <LegalSection title={t("privacyProvidersTitle")}>
        <p>{t("privacyProvidersBody")}</p>
      </LegalSection>

      <LegalSection title={t("privacyRetentionTitle")}>
        <p>{t("privacyRetentionBody", { email: SITE_CONTACT_EMAIL })}</p>
      </LegalSection>

      <LegalSection title={t("privacyChoicesTitle")}>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("privacyChoices1")}</li>
          <li>{t("privacyChoices2")}</li>
          <li>{t("privacyChoices3")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("privacyChildrenTitle")}>
        <p>{t("privacyChildrenBody")}</p>
      </LegalSection>

      <LegalSection title={t("privacyChangesTitle")}>
        <p>{t("privacyChangesBody")}</p>
      </LegalSection>

      <LegalSection title={t("privacyContactTitle")}>
        <p>{t("privacyContactBody", { email: SITE_CONTACT_EMAIL })}</p>
      </LegalSection>
    </LegalShell>
  );
}
