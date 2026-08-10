import { getTranslations } from "next-intl/server";
import { LegalShell } from "@/components/legal-shell";
import { TermsDocument } from "@/components/legal-documents";

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

  return (
    <LegalShell title={t("termsTitle")} updated="August 9, 2026">
      <TermsDocument />
    </LegalShell>
  );
}
