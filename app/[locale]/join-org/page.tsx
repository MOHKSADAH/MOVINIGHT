"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  LegalDocumentDialog,
  type LegalDocumentKind,
} from "@/components/legal-documents";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import {
  isValidOrgCode,
  normalizeOrgCode,
} from "@/convex/lib/orgConstants";
import { cn } from "@/lib/utils";

const legalLinkClass =
  "text-sky-700/80 underline underline-offset-2 hover:text-sky-800 dark:text-sky-400/70 dark:hover:text-sky-300";

const easeOut = [0.16, 1, 0.3, 1] as const;

type FieldErrors = {
  name?: string;
  code?: string;
};

export default function JoinOrgPage() {
  const t = useTranslations("org");
  const tLegal = useTranslations("legal");
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const gate = useQuery(api.organizations.needsOrgGate);
  const createOrg = useMutation(api.organizations.create);
  const joinByCode = useMutation(api.organizations.joinByCode);
  const acceptLegal = useMutation(api.users.acceptLegal);

  const [mode, setMode] = useState<"create" | "join">("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocumentKind | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!gate) return;
    if (gate.needsOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (!gate.needsOrg && !gate.needsTerms) {
      router.replace("/");
    }
  }, [gate, router]);

  useEffect(() => {
    setFieldErrors({});
  }, [mode]);

  if (gate === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  const needsTermsFirst = gate.needsTerms;
  const panelKey =
    needsTermsFirst && !gate.needsOrg ? "terms-only" : "join-create";

  const fadeSlide = reduceMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.28, ease: easeOut },
      };

  const validateJoin = (): boolean => {
    const errors: FieldErrors = {};
    const normalized = normalizeOrgCode(code);
    if (!code.trim()) errors.code = t("codeRequired");
    else if (!isValidOrgCode(normalized)) errors.code = t("codeInvalid");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCreate = (): boolean => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) errors.name = t("nameRequired");
    else if (trimmedName.length < 2) errors.name = t("nameTooShort");

    const trimmedCode = code.trim();
    if (trimmedCode) {
      const normalized = normalizeOrgCode(trimmedCode);
      if (!isValidOrgCode(normalized)) errors.code = t("codeInvalid");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAcceptTerms = async () => {
    if (!terms) {
      toast.error(t("termsRequired"));
      return;
    }
    setSaving(true);
    try {
      await acceptLegal({});
      // Stay on this page when org setup is still required; the gate query
      // will swap the UI to create/join. Only leave once both gates clear.
      if (!gate.needsOrg) {
        router.replace("/");
      }
    } catch {
      toast.error(t("acceptLegalFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gate.needsTerms && !terms) {
      toast.error(t("termsRequired"));
      return;
    }
    if (!validateCreate()) return;
    setSaving(true);
    try {
      if (gate.needsTerms) await acceptLegal({});
      await createOrg({
        name: name.trim(),
        code: code.trim() || undefined,
      });
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gate.needsTerms && !terms) {
      toast.error(t("termsRequired"));
      return;
    }
    if (!validateJoin()) return;
    setSaving(true);
    try {
      if (gate.needsTerms) await acceptLegal({});
      await joinByCode({ code });
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("joinFailed"));
    } finally {
      setSaving(false);
    }
  };

  const openLegal = (
    event: React.MouseEvent<HTMLButtonElement>,
    kind: LegalDocumentKind,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setLegalDoc(kind);
  };

  const termsBlock = (
    <div className="flex items-start gap-2 text-sm leading-relaxed">
      <label htmlFor="terms-checkbox" className="mt-1 shrink-0 cursor-pointer">
        <input
          id="terms-checkbox"
          type="checkbox"
          className="size-4 accent-primary"
          checked={terms}
          aria-labelledby="terms-agreement-text"
          onChange={(e) => setTerms(e.target.checked)}
        />
      </label>
      <span id="terms-agreement-text">
        {t("termsAgreePrefix")}{" "}
        <button
          type="button"
          className={cn(legalLinkClass, "font-medium")}
          onClick={(event) => openLegal(event, "terms")}
        >
          {tLegal("termsOfService")}
        </button>{" "}
        {t("termsAgreeAnd")}{" "}
        <button
          type="button"
          className={cn(legalLinkClass, "font-medium")}
          onClick={(event) => openLegal(event, "privacy")}
        >
          {tLegal("privacyPolicy")}
        </button>
        .
      </span>
    </div>
  );

  return (
    <LazyMotion features={domAnimation} strict>
    <div className="auth-stage relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="auth-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="auth-stage-grain pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8">
        <header className="auth-enter flex flex-col items-center text-center">
          <div className="absolute end-5 top-8">
            <LanguageSwitcher compact />
          </div>
          <BrandLogo className="h-16" priority />
        </header>

        <main className="auth-enter-delay flex flex-1 flex-col justify-center py-8">
          <m.div
            className="flex flex-col gap-5 rounded-lg border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: easeOut, delay: 0.05 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {needsTermsFirst && !gate.needsOrg ? (
                <m.div
                  key={panelKey}
                  className="flex flex-col gap-5"
                  {...fadeSlide}
                >
                  <div className="space-y-1 text-center">
                    <h1 className="text-xl font-semibold">{t("termsTitle")}</h1>
                    <p className="text-sm text-muted-foreground">
                      {t("termsSubtitle")}
                    </p>
                  </div>
                  {termsBlock}
                  <Button
                    className="w-full"
                    disabled={saving}
                    onClick={() => void handleAcceptTerms()}
                  >
                    {t("acceptLegal")}
                  </Button>
                </m.div>
              ) : (
                <m.div
                  key={panelKey}
                  className="flex flex-col gap-5"
                  {...fadeSlide}
                >
                  <div className="space-y-1 text-center">
                    <h1 className="text-xl font-semibold">{t("joinTitle")}</h1>
                    <p className="text-sm text-muted-foreground">
                      {t("joinSubtitle")}
                    </p>
                  </div>

                  <div className="relative flex gap-2">
                    <Button
                      type="button"
                      variant={mode === "join" ? "default" : "outline"}
                      className="flex-1 transition-colors"
                      onClick={() => setMode("join")}
                    >
                      {t("joinTab")}
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "create" ? "default" : "outline"}
                      className="flex-1 transition-colors"
                      onClick={() => setMode("create")}
                    >
                      {t("createTab")}
                    </Button>
                  </div>

                  {gate.needsTerms && termsBlock}

                  <div className="relative overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      {mode === "join" ? (
                        <m.form
                          key="join"
                          noValidate
                          className="flex flex-col gap-4"
                          onSubmit={(e) => void handleJoin(e)}
                          initial={
                            reduceMotion ? false : { opacity: 0, x: -10 }
                          }
                          animate={{ opacity: 1, x: 0 }}
                          exit={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, x: 10 }
                          }
                          transition={{ duration: 0.22, ease: easeOut }}
                        >
                          <FieldGroup className="gap-4">
                            <Field data-invalid={!!fieldErrors.code || undefined}>
                              <FieldLabel htmlFor="join-code">
                                {t("orgCode")}
                              </FieldLabel>
                              <Input
                                id="join-code"
                                value={code}
                                onChange={(e) => {
                                  setCode(e.target.value);
                                  if (fieldErrors.code) {
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      code: undefined,
                                    }));
                                  }
                                }}
                                placeholder={t("orgCodePlaceholder")}
                                aria-invalid={!!fieldErrors.code}
                              />
                              <FieldError>{fieldErrors.code}</FieldError>
                            </Field>
                          </FieldGroup>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={saving}
                          >
                            {t("joinSubmit")}
                          </Button>
                        </m.form>
                      ) : (
                        <m.form
                          key="create"
                          noValidate
                          className="flex flex-col gap-4"
                          onSubmit={(e) => void handleCreate(e)}
                          initial={
                            reduceMotion ? false : { opacity: 0, x: 10 }
                          }
                          animate={{ opacity: 1, x: 0 }}
                          exit={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, x: -10 }
                          }
                          transition={{ duration: 0.22, ease: easeOut }}
                        >
                          <FieldGroup className="gap-4">
                            <Field data-invalid={!!fieldErrors.name || undefined}>
                              <FieldLabel htmlFor="org-name">
                                {t("orgName")}
                              </FieldLabel>
                              <Input
                                id="org-name"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  if (fieldErrors.name) {
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      name: undefined,
                                    }));
                                  }
                                }}
                                placeholder={t("orgNamePlaceholder")}
                                aria-invalid={!!fieldErrors.name}
                              />
                              <FieldError>{fieldErrors.name}</FieldError>
                            </Field>
                            <Field data-invalid={!!fieldErrors.code || undefined}>
                              <FieldLabel htmlFor="org-code">
                                {t("orgCode")}
                              </FieldLabel>
                              <Input
                                id="org-code"
                                value={code}
                                onChange={(e) => {
                                  setCode(e.target.value);
                                  if (fieldErrors.code) {
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      code: undefined,
                                    }));
                                  }
                                }}
                                placeholder={t("orgCodePlaceholder")}
                                aria-invalid={!!fieldErrors.code}
                              />
                              {fieldErrors.code ? (
                                <FieldError>{fieldErrors.code}</FieldError>
                              ) : (
                                <FieldDescription>
                                  {t("orgCodeHint")}
                                </FieldDescription>
                              )}
                            </Field>
                          </FieldGroup>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={saving}
                          >
                            {t("createSubmit")}
                          </Button>
                        </m.form>
                      )}
                    </AnimatePresence>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        </main>
      </div>

      <LegalDocumentDialog
        document={legalDoc}
        open={legalDoc !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDoc(null);
        }}
      />
    </div>
    </LazyMotion>
  );
}
