import { getTranslations } from "next-intl/server";
import { LegalShell } from "@/components/legal-shell";
import { PrivacyDocument } from "@/components/legal-documents";

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
    <LegalShell title={t("privacyTitle")} updated="August 9, 2026">
      <PrivacyDocument />
    </LegalShell>
  );
}
