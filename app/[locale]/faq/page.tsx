import { getTranslations } from "next-intl/server";
import { LegalShell, LegalSection } from "@/components/legal-shell";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cookies" });
  return {
    title: t("metaFaqTitle"),
    description: t("metaFaqDescription"),
  };
}

export default async function FaqPage() {
  const t = await getTranslations("cookies");

  const items = [
    { q: "faqOrgQ", a: "faqOrgA" },
    { q: "faqCodeQ", a: "faqCodeA" },
    { q: "faqInviteQ", a: "faqInviteA" },
    { q: "faqCookiesQ", a: "faqCookiesA" },
    { q: "faqRightsQ", a: "faqRightsA" },
    { q: "faqTermsQ", a: "faqTermsA" },
  ] as const;

  return (
    <LegalShell title={t("faqTitle")} updated="August 9, 2026">
      <p>{t("faqIntro")}</p>
      {items.map((item) => (
        <LegalSection key={item.q} title={t(item.q)}>
          <p>{t(item.a)}</p>
        </LegalSection>
      ))}
    </LegalShell>
  );
}
