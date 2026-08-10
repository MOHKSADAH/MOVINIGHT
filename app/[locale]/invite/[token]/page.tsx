"use client";

import { useState } from "react";
import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

export default function InviteAcceptPage() {
  const t = useTranslations("org");
  const routeParams = useParams<{ token: string }>();
  const token =
    typeof routeParams.token === "string" ? routeParams.token : "";
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const invite = useQuery(
    api.organizationInvites.getByToken,
    token ? { token } : "skip",
  );
  const accept = useMutation(api.organizationInvites.accept);
  const acceptLegal = useMutation(api.users.acceptLegal);
  const user = useQuery(api.users.getCurrentUser);
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isLoading || invite === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!invite || invite.expired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <BrandLogo className="h-12" />
        <p className="text-muted-foreground">{t("inviteExpired")}</p>
        <Button asChild>
          <Link href="/join-org">{t("joinTab")}</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <BrandLogo className="h-12" />
        <h1 className="text-xl font-semibold">{t("inviteTitle")}</h1>
        <p className="text-muted-foreground">
          {t("inviteSubtitle", { orgName: invite.orgName })}
        </p>
        <p className="text-sm text-muted-foreground">{t("inviteNeedLogin")}</p>
        <Button asChild>
          <Link href={`/login?next=/invite/${token}`}>{t("inviteNeedLogin")}</Link>
        </Button>
      </div>
    );
  }

  const handleAccept = async () => {
    if (user && !user.hasAcceptedTerms && !terms) {
      toast.error(t("termsRequired"));
      return;
    }
    setSaving(true);
    try {
      if (user && !user.hasAcceptedTerms) await acceptLegal({});
      await accept({ token });
      router.replace("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("inviteAcceptFailed"),
      );
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <BrandLogo className="h-12" />
      <h1 className="text-xl font-semibold">{t("inviteTitle")}</h1>
      <p className="text-muted-foreground">
        {t("inviteSubtitle", { orgName: invite.orgName })}
      </p>
      {user && !user.hasAcceptedTerms && (
        <label className="flex max-w-md items-start gap-2 text-start text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-primary"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>{t("termsLabel")}</span>
        </label>
      )}
      <Button disabled={saving} onClick={() => void handleAccept()}>
        {t("inviteAccept")}
      </Button>
    </div>
  );
}
