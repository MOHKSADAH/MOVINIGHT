"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";

export default function JoinOrgPage() {
  const t = useTranslations("org");
  const router = useRouter();
  const gate = useQuery(api.organizations.needsOrgGate);
  const createOrg = useMutation(api.organizations.create);
  const joinByCode = useMutation(api.organizations.joinByCode);
  const acceptLegal = useMutation(api.users.acceptLegal);

  const [mode, setMode] = useState<"create" | "join">("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);

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

  if (gate === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-40 w-full max-w-md" />
      </div>
    );
  }

  const needsTermsFirst = gate.needsTerms;

  const handleAcceptTerms = async () => {
    if (!terms) {
      toast.error(t("termsRequired"));
      return;
    }
    setSaving(true);
    try {
      await acceptLegal({});
      if (!gate.needsOrg) router.replace("/");
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
      setSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gate.needsTerms && !terms) {
      toast.error(t("termsRequired"));
      return;
    }
    setSaving(true);
    try {
      if (gate.needsTerms) await acceptLegal({});
      await joinByCode({ code });
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("joinFailed"));
      setSaving(false);
    }
  };

  const termsBlock = (
    <label className="flex items-start gap-2 text-sm leading-relaxed">
      <input
        type="checkbox"
        className="mt-1 size-4 accent-primary"
        checked={terms}
        onChange={(e) => setTerms(e.target.checked)}
      />
      <span>
        {t("termsLabel")}{" "}
        <Link
          href="/terms"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Terms
        </Link>{" "}
        ·{" "}
        <Link
          href="/privacy"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Privacy
        </Link>
      </span>
    </label>
  );

  return (
    <div className="auth-stage relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="auth-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8">
        <header className="flex flex-col items-center text-center">
          <div className="absolute end-5 top-8">
            <LanguageSwitcher compact />
          </div>
          <BrandLogo className="h-16" priority />
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <div className="space-y-5 rounded-lg border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
            {needsTermsFirst && !gate.needsOrg ? (
              <>
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
              </>
            ) : (
              <>
                <div className="space-y-1 text-center">
                  <h1 className="text-xl font-semibold">{t("joinTitle")}</h1>
                  <p className="text-sm text-muted-foreground">
                    {t("joinSubtitle")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === "join" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setMode("join")}
                  >
                    {t("joinTab")}
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "create" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setMode("create")}
                  >
                    {t("createTab")}
                  </Button>
                </div>

                {gate.needsTerms && termsBlock}

                {mode === "join" ? (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => void handleJoin(e)}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="join-code">{t("orgCode")}</Label>
                      <Input
                        id="join-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={t("orgCodePlaceholder")}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>
                      {t("joinSubmit")}
                    </Button>
                  </form>
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => void handleCreate(e)}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="org-name">{t("orgName")}</Label>
                      <Input
                        id="org-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("orgNamePlaceholder")}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-code">{t("orgCode")}</Label>
                      <Input
                        id="org-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={t("orgCodePlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("orgCodeHint")}
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>
                      {t("createSubmit")}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
