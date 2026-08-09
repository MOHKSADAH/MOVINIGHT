"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Settings2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function OrgSwitcher({ collapsed }: { collapsed?: boolean }) {
  const t = useTranslations("org");
  const orgs = useQuery(api.organizations.listMine);
  const active = useQuery(api.organizations.getActive);
  const setActive = useMutation(api.organizations.setActive);

  if (!orgs || orgs.length === 0) return null;

  if (collapsed) {
    return (
      <Link
        href="/org/settings"
        title={active?.name ?? t("switcherLabel")}
        className="flex justify-center rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      >
        <Settings2 className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div className={cn("space-y-1 px-1")}>
      <p className="px-2 text-xs text-muted-foreground">{t("switcherLabel")}</p>
      <select
        className="w-full rounded-md border border-border bg-sidebar px-2 py-2 text-sm"
        value={active?._id ?? ""}
        onChange={(e) => {
          const value = e.target.value as Id<"organizations">;
          if (!value) return;
          void setActive({ orgId: value }).catch((err: unknown) =>
            toast.error(err instanceof Error ? err.message : "Failed"),
          );
        }}
      >
        {orgs.map((org) => (
          <option key={org._id} value={org._id}>
            {org.name}
          </option>
        ))}
      </select>
      <Link
        href="/org/settings"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
        {t("settings")}
      </Link>
    </div>
  );
}
