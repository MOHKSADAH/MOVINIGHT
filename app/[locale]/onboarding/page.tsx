"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  AvatarPicker,
  applyAvatarSelection,
  type AvatarSelection,
} from "@/components/avatar-picker";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";

const NAME_MAX_LENGTH = 40;

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUser);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const setUploadedAvatar = useMutation(api.users.setUploadedAvatar);
  const setPresetAvatar = useMutation(api.users.setPresetAvatar);
  const clearAvatar = useMutation(api.users.clearAvatar);

  const [name, setName] = useState("");
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>({
    kind: "keep",
  });
  const [saving, setSaving] = useState(false);

  const alreadyOnboarded = !!user?.name?.trim();

  // Nothing to collect if the provider already gave us a name (e.g. Google).
  useEffect(() => {
    if (alreadyOnboarded) router.replace("/join-org");
  }, [alreadyOnboarded, router]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !saving;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await applyAvatarSelection(avatarSelection, {
        generateUploadUrl,
        setUploadedAvatar,
        setPresetAvatar,
        clearAvatar,
      });
      await updateUser({ name: trimmedName });
      router.replace("/join-org");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim()
          ? error.message
          : t("saveFailed"),
      );
      setSaving(false);
    }
  };

  return (
    <div className="auth-stage relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="auth-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="auth-stage-grain pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-col items-center text-center">
          <div className="absolute end-5 top-8 sm:end-8 sm:top-10">
            <LanguageSwitcher compact />
          </div>
          <BrandLogo className="h-16 sm:h-20" priority />
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          {user === undefined || alreadyOnboarded ? (
            <div className="space-y-4 rounded-lg border border-border/80 bg-card/70 p-5">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-6 rounded-lg border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="space-y-1.5 text-center">
                <h1 className="text-xl font-semibold tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-name">{t("nameLabel")}</Label>
                <Input
                  id="onboarding-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  maxLength={NAME_MAX_LENGTH}
                  autoFocus
                  autoComplete="name"
                  required
                />
                <p className="text-xs text-muted-foreground">{t("nameHint")}</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{t("avatarTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("avatarSubtitle")}
                  </p>
                </div>
                <AvatarPicker
                  currentAvatar={user?.avatar ?? user?.image ?? undefined}
                  selection={avatarSelection}
                  onSelectionChange={setAvatarSelection}
                  fallbackInitial={trimmedName[0]?.toUpperCase()}
                  disabled={saving}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {saving ? tCommon("saving") : t("submit")}
              </Button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
