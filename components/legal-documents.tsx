"use client";

import { useTranslations } from "next-intl";
import { LegalSection } from "@/components/legal-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SITE_CONTACT_EMAIL,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

const LEGAL_UPDATED = "August 9, 2026";

export function TermsDocument() {
  const t = useTranslations("legal");
  const tc = useTranslations("cookies");

  return (
    <>
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
    </>
  );
}

export function PrivacyDocument() {
  const t = useTranslations("legal");
  const tc = useTranslations("cookies");

  return (
    <>
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

      <LegalSection title={tc("privacyOrgsTitle")}>
        <p>{tc("privacyOrgsBody")}</p>
      </LegalSection>

      <LegalSection title={tc("privacyCookiesTitle")}>
        <p>{tc("privacyCookiesBody")}</p>
      </LegalSection>

      <LegalSection title={tc("privacyPdplTitle")}>
        <p>{tc("privacyPdplBody", { email: SITE_CONTACT_EMAIL })}</p>
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
    </>
  );
}

export type LegalDocumentKind = "terms" | "privacy";

export function LegalDocumentDialog({
  document,
  open,
  onOpenChange,
}: {
  document: LegalDocumentKind | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("legal");
  const tCommon = useTranslations("common");
  const kind = document ?? "terms";
  const title = kind === "terms" ? t("termsTitle") : t("privacyTitle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-5 text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="font-mono text-[11px] uppercase tracking-[0.16em]">
            {tCommon("lastUpdated", { date: LEGAL_UPDATED })}
          </DialogDescription>
        </DialogHeader>
        <div className="legal-prose min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-muted-foreground">
          {kind === "terms" ? <TermsDocument /> : <PrivacyDocument />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
